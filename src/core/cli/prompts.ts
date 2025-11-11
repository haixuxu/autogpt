import readline from 'readline';
import type { ActionProposal } from '../agent/actions';
import chalk from 'chalk';

function createInterface() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function question(rl: readline.Interface, query: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(query, resolve);
  });
}

export async function confirmAction(proposal: ActionProposal): Promise<boolean> {
  const rl = createInterface();

  console.log('\n' + chalk.cyan('───────────────────────────────────────'));
  console.log(chalk.bold.yellow('⚠️  Action Confirmation Required'));
  console.log(chalk.cyan('───────────────────────────────────────'));
  console.log(chalk.white(`Command: ${chalk.green(proposal.command)}`));
  console.log(chalk.white(`Arguments: ${chalk.gray(JSON.stringify(proposal.arguments, null, 2))}`));
  console.log(chalk.white(`Reasoning:`));
  proposal.reasoning.forEach((r) => console.log(chalk.gray(`  - ${r}`)));
  console.log(chalk.cyan('───────────────────────────────────────\n'));

  const answer = await question(
    rl,
    chalk.yellow('Proceed with this action? (y/n/q to quit): ')
  );
  rl.close();

  const normalized = answer.trim().toLowerCase();

  if (normalized === 'q' || normalized === 'quit') {
    console.log(chalk.red('\n❌ Agent execution cancelled by user\n'));
    process.exit(0);
  }

  return normalized === 'y' || normalized === 'yes';
}

export async function requestFeedback(context: string): Promise<string> {
  const rl = createInterface();

  console.log('\n' + chalk.cyan('───────────────────────────────────────'));
  console.log(chalk.bold.blue('💬 User Feedback Requested'));
  console.log(chalk.cyan('───────────────────────────────────────'));
  console.log(chalk.white(context));
  console.log(chalk.cyan('───────────────────────────────────────\n'));

  const feedback = await question(
    rl,
    chalk.blue('Your feedback (or press Enter to continue): ')
  );
  rl.close();

  return feedback.trim();
}

export async function handleError(error: Error, canRetry: boolean): Promise<'retry' | 'skip' | 'abort'> {
  const rl = createInterface();

  console.log('\n' + chalk.red('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(chalk.bold.red('❌ Error Occurred'));
  console.log(chalk.red('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━'));
  console.log(chalk.white(`Error: ${chalk.red(error.message)}`));
  console.log(chalk.red('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━\n'));

  const options = canRetry
    ? '(r)etry / (s)kip / (a)bort: '
    : '(s)kip / (a)bort: ';

  const answer = await question(rl, chalk.yellow(options));
  rl.close();

  const normalized = answer.trim().toLowerCase();

  if (normalized === 'r' || normalized === 'retry') {
    return canRetry ? 'retry' : 'skip';
  } else if (normalized === 's' || normalized === 'skip') {
    return 'skip';
  } else {
    return 'abort';
  }
}

