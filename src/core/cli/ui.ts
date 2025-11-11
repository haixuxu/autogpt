import chalk from 'chalk';
import ora, { Ora } from 'ora';

export class CliUI {
  private spinner: Ora | null = null;

  info(message: string): void {
    console.log(chalk.blue('ℹ'), message);
  }

  success(message: string): void {
    console.log(chalk.green('✔'), message);
  }

  warning(message: string): void {
    console.log(chalk.yellow('⚠'), message);
  }

  error(message: string): void {
    console.log(chalk.red('✖'), message);
  }

  section(title: string): void {
    console.log('\n' + chalk.bold.cyan(title));
    console.log(chalk.cyan('─'.repeat(title.length)));
  }

  startSpinner(text: string): void {
    this.spinner = ora(text).start();
  }

  updateSpinner(text: string): void {
    if (this.spinner) {
      this.spinner.text = text;
    }
  }

  succeedSpinner(text?: string): void {
    if (this.spinner) {
      this.spinner.succeed(text);
      this.spinner = null;
    }
  }

  failSpinner(text?: string): void {
    if (this.spinner) {
      this.spinner.fail(text);
      this.spinner = null;
    }
  }

  stopSpinner(): void {
    if (this.spinner) {
      this.spinner.stop();
      this.spinner = null;
    }
  }

  logThought(thinking: string): void {
    console.log(chalk.gray('💭 Thinking:'), chalk.white(thinking));
  }

  logAction(action: string, args: Record<string, unknown>): void {
    console.log(
      chalk.magenta('🎯 Action:'),
      chalk.white(action),
      chalk.gray(JSON.stringify(args, null, 2))
    );
  }

  logResult(success: boolean, summary: string): void {
    const icon = success ? chalk.green('✓') : chalk.red('✗');
    console.log(icon, chalk.white(summary));
  }
}

