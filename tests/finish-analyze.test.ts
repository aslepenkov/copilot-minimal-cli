/**
 * Test for FinishAnalyzeTool
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { FinishAnalyzeTool } from '../tools/finish-analyze';

describe('FinishAnalyzeTool', () => {
    let tool: FinishAnalyzeTool;

    beforeEach(() => {
        tool = new FinishAnalyzeTool();
    });

    it('should have correct name and description', () => {
        expect(tool.name).toBe('finish_analyze');
        expect(tool.description).toContain('Signal that the analysis is complete');
    });

    it('should have correct parameters schema', () => {
        expect(tool.parameters.type).toBe('object');
        expect(tool.parameters.properties.reason).toEqual({
            type: 'string',
            description: 'Brief explanation of why the analysis is being finished'
        });
        expect(tool.parameters.properties.summary).toEqual({
            type: 'string',
            description: 'Optional summary of findings or conclusions'
        });
        expect(tool.parameters.required).toEqual(['reason']);
    });

    it('should execute successfully with required parameters', async () => {
        const result = await tool.execute({ reason: 'Task completed successfully' });
        
        expect(result.status).toBe('analysis_complete');
        expect(result.reason).toBe('Task completed successfully');
        expect(result.summary).toBe('');
        expect(result.message).toBe('Analysis finished successfully. Iteration loop should be stopped.');
        expect(result.timestamp).toBeDefined();
        expect(new Date(result.timestamp)).toBeInstanceOf(Date);
    });

    it('should execute successfully with optional summary', async () => {
        const args = {
            reason: 'All files analyzed',
            summary: 'Found 5 issues that need attention'
        };
        
        const result = await tool.execute(args);
        
        expect(result.status).toBe('analysis_complete');
        expect(result.reason).toBe('All files analyzed');
        expect(result.summary).toBe('Found 5 issues that need attention');
        expect(result.message).toBe('Analysis finished successfully. Iteration loop should be stopped.');
        expect(result.timestamp).toBeDefined();
    });

    it('should include timestamp in ISO format', async () => {
        const result = await tool.execute({ reason: 'Test completion' });
        
        expect(result.timestamp).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}\.\d{3}Z$/);
    });
});
