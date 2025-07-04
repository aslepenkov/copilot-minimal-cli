using current codebase

find how to initiate agent mode and pass some folder as context
find this feature in platfrorm folder
need to work without extension

Workspace
(rerun without)
Collecting workspace information

Filtering to most relevant information

Initiating Agent Mode with Folder Context
Looking at the codebase, Agent Mode in GitHub Copilot Chat is primarily implemented as a chat participant in VS Code. Here's how it works and how you can initiate it with folder context:

Key Implementation Files
The main agent mode implementation is in:

chatParticipants.ts - Registers agents including the agent mode participant
agentPrompt.tsx - Main entrypoint for rendering agent prompts
toolCallingLoop.ts - Handles the agentic loop execution
How to Initialize Agent Mode
The agent mode participant is registered through the ChatAgents class in chatParticipants.ts. Specifically, it's registered in the registerEditsAgent() method:

Using Agent Mode Without Extension
To use agent mode programmatically without relying on the full extension, you would need to:

Create an instance of the language model service
Initialize a tool calling loop
Set up workspace context
Here's a conceptual approach (actual implementation would require more code):

Key Configuration Options
The agent mode is configurable through settings:

Workspace Context and Folder Handling
The workspace context is managed through:

workspaceService.ts - Provides workspace information
gitService.ts - Handles Git repository information
Current Limitations
Based on the codebase, agent mode is tightly integrated with VS Code's extension API, particularly:

It uses vscode.chat.createChatParticipant to register the agent
It relies on VS Code's proposed APIs for chat functionality
It uses the instantiation service pattern for dependency injection
To make it work completely without the extension would require significant refactoring to separate the core agent functionality from VS Code-specific APIs.

Would you like more specific details on any particular part of this implementation?


private registerEditsAgent(): IDisposable {
    const editingAgent = this.createAgent(editsAgentName, Intent.Agent);
    editingAgent.iconPath = new vscode.ThemeIcon('tools');
    editingAgent.additionalWelcomeMessage = this.additionalWelcomeMessage;
    return editingAgent;
}


// Conceptual code - not directly executable
import { IWorkspaceService } from '../platform/workspace/common/workspaceService';
import { ILanguageModelsService } from '../platform/chat/common/languageModels';
import { ToolCallingLoop } from '../extension/intents/node/toolCallingLoop';

async function initiateAgentMode(folderPath: string) {
    // 1. Initialize workspace service with the folder path
    const workspaceService = createWorkspaceService(folderPath);
    
    // 2. Initialize language model service
    const languageModelService = createLanguageModelService();
    
    // 3. Create tool calling loop
    const toolLoop = new ToolCallingLoop({
        workspaceService,
        languageModelService,
        // other required services...
    });
    
    // 4. Start the agent with a prompt
    await toolLoop.start({
        prompt: "Your task instruction here",
        workspaceFolder: folderPath,
        // other options...
    });
}