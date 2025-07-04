# Copilot Minimal CLI

A lightweight command-line interface for interacting with GitHub Copilot API directly from your terminal.

## Prerequisites

- Node.js (v18 or later)
- npm or pnpm
- GitHub account with Copilot access

## Installation

```bash
# Clone the repository
git clone https://github.com/aslepenkov/copilot-minimal-cli.git
cd copilot-minimal-cli

# Install dependencies
npm install

# Build the project
npm run build
```

## Authentication

Before using the CLI, you need to authenticate with GitHub:

```bash
npm run auth
```

This will guide you through a device flow authentication process:
1. A code will be displayed in your terminal
2. You'll be directed to open GitHub in your browser
3. Enter the code and authorize the application
4. Wait for the authentication to complete

## Usage

### Ask Copilot a Question

```bash
npm run ask -- --prompt "list top 5 DGP counties as table"
npm run ask -- --token GITHUB_OAUTH_TOKEN --prompt "list top 5 DGP counties as table"
```

## Project Structure

```
.
├── src/                  # Source code
│   ├── commands/         # CLI command implementations
│   │   ├── ask.ts        # Main command for querying Copilot
│   │   ├── auth.ts       # Authentication with GitHub
│   │   └── index.ts      # Command exports
│   ├── services/         # Core services
│   │   ├── copilotService.ts      # Handles API communication with Copilot
│   │   ├── promptService.ts       # Manages prompt creation and formatting
│   │   ├── inputService/          # Handles various input sources
│   │   │   ├── localFileSource.ts # Processes local file inputs
│   │   │   ├── sourceFactory.ts   # Factory for creating input sources
│   │   │   └── sourceInterface.ts # Input source interface definition
│   │   └── outputService/         # Manages output generation
│   │       ├── fileGenerator.ts   # Generates output files
│   │       ├── outputInterface.ts # Output interface definition
│   │       └── streamLogger.ts    # Handles stream logging
│   ├── utils/            # Utility functions
│   │   ├── index.ts      # Utility exports
│   │   └── parser.ts     # Input parsing utilities
│   ├── config.ts         # Configuration settings
│   ├── index.ts          # Entry point
│   └── types.ts          # TypeScript type definitions
├── prompts/              # System and user prompts
│   ├── general/          # General-purpose prompts
│   │   └── base.txt      # Base prompt template
│   └── specific/         # Project-specific prompts
│       ├── default.txt   # Default project prompt
│       └── sample-project.txt # Sample project-specific prompt
├── input/                # Sample input projects for processing
│   ├── aspire-sample/    # .NET Aspire sample project
│   └── react-sample/     # React sample project
│      
├── output/               # Generated output files (not tracked in git)
│                         # This is where files created by the CLI are stored
├── esbuild.config.js     # ESBuild configuration
├── package.json          # Project dependencies
├── tsconfig.json         # TypeScript configuration
└── AGENT_MODE.md         # Documentation for agent mode
```

### Key Folders

#### Input Folder
The `input/` folder contains sample projects that can be processed by the CLI in agent mode. These projects serve as examples and can be analyzed by Copilot to generate output. Current samples include:

#### Prompts Folder
The `prompts/` folder contains text files that define system and user prompts for different scenarios:

- **general/base.txt**: The base prompt template used for all interactions
- **specific/**: Contains project-specific prompts that can be used when processing different types of projects

#### Output Folder
The `output/` folder (created at runtime) is where the CLI stores generated files when running in agent mode. This includes:

- Generated code files
- Documentation
- Analysis reports
- Any other artifacts produced by Copilot

## Flow Diagram

```
+-------------+     +-------------+     +-------------+     +-------------+
|             |     |             |     |             |     |             |
|  User Input +---->+ Auth Service+---->+ Copilot API +---->+ Formatting  |
|             |     |             |     |             |     |             |
+-------------+     +-------------+     +-------------+     +-------------+
                                                                  |
                                                                  v
                                                           +-------------+
                                                           |             |
                                                           |    Output   |
                                                           |             |
                                                           +-------------+
```

## Agent Mode

See `AGENT_MODE.md` for detailed information about agent mode architecture and how to use it for processing entire folders/projects and generating files based on Copilot's analysis.

## License
MIT
