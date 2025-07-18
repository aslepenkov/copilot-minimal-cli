# MVP Code Analyzer

A minimalistic, prompt-driven code analysis tool powered by GitHub Copilot API.
<img width="1033" height="573" alt="Screenshot 2025-07-11 114906" src="https://github.com/user-attachments/assets/b8dc1357-0613-4697-9daa-0d37ea130be3" />
<img width="1036" height="600" alt="Screenshot 2025-07-11 115037" src="https://github.com/user-attachments/assets/9e750c90-3ca5-463d-805c-7ab7d6eaa036" />

## Features

- **Fully externalized prompts**: All instructions stored in `input/` text files
- **Tool-based analysis**: Read-only file operations for safe code exploration
- **GitHub Copilot integration**: Uses official Copilot API for analysis
- **Zero hardcoded prompts**: All behavior controlled via external files

## Quick Start

```bash
# start container
docker compose up -d

docker exec -it copilot-minimal-cli node dist/bundle.js analyze -- --workspace ./input/react/sample --max-iterations 10 --debug

docker exec -it copilot-minimal-cli node dist/bundle.js analyze  # uses /app/input/ by default

#Stop and remove container
docker compose down
```

# Get shell access to running container

docker exec -it copilot-minimal-cli sh

**Volume Mappings:**

- `logs:/app/logs` - Analysis logs and outputs
- `input:/app/input` - Live-reload prompts and configuration (optional)

## Configuration

- `input/prompt.txt` - Analysis request
- `input/system.txt` - System instructions and available tools
- `input/user-prompt-template.txt` - User prompt template
- `input/tool-results-template.txt` - Tool results template

## Available Tools

- `read_file` - Read file contents
- `list_directory` - List directory contents
- `get_workspace_structure` - Get complete workspace structure
- `find_all_files` - Find all files in workspace

## Requirements

- Node.js 20+
- GitHub token with Copilot access

## ARCHITECTURE

The MVP Code Analyzer follows a modular, clean architecture with clear separation of concerns.

### System Overview

```
┌────────────────────────────────────────────────────────────────────────────┐
│                        MVP Code Analyzer                                  │
├────────────────────────────────────────────────────────────────────────────┤
│                                                                            │
│  ┌──────────────┐   ┌────────────────┐   ┌──────────────────────────────┐  │
│  │    CLI       │──▶│    Agent       │──▶│   Copilot API Service        │  │
│  │ (src/main.ts)│   │ (src/agent/)   │   │   (src/services/)            │  │
│  └──────────────┘   └───────┬────────┘   └───────────────┬──────────────┘  │
│                              │                            │                 │
│                              ▼                            ▼                 │
│  ┌──────────────┐   ┌────────────────┐   ┌──────────────────────────────┐  │
│  │   Prompts    │   │    Tools       │   │   File System (ReadOnly)     │  │
│  │ (input/,     │   │  (src/tools/)  │   │   (src/services/filesystem/) │  │
│  │  prompt/)    │   │                │   │                              │  │
│  └──────────────┘   └────────────────┘   └──────────────────────────────┘  │
│                                                                            │
└────────────────────────────────────────────────────────────────────────────┘
```

### Core Components

#### 1. CLI Layer (`main.ts`)

```
┌─────────────────────────────────────────┐
│              CLI Interface              │
├─────────────────────────────────────────┤
│ • Argument parsing                      │
│ • Configuration setup                   │
│ • Error handling                        │
│ • Result display                        │
│                                         │
│ Commands:                               │
│ ├─ analyze [prompt]                     │
│ ├─ --workspace <path>                   │
│ ├─ --debug                              │
│ └─ --max-iterations <n>                 │
└─────────────────────────────────────────┘
```

#### 2. Agent Core (`agent/`)

```
┌─────────────────────────────────────────┐
│            MVPStandaloneAgent           │
├─────────────────────────────────────────┤
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │        Analysis Engine              │ │
│ │ ┌─────────────────────────────────┐ │ │
│ │ │  1. Read prompts from input/    │ │ │
│ │ │  2. Build context with tools    │ │ │
│ │ │  3. Call Copilot API            │ │ │
│ │ │  4. Parse tool calls            │ │ │
│ │ │  5. Execute tools               │ │ │
│ │ │  6. Continue until complete     │ │ │
│ │ └─────────────────────────────────┘ │ │
│ └─────────────────────────────────────┘ │
│                                         │
│ ┌─────────────────────────────────────┐ │
│ │           Components                │ │
│ │ ├─ FileSystem (readonly)            │ │
│ │ ├─ Logger (JSONL files)             │ │
│ │ ├─ ToolRegistry                     │ │
│ │ └─ CopilotAPI                       │ │
│ └─────────────────────────────────────┘ │
└─────────────────────────────────────────┘
```

#### 3. Tools Architecture (`tools/`)

```
┌─────────────────────────────────────────────────────────────────┐
│                        Tools Module                             │
├─────────────────────────────────────────────────────────────────┤
│                                                                 │
│  ┌─────────────────┐         ┌────────────────────────────────┐ │
│  │  interfaces.ts  │─── ────▶│         Tool Registry         │ │
│  │                 │         │        (registry.ts)            │ │
│  │ ┌─────────────┐ │         │                                 │ │
│  │ │    ITool    │ │         │  ┌─────────────────────────────┐ │ │
│  │ └─────────────┘ │         │  │      register(tool)        │ │ │
│  │ ┌─────────────┐ │         │  │      get(name)             │ │ │
│  │ │ IFileSystem │ │         │  │      getAll()              │ │ │
│  │ └─────────────┘ │         │  │      initializeReadOnly()  │ │ │
│  └─────────────────┘         │  └─────────────────────────────┘ │ │
│                               └─────────────────────────────────┘ │
│                                                                 │
│  Individual Tools:                                              │
│  ┌─────────────────┐  ┌─────────────────┐  ┌─────────────────┐ │
│  │  read-file.ts   │  │list-directory.ts│  │workspace-       │ │
│  │                 │  │                 │  │structure.ts     │ │
│  │ ReadFileTool    │  │ListDirectoryTool│  │GetWorkspace     │ │
│  │ • 5KB limit     │  │ • Safe listing  │  │StructureTool    │ │
│  │ • Error handle  │  │ • Entry count   │  │ • Tree view     │ │
│  └─────────────────┘  └─────────────────┘  └─────────────────┘ │
│                                                                │
│  ┌──────────────────┐          ┌─────────────────────────────┐ │
│  │  find-files.ts   │          │         index.ts            │ │
│  │                  │          │     (Central exports)       │ │
│  │ FindCodeFilesTool│          │                             │ │
│  │ • File discovery │          │ export { ITool, IFileSystem,│ │
│  │ • Filter logic   │          │          ToolRegistry, ...} │ │
│  └──────────────────┘          └─────────────────────────────┘ │
└────────────────────────────────────────────────────────────────┘
```

#### 4. Data Flow

```
┌─────────────┐    ┌─────────────┐    ┌─────────────┐    ┌─────────────┐
│   User      │───▶│    CLI      │───▶│   Agent     │───▶│  Copilot    │
│   Input     │    │   Parser    │    │   Engine    │    │     API     │
└─────────────┘    └─────────────┘    └─────┬───────┘    └─────────────┘
                                             │
┌─────────────┐    ┌─────────────┐           ▼
│   Results   │◀───│   Logger    │    ┌─────────────┐
│   Display   │    │   (JSONL)   │    │    Tools    │
└─────────────┘    └─────────────┘    │  Execution  │
                                      └─────┬───────┘
┌─────────────┐    ┌─────────────┐           ▼
│   Input     │───▶│ File System │    ┌─────────────┐
│   Files     │    │ (ReadOnly)  │◀───│  Workspace  │
│             │    │             │    │   Access    │
└─────────────┘    └─────────────┘    └─────────────┘
```

#### 5. File Structure

```
copilot-minimal-cli/
├── src/
│   ├── main.ts                # Entry point, argument parsing
│   ├── agent/                 # Domain logic layer
│   │   ├── index.ts           # Agent exports
│   │   ├── agent.ts           # Core analysis engine
│   │   └── interfaces.ts      # Agent contracts
│   ├── services/              # Business services layer
│   │   ├── index.ts           # Services exports
│   │   ├── copilot-api.ts     # AI/ML service
│   │   ├── auth.ts            # Authentication service
│   │   ├── filesystem/        # File system service
│   │   │   ├── index.ts
│   │   │   └── read-only-filesystem.ts
│   │   └── logging/           # Logging service
│   │       ├── index.ts
│   │       └── file-logger.ts
│   ├── tools/                 # Infrastructure layer
│   │   ├── index.ts           # Central exports
│   │   ├── interfaces.ts      # Core interfaces
│   │   ├── registry.ts        # Tool management
│   │   ├── read-file.ts       # File reading tool
│   │   ├── list-directory.ts  # Directory listing tool
│   │   ├── workspace-structure.ts # Structure analysis
│   │   └── find-files.ts      # File discovery tool
├── prompt/                    # External configuration and templates
│   ├── prompt.txt             # Analysis request
│   ├── system.txt             # System instructions
├── input/                     # Example or sample input workspaces
│   └── ...
├── logs/                      # Analysis outputs
│   ├── llm_output_*.jsonl     # LLM interactions
│   └── analysis_*.jsonl       # Analysis results
├── tests/                     # Automated tests
│   └── ...
├── README.md                  # This documentation
└── package.json               # Project manifest
```
