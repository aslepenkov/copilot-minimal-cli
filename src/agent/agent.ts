import { initializeCopilotAPI } from "./helpers/copilotAPI";
import { validateWorkspace } from "./helpers/validation";
import {
  buildUserPrompt,
  buildToolResultsPrompt,
} from "./helpers/promptBuilders";
import { ExtractToolCalls } from "./helpers/responseParser";
import { executeToolCalls } from "./helpers/toolExecutor";
import * as path from "path";
import {
  MVPCopilotAPI,
  FileLogger,
  ReadOnlyFileSystem,
  type ILogger,
} from "../services";
import { ToolRegistry } from "../tools";
import type { MVPAgentConfig, AgentResult } from "./interfaces";

export class MVPStandaloneAgent {
  private readonly fileSystem: ReadOnlyFileSystem;
  private readonly logger: ILogger;
  private readonly toolRegistry: ToolRegistry = new ToolRegistry();
  private readonly config: MVPAgentConfig;
  private copilotAPI: MVPCopilotAPI | null = null;

  constructor(config: MVPAgentConfig) {
    this.config = config;
    this.fileSystem = new ReadOnlyFileSystem(config.workspacePath);
    this.logger = new FileLogger(path.join(process.cwd(), "logs"));
  }

  async initialize(): Promise<void> {
    console.log(`🤖 Initializing MVP Agent...`);
    console.log(`📁 Workspace: ${this.config.workspacePath}`);

    this.copilotAPI = await initializeCopilotAPI(this.config);
    await validateWorkspace(this.fileSystem, this.config.workspacePath);
    this.toolRegistry.initializeReadOnlyTools(this.fileSystem);

    // Output tools info
    const toolNames = this.toolRegistry
      .getAll()
      .map((tool) => tool.name)
      .join(", ");
    console.log(
      `🔧 Initialized ${this.toolRegistry.size()} tools: ${toolNames}`,
    );
  }

  async analyzeWorkspace(customPrompt?: string): Promise<AgentResult> {
    try {
      const systemPrompt = await this.fileSystem.readFileOrFallback(
        path.join(process.cwd(), "prompt", "system.txt"),
        "You are an AI assistant.",
      );
      const userPrompt =
        customPrompt ??
        (await this.fileSystem.readFileOrFallback(
          path.join(process.cwd(), "prompt", "prompt.txt"),
          "analyze code",
        ));

      const analysisContext = {
        startTime: Date.now(),
        toolCalls: [],
        iterations: 0,
        analysisData: "",
      };

      const result = await this.runAnalysisLoop(
        systemPrompt,
        userPrompt,
        analysisContext,
      );

      await logAnalysisResults(
        this.logger,
        userPrompt,
        result,
        analysisContext,
      );
      return result;
    } catch (error) {
      console.error(`❌ Analysis failed:`, error);
      return {
        success: false,
        response: "",
        error: error.message,
      } as AgentResult;
    }
  }

  private async runAnalysisLoop(
    systemPrompt: string,
    userPrompt: string,
    context: any,
  ): Promise<AgentResult> {
    let currentResponse = await this.callCopilotAPI(
      await buildUserPrompt(this.config, this.fileSystem, userPrompt),
      systemPrompt,
    );

    while (context.iterations < this.config.maxIterations) {
      context.iterations++;
      console.log(
        `\n📋 Iteration ${context.iterations}/${this.config.maxIterations}`,
      );

      const extractedToolCalls = ExtractToolCalls(currentResponse);
      if (extractedToolCalls.length === 0) {
        context.analysisData += currentResponse;
      }

      if (extractedToolCalls.some((tc) => tc.name === "finish_analyze")) {
        console.log(`✅ 'finish_analyze' tool called. Stopping analysis loop.`);
        break;
      }

      await executeToolCalls(
        extractedToolCalls,
        this.toolRegistry,
        context.toolCalls,
      );
      currentResponse = await this.callCopilotAPI(
        await buildToolResultsPrompt(extractedToolCalls),
        systemPrompt,
      );
    }

    return {
      success: true,
      response: currentResponse,
      analysisData: JSON.stringify(context.analysisData),
      iterations: context.iterations,
    };
  }

  private async callCopilotAPI(
    prompt: string,
    systemPrompt?: string,
  ): Promise<string> {
    if (!this.copilotAPI) throw new Error("Copilot API is not initialized.");
    const response = await this.copilotAPI.callAPI(prompt, systemPrompt);
    await this.logger.logLLMOutput(prompt, response);
    return response;
  }
}
