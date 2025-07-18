# Copilot CLI Agent Mode

This README explains how to use the agent mode in copilot-minimal-cli.

## Setup

1. Install dependencies:

   ```
   npm install
   ```

2. Build the CLI:

   ```
   npm run build
   ```

3. Authenticate with GitHub:
   ```
   npm run dev auth
   ```

## Using Agent Mode

The agent mode processes input folders and sends them to Copilot for analysis:

1. Create input folder structure:

   ```
   input/
   ├── project1/
   │   ├── file1.js
   │   └── subfolder/
   │       └── file2.js
   ├── project2/
   │   └── ...
   ```

2. Create prompts:
   - Edit the general prompt in `prompts/general/base.txt`
   - Create specific prompts in `prompts/specific/` (e.g., `project1.txt`)

3. Run the agent:

   ```
   npm run agent
   ```

   Or process a specific context:

   ```
   npm run agent --context project1
   ```

## Output

The agent produces two types of output:

1. Stream logs in `output/logs/<context>/log-<timestamp>.md`
2. Generated files in `output/files/<context>/...`
