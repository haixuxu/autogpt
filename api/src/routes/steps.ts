import type { FastifyPluginAsync } from 'fastify';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

interface StepParams {
  taskId: string;
  stepId?: string;
}

interface StepQuerystring {
  page?: string;
  pageSize?: string;
}

interface CreateStepBody {
  name?: string;
  input?: Record<string, unknown>;
  additional_input?: Record<string, unknown>;
}

// Transform DB step to Agent Protocol format
function transformStep(step: any, taskId: string) {
  return {
    step_id: step.id,
    task_id: taskId,
    name: step.name,
    status: step.status,
    input: step.input ? JSON.parse(step.input) : {},
    output: step.output ? JSON.parse(step.output) : null,
    additional_input: step.additionalInput ? JSON.parse(step.additionalInput) : {},
    additional_output: step.additionalOutput ? JSON.parse(step.additionalOutput) : {},
    artifacts: step.artifacts?.map((artifact: any) => ({
      artifact_id: artifact.id,
      file_name: artifact.fileName,
      relative_path: artifact.relativePath,
      uri: artifact.uri,
    })) || [],
    is_last: step.isLast,
    created_at: step.createdAt.toISOString(),
    started_at: step.startedAt?.toISOString() || null,
    completed_at: step.completedAt?.toISOString() || null,
  };
}

const stepsRoutes: FastifyPluginAsync = async (fastify) => {
  // List all steps for a task
  fastify.get<{
    Params: StepParams;
    Querystring: StepQuerystring;
  }>('/:taskId/steps', async (request, reply) => {
    const { taskId } = request.params;
    const page = parseInt(request.query.page || '1', 10);
    const pageSize = parseInt(request.query.pageSize || '20', 10);

    try {
      // Verify task (agent) exists
      const agent = await prisma.agent.findUnique({
        where: { id: taskId },
      });

      if (!agent) {
        return reply.status(404).send({
          error: 'Task not found',
          task_id: taskId,
        });
      }

      // Get steps with pagination
      const [steps, total] = await Promise.all([
        prisma.step.findMany({
          where: { agentId: taskId },
          include: { artifacts: true },
          orderBy: { stepIndex: 'asc' },
          skip: (page - 1) * pageSize,
          take: pageSize,
        }),
        prisma.step.count({
          where: { agentId: taskId },
        }),
      ]);

      const totalPages = Math.ceil(total / pageSize);

      return {
        steps: steps.map((step) => transformStep(step, taskId)),
        pagination: {
          total,
          page,
          pageSize,
          totalPages,
        },
      };
    } catch (error) {
      fastify.log.error('Error listing steps:', error);
      return reply.status(500).send({
        error: 'Failed to list steps',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Get a specific step
  fastify.get<{
    Params: StepParams;
  }>('/:taskId/steps/:stepId', async (request, reply) => {
    const { taskId, stepId } = request.params;

    try {
      const step = await prisma.step.findUnique({
        where: { id: stepId },
        include: { artifacts: true },
      });

      if (!step || step.agentId !== taskId) {
        return reply.status(404).send({
          error: 'Step not found',
          step_id: stepId,
          task_id: taskId,
        });
      }

      return transformStep(step, taskId);
    } catch (error) {
      fastify.log.error('Error getting step:', error);
      return reply.status(500).send({
        error: 'Failed to get step',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Create a new step
  fastify.post<{
    Params: StepParams;
    Body: CreateStepBody;
  }>('/:taskId/steps', async (request, reply) => {
    const { taskId } = request.params;
    const { name, input, additional_input } = request.body;

    try {
      // Verify task (agent) exists
      const agent = await prisma.agent.findUnique({
        where: { id: taskId },
      });

      if (!agent) {
        return reply.status(404).send({
          error: 'Task not found',
          task_id: taskId,
        });
      }

      // Get the next step index
      const lastStep = await prisma.step.findFirst({
        where: { agentId: taskId },
        orderBy: { stepIndex: 'desc' },
      });

      const stepIndex = (lastStep?.stepIndex ?? -1) + 1;

      // Create the step
      const step = await prisma.step.create({
        data: {
          agentId: taskId,
          stepIndex,
          name: name || `Step ${stepIndex + 1}`,
          input: JSON.stringify(input || {}),
          additionalInput: additional_input ? JSON.stringify(additional_input) : null,
          status: 'created',
        },
        include: { artifacts: true },
      });

      // Emit WebSocket event
      const wsHub = (fastify as any).wsHub;
      if (wsHub) {
        wsHub.broadcast({
          type: 'step.created',
          task_id: taskId,
          step_id: step.id,
          data: transformStep(step, taskId),
          timestamp: new Date().toISOString(),
        });
      }

      return reply.status(201).send(transformStep(step, taskId));
    } catch (error) {
      fastify.log.error('Error creating step:', error);
      return reply.status(500).send({
        error: 'Failed to create step',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });

  // Update a step (mark as started, completed, failed, etc.)
  fastify.patch<{
    Params: StepParams;
    Body: {
      status?: string;
      output?: Record<string, unknown>;
      additional_output?: Record<string, unknown>;
      is_last?: boolean;
    };
  }>('/:taskId/steps/:stepId', async (request, reply) => {
    const { taskId, stepId } = request.params;
    const { status, output, additional_output, is_last } = request.body;

    try {
      // Verify step exists and belongs to task
      const existingStep = await prisma.step.findUnique({
        where: { id: stepId },
      });

      if (!existingStep || existingStep.agentId !== taskId) {
        return reply.status(404).send({
          error: 'Step not found',
          step_id: stepId,
          task_id: taskId,
        });
      }

      // Prepare update data
      const updateData: any = {};

      if (status !== undefined) {
        updateData.status = status;
        
        if (status === 'running' && !existingStep.startedAt) {
          updateData.startedAt = new Date();
        }
        
        if ((status === 'completed' || status === 'failed') && !existingStep.completedAt) {
          updateData.completedAt = new Date();
        }
      }

      if (output !== undefined) {
        updateData.output = JSON.stringify(output);
      }

      if (additional_output !== undefined) {
        updateData.additionalOutput = JSON.stringify(additional_output);
      }

      if (is_last !== undefined) {
        updateData.isLast = is_last;
      }

      // Update the step
      const step = await prisma.step.update({
        where: { id: stepId },
        data: updateData,
        include: { artifacts: true },
      });

      // Emit WebSocket event
      const wsHub = (fastify as any).wsHub;
      if (wsHub && status) {
        wsHub.broadcast({
          type: `step.${status}`,
          task_id: taskId,
          step_id: step.id,
          data: transformStep(step, taskId),
          timestamp: new Date().toISOString(),
        });
      }

      return transformStep(step, taskId);
    } catch (error) {
      fastify.log.error('Error updating step:', error);
      return reply.status(500).send({
        error: 'Failed to update step',
        message: error instanceof Error ? error.message : 'Unknown error',
      });
    }
  });
};

export default stepsRoutes;

