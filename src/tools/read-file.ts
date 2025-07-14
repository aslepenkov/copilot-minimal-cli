/**
 * Read File Tool
 * 
 * Provides safe file reading capabilities with content size limits
 */

import { ITool, IFileSystem } from './interfaces';

export class ReadFileTool implements ITool {
    name = 'read_file';
    description = 'Read the contents of a file for analysis';
    parameters = {
        type: 'object',
        properties: {
            filePath: { type: 'string', description: 'Path to the file to read' }
        },
        required: ['filePath']
    };

    constructor(private fileSystem: IFileSystem) { }

    async execute(args: { filePath: string }): Promise<any> {
        try {
            const content = await this.fileSystem.readFile(args.filePath);
            return {
                content: content.substring(0, 5000), // Limit content size
                size: content.length,
                truncated: content.length > 5000
            };
        } catch (error: any) {
            return { error: error.message };
        }
    }
}
