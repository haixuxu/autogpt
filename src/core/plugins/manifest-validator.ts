import { z } from 'zod';
import type { PluginManifest } from './index';

const PluginCommandDefinitionSchema = z.object({
  name: z.string().min(1),
  description: z.string(),
  parameters: z.record(z.unknown()).optional(),
  outputSchema: z.record(z.unknown()).optional(),
});

const PluginManifestSchema = z.object({
  name: z.string().min(1),
  version: z.string().regex(/^\d+\.\d+\.\d+$/),
  description: z.string().optional(),
  entry: z.string().min(1),
  author: z.string().optional(),
  license: z.string().optional(),
  minAutoGptVersion: z.string().optional(),
  commands: z.array(PluginCommandDefinitionSchema).optional(),
  tools: z.array(z.string()).optional(),
});

export class ManifestValidator {
  private schema = PluginManifestSchema;

  validate(manifest: unknown): PluginManifest {
    try {
      return this.schema.parse(manifest) as PluginManifest;
    } catch (error) {
      throw new Error(`Invalid plugin manifest: ${error}`);
    }
  }

  validateVersion(manifest: PluginManifest, currentVersion: string): boolean {
    if (!manifest.minAutoGptVersion) {
      return true; // No version requirement
    }

    const [reqMajor, reqMinor, reqPatch] = manifest.minAutoGptVersion
      .split('.')
      .map(Number);
    const [curMajor, curMinor, curPatch] = currentVersion.split('.').map(Number);

    if (curMajor > reqMajor) return true;
    if (curMajor < reqMajor) return false;
    if (curMinor > reqMinor) return true;
    if (curMinor < reqMinor) return false;
    return curPatch >= reqPatch;
  }
}

