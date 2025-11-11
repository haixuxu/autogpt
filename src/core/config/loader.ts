import type { ConfigLoader, ConfigSource, AppConfig } from './index';
import { ConfigValidator } from './schema';
import { mergeConfigs } from './sources';

export class DefaultConfigLoader implements ConfigLoader {
  private sources: ConfigSource[] = [];

  register(source: ConfigSource): void {
    this.sources.push(source);
  }

  async resolve(): Promise<AppConfig> {
    let mergedConfig: Record<string, unknown> = {};

    // Load and merge all config sources in order
    for (const source of this.sources) {
      try {
        const config = await source.load();
        mergedConfig = mergeConfigs(mergedConfig, config);
      } catch (error) {
        throw new Error(
          `Failed to load config from source '${source.name}': ${error}`
        );
      }
    }

    // Validate and parse the merged configuration
    try {
      return ConfigValidator.parse(mergedConfig);
    } catch (error) {
      throw new Error(`Invalid configuration: ${error}`);
    }
  }
}

