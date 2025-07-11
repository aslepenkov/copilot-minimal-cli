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
# Install dependencies
npm install

# Run analysis on current workspace
npm run analyze

npm run analyze -- --workspace ./some folder/ --max-iterations 2 --debug
```

## Docker Usage

Build and run the application in a Docker container:

```bash
# Build the Docker image
docker build -t copilot-minimal-cli:latest .

# Rebuild without cache (removes old image and builds fresh)
docker image prune -f

# Run with persistent data storage (container manages its own .env)
docker run -d --name copilot-analyzer \
    -v $(pwd)/logs:/app/logs \
    -v $(pwd)/input:/app/input \
    --restart unless-stopped \
    copilot-minimal-cli:latest

# Execute analysis commands in running container
docker exec -it copilot-analyzer npm run analyze  # uses /app/input/ by default
docker exec -it copilot-analyzer npm run analyze -- --workspace ./input/  --max-iterations 2 --debug

# Get shell access to running container
docker exec -it copilot-analyzer sh

# Stop and remove container
docker stop copilot-analyzer && docker rm copilot-analyzer
```

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
