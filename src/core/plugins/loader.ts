import { readdir, readFile } from 'fs/promises';
import { join } from 'path';
import { existsSync } from 'fs';
import type {
  PluginLoader,
  PluginManifest,
  PluginModule,
  PluginModuleFactory,
  PluginConfig,
} from './index';
import { ManifestValidator } from './manifest-validator';

export class DefaultPluginLoader implements PluginLoader {
  private validator = new ManifestValidator();

  constructor(private config: PluginConfig) {}

  async discover(): Promise<PluginManifest[]> {
    if (!this.config.enabled) {
      return [];
    }

    const manifests: PluginManifest[] = [];

    for (const directory of this.config.directories) {
      if (!existsSync(directory)) {
        continue;
      }

      const entries = await readdir(directory, { withFileTypes: true });

      for (const entry of entries) {
        if (!entry.isDirectory()) continue;

        const manifestPath = join(directory, entry.name, 'autogpt-plugin.json');
        
        if (existsSync(manifestPath)) {
          try {
            const content = await readFile(manifestPath, 'utf-8');
            const manifest = this.validator.validate(JSON.parse(content));
            manifests.push(manifest);
          } catch (error) {
            console.warn(`Failed to load plugin manifest from ${manifestPath}:`, error);
          }
        }
      }
    }

    return manifests;
  }

  async load(manifest: PluginManifest): Promise<PluginModule> {
    const factory = await this.resolve(manifest);
    const module = await factory();

    // Validate that module exports required properties
    if (!module.manifest) {
      throw new Error(`Plugin ${manifest.name} does not export manifest`);
    }
    if (!module.register) {
      throw new Error(`Plugin ${manifest.name} does not export register function`);
    }

    return module;
  }

  async resolve(manifest: PluginManifest): Promise<PluginModuleFactory> {
    // In Node.js, we can dynamically import ESM modules
    const modulePath = this.resolveModulePath(manifest);

    return async () => {
      try {
        const imported = await import(modulePath);
        return imported.default || imported;
      } catch (error) {
        throw new Error(`Failed to load plugin module from ${modulePath}: ${error}`);
      }
    };
  }

  private resolveModulePath(manifest: PluginManifest): string {
    // Find the plugin directory
    for (const directory of this.config.directories) {
      const pluginDir = join(directory, manifest.name);
      const entryPath = join(pluginDir, manifest.entry);

      if (existsSync(entryPath)) {
        return entryPath;
      }
    }

    throw new Error(`Plugin entry point not found: ${manifest.entry}`);
  }
}

