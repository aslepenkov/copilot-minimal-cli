/**
 * Finish Analyze Tool
 * 
 * A fictive tool to signal the completion of analysis and stop iteration loops
 */

import { ITool } from './interfaces';

export class FinishAnalyzeTool implements ITool {
    name = 'finish_analyze';
    description = 'Signal that the analysis is complete and iterations should stop. Use this tool when you have gathered enough information or completed the task.';
    parameters = {
        type: 'object',
        properties: {
            reason: { 
                type: 'string', 
                description: 'Brief explanation of why the analysis is being finished' 
            },
            summary: { 
                type: 'string', 
                description: 'Optional summary of findings or conclusions' 
            }
        },
        required: ['reason']
    };

    async execute(args: { reason: string; summary?: string }): Promise<any> {
        return {
            status: 'analysis_complete',
            reason: args.reason,
            summary: args.summary || '',
            timestamp: new Date().toISOString(),
            message: 'Analysis finished successfully. Iteration loop should be stopped.'
        };
    }
}
