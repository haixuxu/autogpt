#!/usr/bin/env node

import 'dotenv/config';
import { DefaultConfigLoader, EnvConfigSource, JsonConfigSource } from './core/config/index';
import { WinstonLogger } from './core/telemetry/index';
import { AutoGPTCli } from './core/cli/index';

async function main() {
  try {
    // Setup config loader
    const configLoader = new DefaultConfigLoader();
    configLoader.register(new JsonConfigSource('./config.json'));
    configLoader.register(new EnvConfigSource()); // Env overrides JSON

    // Load config
    const config = await configLoader.resolve();

    // Setup logger
    const logger = new WinstonLogger(config.telemetry);

    // Create and run CLI
    const cli = new AutoGPTCli({ configLoader, logger });
    await cli.run(process.argv);
  } catch (error) {
    console.error('Fatal error:', error);
    process.exit(1);
  }
}

main();

