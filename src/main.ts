#!/usr/bin/env ts-node

/**
 * MVP CLI for General Code Analysis
 * 
 * Simplified command line interface focused on the MVP functionality:
 * - Copilot integration
 * - General code analysis (reads prompt from input/prompt.txt)
 * - Readonly operations only
 */

import * as dotenv from 'dotenv';
import * as path from 'path';
import { MVPStandaloneAgent, defaultMVPConfig, type MVPAgentConfig } from './agent';
import { getToken } from './services';

// Load environment variables
dotenv.config();

interface MVPCLIOptions {
	workspace?: string;
	debug?: boolean;
	copilotApiKey?: string;
	githubToken?: string;
	maxIterations?: number;
}

function printUsage() {
	console.log(`
🤖 MVP Code Analyzer

Usage: npx ts-node cli.ts [command] [options]

Commands:
  analyze [prompt]           Analyze workspace (uses input/prompt.txt if no prompt given)
  
Options:
  --workspace <path>         Set workspace directory (default: /app/input in Docker, ./input locally)
  --debug                    Enable debug mode with verbose output
  --max-iterations <n>       Maximum analysis iterations (default: 10)

Examples:
  npm run analyze
  npm run analyze -- --workspace ~/some/folder/  --max-iterations 2 --debug

The analyzer will read the prompt from input/prompt.txt 
You can put any analysis request in that file, such as:
- "analyze business entities in this code"
- "analyze code quality and complexity"

Environment Variables:
  GITHUB_TOKEN              GitHub token for Copilot API access
`);
}

function parseArgs(): { command: string; prompt?: string; options: MVPCLIOptions } {
	const args = process.argv.slice(2);
	const options: MVPCLIOptions = {};
	let command = '';
	let prompt = '';

	for (let i = 0; i < args.length; i++) {
		const arg = args[i];

		switch (arg) {
			case '--workspace':
				options.workspace = args[++i];
				break;
			case '--debug':
				options.debug = true;
				break;
			case '--max-iterations':
				options.maxIterations = parseInt(args[++i]) || 10;
				break;
			case '--help':
			case '-h':
				printUsage();
				process.exit(0);
			default:
				if (!command) {
					command = arg;
				} else if (command === 'analyze' && !prompt) {
					prompt = arg;
				}
				break;
		}
	}

	return { command, prompt, options };
}

async function runAnalysis(prompt: string, options: MVPCLIOptions): Promise<void> {
	console.log('🚀 Starting MVP Code Analysis...\n');

	// Setup configuration
	const defaultWorkspace = process.env.DATA_DIR ? '/app/input' : './input';
	const workspacePath = path.resolve(options.workspace || defaultWorkspace);
	const config = {
		...defaultMVPConfig,
		workspacePath,
		debugMode: options.debug || false,
		maxIterations: options.maxIterations || 10,
		copilotApiKey: options.copilotApiKey || process.env.COPILOT_API_KEY,
		githubToken: options.githubToken || process.env.GITHUB_TOKEN
	};

	// Validate API access
	if (!config.copilotApiKey && !config.githubToken) {
		console.error('❌ GitHub token or Copilot API key is required for API access');
		await getToken();
		return;
	}

	try {
		// Initialize the MVP agent with updated config
		const agentConfig = { ...config, workspacePath };
		const agent = new MVPStandaloneAgent(agentConfig);
		await agent.initialize();

		console.log('✅ Agent initialized successfully!\n');

		// Run the analysis
		const result = await agent.analyzeWorkspace(prompt);

		// Display results
		console.log('\n📊 Analysis Results:');
		console.log('==================');

		if (result.success) {
			console.log(`✅ Success! Analysis completed`);
			console.log(`🔄 Completed in ${result.iterations} iterations`);

			// Display analysis data
			if (result.analysisData) {
				const data = result.analysisData;

				if (data.summary) {
					console.log(`\n📋 Summary: ${data.summary}`);
				}
			}

			console.log('\n📝 Full Response:');
			console.log(result.response);
		} else {
			console.error(`❌ Analysis failed: ${result.error}`);
		}

		console.log('\n📁 Logs saved to: ./logs/');
		console.log('   - LLM interactions: llm_output_[date].jsonl');
		console.log('   - Analysis results: analysis_[date].jsonl');

	} catch (error: any) {
		console.error('💥 Fatal error:', error.message);
		if (options.debug) {
			console.error(error.stack);
		}
	}
}

async function main(): Promise<void> {
	const { command, prompt, options } = parseArgs();

	if (!command) {
		printUsage();
		return;
	}

	switch (command) {
		case 'analyze':
			await runAnalysis(prompt || "", options);
			break;
		default:
			console.error(`❌ Unknown command: ${command}`);
			printUsage();
			process.exit(1);
	}
}

// Run the CLI
if (import.meta.url === `file://${process.argv[1]}`) {
	main().catch((error) => {
		console.error('💥 Unexpected error:', error);
		process.exit(1);
	});
}

export { main as runMVPCLI };
