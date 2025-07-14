/**
 * ReadFileTool Tests
 * 
 * Tests for the file reading tool functionality using Vitest
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ReadFileTool } from '../tools/read-file';
import { MockFileSystem } from './mock-filesystem';

describe('ReadFileTool', () => {
    let mockFS: MockFileSystem;
    let tool: ReadFileTool;

    beforeEach(() => {
        mockFS = new MockFileSystem();
        tool = new ReadFileTool(mockFS);
    });

    it('should have correct metadata', () => {
        expect(tool.name).toBe('read_file');
        expect(tool.description).toBe('Read the contents of a file for analysis');
        expect(tool.parameters).toHaveProperty('type');
        expect(tool.parameters).toHaveProperty('properties');
        expect(tool.parameters).toHaveProperty('required');
    });

    it('should read existing file successfully', async () => {
        const result = await tool.execute({ filePath: '/test/file1.ts' });
        
        expect(result).toHaveProperty('content');
        expect(result).toHaveProperty('size');
        expect(result).toHaveProperty('truncated');
        
        expect(result.content).toBe('console.log("Hello World");');
        expect(result.size).toBe(27);
        expect(result.truncated).toBe(false);
    });

    it('should handle non-existent file', async () => {
        const result = await tool.execute({ filePath: '/test/nonexistent.txt' });
        
        expect(result).toHaveProperty('error');
        expect(result.error).toContain('File not found');
    });

    it('should truncate large files', async () => {
        const largeContent = 'a'.repeat(6000);
        mockFS.addFile('/test/large.txt', largeContent);
        
        const result = await tool.execute({ filePath: '/test/large.txt' });
        
        expect(result.content).toHaveLength(5000);
        expect(result.size).toBe(6000);
        expect(result.truncated).toBe(true);
    });

    it('should handle empty file', async () => {
        mockFS.addFile('/test/empty.txt', '');
        
        const result = await tool.execute({ filePath: '/test/empty.txt' });
        
        expect(result.content).toBe('');
        expect(result.size).toBe(0);
        expect(result.truncated).toBe(false);
    });

    it('should handle different file types', async () => {
        // Test JSON file
        const jsonResult = await tool.execute({ filePath: '/test/package.json' });
        expect(jsonResult.content).toContain('"name"');
        expect(jsonResult.content).toContain('test-project');
        
        // Test Markdown file
        const mdResult = await tool.execute({ filePath: '/test/README.md' });
        expect(mdResult.content).toContain('# Test Project');
    });
});
