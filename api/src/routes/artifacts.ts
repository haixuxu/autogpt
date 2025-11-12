import type { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';
import { createWriteStream, createReadStream } from 'fs';
import { mkdir, stat, unlink } from 'fs/promises';
import { join, basename, extname } from 'path';
import { pipeline } from 'stream/promises';
import { lookup } from 'mime-types';

const prisma = new PrismaClient();

// Directory for storing artifacts
const ARTIFACTS_DIR = process.env.ARTIFACTS_DIR || join(process.cwd(), 'artifacts');

interface ArtifactParams {
  taskId: string;
  stepId: string;
  artifactId?: string;
}

interface ArtifactQuerystring {
  page?: string;
  pageSize?: string;
}

// Transform DB artifact to Agent Protocol format
function transformArtifact(artifact: any) {
  return {
    artifact_id: artifact.id,
    file_name: artifact.fileName,
    relative_path: artifact.relativePath,
    uri: artifact.uri,
    mime_type: artifact.mimeType,
    size_bytes: artifact.sizeBytes,
    created_at: artifact.createdAt.toISOString(),
  };
}

// Ensure artifacts directory exists
async function ensureArtifactsDir() {
  try {
    await mkdir(ARTIFACTS_DIR, { recursive: true });
  } catch (error) {
    // Directory might already exist, ignore
  }
}

const artifactsRoutes: FastifyPluginAsync = async (fastify) => {
  // Initialize artifacts directory
  await ensureArtifactsDir();

  // List all artifacts for a step
  fastify.get<{
    Params: ArtifactParams;
    Querystring: ArtifactQuerystring;
  }>('/:taskId/steps/:stepId/artifacts', async (request, reply) => {
    const { taskId, stepId } = request.params;
    const page = parseInt(request.query.page || '1', 10);
    const pageSize = parseInt(request.query.pageSize || '20', 10);

    try {
      // Verify step exists and belongs to task
      const step = await prisma.step.findUnique({
        where: { id: stepId },
      });

      if (!step || step.agentId !== taskId) {
        return reply.status(404).send({
          error: 'Step not found',
          step_id: stepId,
          task_id: taskId,
        });
      }

      // Get artifacts with pagination
      const [artifacts, total] = await Promise.all([
        prisma.artifact.findMany({
          where: { stepId },
          orderBy: { createdAt: 'desc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.artifact.count({
          where: { stepId },
        }),
      ]);

      const totalPages = Math.ceil(total / pageSize);

      return {
        artifacts: artifacts.map(transformArtifact),
        pagination: {
          total,
          page,
          pageSize,
          totalPages,
        },
      };
    } catch (error) {
      fastify.log.error('Error listing artifacts:', error);
      return reply.status(500).send({
        error: 'Failed to list artifacts',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get a specific artifact metadata
  fastify.get<{
    Params: ArtifactParams;
  }>('/:taskId/steps/:stepId/artifacts/:artifactId', async (request, reply) => {
    const { taskId, stepId, artifactId } = request.params;

    try {
      const artifact = await prisma.artifact.findUnique({
        where: { id: artifactId },
        include: { step: true },
      });

      if (!artifact || artifact.stepId !== stepId || artifact.step.agentId !== taskId) {
        return reply.status(404).send({
          error: 'Artifact not found',
          artifact_id: artifactId,
          step_id: stepId,
          task_id: taskId,
        });
      }

      return transformArtifact(artifact);
    } catch (error) {
      fastify.log.error('Error getting artifact:', error);
      return reply.status(500).send({
        error: 'Failed to get artifact',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Download artifact file
  fastify.get<{
    Params: ArtifactParams;
  }>('/:taskId/steps/:stepId/artifacts/:artifactId/download', async (request, reply) => {
    const { taskId, stepId, artifactId } = request.params;

    try {
      const artifact = await prisma.artifact.findUnique({
        where: { id: artifactId },
        include: { step: true },
      });

      if (!artifact || artifact.stepId !== stepId || artifact.step.agentId !== taskId) {
        return reply.status(404).send({
          error: 'Artifact not found',
          artifact_id: artifactId,
          step_id: stepId,
          task_id: taskId,
        });
      }

      // Get file path from URI
      const filePath = artifact.uri.replace('file://', '');

      try {
        await stat(filePath);
      } catch {
        return reply.status(404).send({
          error: 'Artifact file not found on disk',
          artifact_id: artifactId,
        });
      }

      // Set content type and disposition
      reply.header('Content-Type', artifact.mimeType || 'application/octet-stream');
      reply.header('Content-Disposition', `attachment; filename="${artifact.fileName}"`);
      reply.header('Content-Length', artifact.sizeBytes);

      // Stream the file
      const fileStream = createReadStream(filePath);
      return reply.send(fileStream);
    } catch (error) {
      fastify.log.error('Error downloading artifact:', error);
      return reply.status(500).send({
        error: 'Failed to download artifact',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Upload artifact file
  fastify.post<{
    Params: ArtifactParams;
  }>('/:taskId/steps/:stepId/artifacts', async (request, reply) => {
    const { taskId, stepId } = request.params;

    try {
      // Verify step exists and belongs to task
      const step = await prisma.step.findUnique({
        where: { id: stepId },
      });

      if (!step || step.agentId !== taskId) {
        return reply.status(404).send({
          error: 'Step not found',
          step_id: stepId,
          task_id: taskId,
        });
      }

      // Get multipart data
      const data = await request.file();

      if (!data) {
        return reply.status(400).send({
          error: 'No file provided',
        });
      }

      // Generate unique filename
      const originalName = data.filename;
      const ext = extname(originalName);
      const timestamp = Date.now();
      const uniqueName = `${taskId}_${stepId}_${timestamp}_${basename(originalName, ext)}${ext}`;
      const filePath = join(ARTIFACTS_DIR, uniqueName);

      // Save file to disk
      const writeStream = createWriteStream(filePath);
      await pipeline(data.file, writeStream);

      // Get file size
      const fileStats = await stat(filePath);
      const sizeBytes = fileStats.size;

      // Detect MIME type
      const mimeType = data.mimetype || lookup(originalName) || 'application/octet-stream';

      // Get relative path (for display purposes)
      const relativePath = request.body?.relative_path as string | undefined;

      // Create artifact record
      const artifact = await prisma.artifact.create({
        data: {
          stepId,
          fileName: originalName,
          relativePath: relativePath || null,
          uri: `file://${filePath}`,
          mimeType,
          sizeBytes,
        },
      });

      // Emit WebSocket event
      const wsHub = (fastify as any).wsHub;
      if (wsHub) {
        wsHub.broadcast({
          type: 'artifact.created',
          task_id: taskId,
          step_id: stepId,
          artifact_id: artifact.id,
          data: transformArtifact(artifact),
          timestamp: new Date().toISOString(),
        });
      }

      fastify.log.info(`Artifact uploaded: ${originalName} (${sizeBytes} bytes)`);

      return reply.status(201).send(transformArtifact(artifact));
    } catch (error) {
      fastify.log.error('Error uploading artifact:', error);
      return reply.status(500).send({
        error: 'Failed to upload artifact',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Delete artifact
  fastify.delete<{
    Params: ArtifactParams;
  }>('/:taskId/steps/:stepId/artifacts/:artifactId', async (request, reply) => {
    const { taskId, stepId, artifactId } = request.params;

    try {
      const artifact = await prisma.artifact.findUnique({
        where: { id: artifactId },
        include: { step: true },
      });

      if (!artifact || artifact.stepId !== stepId || artifact.step.agentId !== taskId) {
        return reply.status(404).send({
          error: 'Artifact not found',
          artifact_id: artifactId,
          step_id: stepId,
          task_id: taskId,
        });
      }

      // Delete file from disk
      const filePath = artifact.uri.replace('file://', '');
      try {
        await unlink(filePath);
      } catch (error) {
        fastify.log.warn(`Failed to delete artifact file: ${filePath}`, error);
        // Continue with database deletion even if file deletion fails
      }

      // Delete artifact record
      await prisma.artifact.delete({
        where: { id: artifactId },
      });

      fastify.log.info(`Artifact deleted: ${artifact.fileName}`);

      return reply.status(204).send();
    } catch (error) {
      fastify.log.error('Error deleting artifact:', error);
      return reply.status(500).send({
        error: 'Failed to delete artifact',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
};

export default artifactsRoutes;

