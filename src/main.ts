/**
 * MVP CLI for General Code Analysis
 *
 * Simplified command line interface focused on the MVP functionality:
 * - Copilot integration
 * - General code analysis (reads prompt from input/prompt.txt)
 * - Readonly operations only
 */

import * as dotenv from "dotenv";
import * as path from "path";
import { MVPStandaloneAgent, defaultMVPConfig } from "./agent";
import { getToken } from "./services";

// Load environment variables
dotenv.config();

interface MVPCLIOptions {
  workspace?: string;
  githubToken?: string;
  systemPrompt?: string;
  prompt?: string;
  debug?: boolean;
  maxIterations?: number;
}

function printUsage() {
  console.log(`
🤖 MVP Code Analyzer

Usage: tsx src/main.ts [command] [options]

Commands:
  analyze                    Analyze workspace
  
Options:
  --workspace <path>         Set workspace directory (default: /app/input in Docker, ./input locally)
  --debug                    Enable debug mode with verbose output
  --max-iterations <n>       Maximum analysis iterations (default: 10)

Examples:
  npm run start
  npm run start -- --workspace ~/some/folder/  --max-iterations 2 --debug

The analyzer will read the prompt from prompt/prompt.txt and prompt/system.txt

Environment Variables:
  GITHUB_TOKEN              GitHub token for Copilot API access
`);
}

function parseArgs(): {
  command: string;
  prompt?: string;
  options: MVPCLIOptions;
} {
  const args = process.argv.slice(2);
  const options: MVPCLIOptions = {};
  let command = "";
  let prompt = "";

  for (let i = 0; i < args.length; i++) {
    const arg = args[i];

    switch (arg) {
      case "--workspace":
        options.workspace = args[++i];
        break;
      case "--debug":
        options.debug = true;
        break;
      case "--max-iterations":
        options.maxIterations = parseInt(args[++i]) || 10;
        break;
      case "--token":
        options.githubToken = args[++i];
        break;
      case "--system":
        options.systemPrompt = args[++i];
        break;
      case "--prompt":
        options.prompt = args[++i];
        break;
      case "--help":
      case "-h":
        printUsage();
        process.exit(0);
      default:
        if (!command) {
          command = arg;
        }
        break;
    }
  }

  return { command, prompt, options };
}

async function runAnalysis(
  prompt: string,
  options: MVPCLIOptions,
): Promise<void> {
  console.log("🚀 Starting MVP Code Analysis...\n");

  // Setup configuration
  const defaultWorkspace = process.env.DATA_DIR ? "/app/input" : "./input";
  const workspacePath = path.resolve(options.workspace || defaultWorkspace);
  const config = {
    ...defaultMVPConfig,
    workspacePath,
    debugMode: options.debug || false,
    maxIterations: options.maxIterations || 10,
    githubToken: options.githubToken || process.env.GITHUB_TOKEN,
  };

  // Validate API access
  if (!options.githubToken && !process.env.GITHUB_TOKEN) {
    console.error("❌ GitHub token is required for Copilot API access");
    await getToken();
    return;
  }

  try {
    // Initialize the MVP agent with updated config
    const agentConfig = { ...config, workspacePath };
    const agent = new MVPStandaloneAgent(agentConfig);
    await agent.initialize();

    console.log("✅ Agent initialized successfully!\n");

    // Run the analysis
    const result = await agent.analyzeWorkspace(prompt);

    // Display results
    console.log("\n📊 Analysis Results:");
    console.log("==================");

    if (result.success) {
      console.log(`✅ Success! Analysis completed`);
      console.log(`🔄 Completed in ${result.iterations} iterations`);

      // Display analysis data
      if (result.analysisData) {
        const data = result.analysisData;

        if (data) {
          console.log(`\n📋 Summary: ${data}`);
        }
      }

      console.log("\n📝 Last Response:");
      console.log(result.response);
    } else {
      console.error(`❌ Analysis failed: ${result.error}`);
    }

    console.log("\n📁 Logs saved to: ./logs/");
    console.log("   - LLM interactions: llm_output_[date].jsonl");
    console.log("   - Analysis results: analysis_[date].jsonl");
    console.log("🔄️ Artifacts saved to: ./output/");
  } catch (error: any) {
    console.error("💥 Fatal error:", error.message);
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
    case "analyze":
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
    console.error("💥 Unexpected error:", error);
    process.exit(1);
  });
}

export { main as runMVPCLI };
