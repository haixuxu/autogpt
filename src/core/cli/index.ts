import type { Command } from 'commander';

export interface CliBootstrapOptions {
  readonly configLoader: unknown;
}

export interface CliFactory {
  create(options: CliBootstrapOptions): Command;
}

export const createPlaceholderCli: CliFactory = {
  create() {
    throw new Error('CLI not yet implemented');
  },
};
