#!/usr/bin/env node

import { Command } from 'commander';
import { authCommand, askCopilot } from './commands';
import { logger } from './utils';
import dotenv from 'dotenv';

// Load environment variables
dotenv.config();

/**
 * CLI option types
 */
interface AskCommandOptions {
  temperature?: string;
  maxTokens?: string;
  systemPrompt?: string;
}

/**
 * Initialize the CLI application
 */
function initializeCli() {
  // Create CLI program
  const program = new Command()
    .name('copilot-cli')
    .description('Command-line interface for GitHub Copilot')

  // Auth command
  program
    .command('auth')
    .description('Authenticate with GitHub to use Copilot')
    .action(async () => {
      try {
        await authCommand();
        logger.success('Authentication successful');
        process.exit(0);
      } catch (error) {
        logger.error('Authentication failed', error);
        process.exit(1);
      }
    });

  // Ask command
  program
    .command('ask [prompt...]')
    .description('Ask GitHub Copilot a question')
    .option('-t, --temperature <number>', 'Set the temperature (0.0-1.0) for response randomness', '0.7')
    .option('-m, --max-tokens <number>', 'Set the maximum number of tokens in the response', '1000')
    .option('-s, --system-prompt <text>', 'Custom system prompt to use')
    .action(async (promptArgs: string[], options: AskCommandOptions) => {
      try {
        if (!promptArgs || promptArgs.length === 0) {
          console.log('Usage: copilot-cli ask <your question>');
          process.exit(0);
        }

        const prompt = promptArgs.join(' ');
        await askCopilot(prompt, options);
      } catch (error) {
        logger.error('Failed to get response from Copilot', error);
        process.exit(1);
      }
    });

  // If no arguments, show help
  if (!process.argv.slice(2).length) {
    program.outputHelp();
  }

  // Parse arguments
  program.parse(process.argv);
}

// Start the CLI
initializeCli();
