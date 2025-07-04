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
npm run ask "How do I implement a binary search in JavaScript?"
```

Or with options:

```bash
npm run ask --temperature 0.8 --max-tokens 2000 "Explain the visitor pattern"
```

Options:
- `-t, --temperature <number>`: Set the temperature (0.0-1.0) for response randomness (default: 0.7)
- `-m, --max-tokens <number>`: Set the maximum number of tokens in the response (default: 1000)
- `-s, --system-prompt <text>`: Custom system prompt to use

## Project Structure

```
.
├── src/
│   ├── commands/         # CLI command implementations
│   ├── services/         # Core services (Copilot, I/O)
│   ├── utils/            # Utility functions
│   ├── config.ts         # Configuration settings
│   ├── index.ts          # Entry point
│   └── types.ts          # TypeScript type definitions
├── prompts/              # System and user prompts
├── input/                # Sample input projects
├── output/               # Generated output files
└── package.json          # Project dependencies
```

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
