/**
 * ListDirectoryTool Tests
 * 
 * Tests for the directory listing tool functionality using Vitest
 */

import { describe, it, expect, beforeEach } from 'vitest';
import { ListDirectoryTool } from '../tools/list-directory';
import { MockFileSystem } from './mock-filesystem';

describe('ListDirectoryTool', () => {
    let mockFS: MockFileSystem;
    let tool: ListDirectoryTool;

    beforeEach(() => {
        mockFS = new MockFileSystem();
        tool = new ListDirectoryTool(mockFS);
    });

    it('should have correct metadata', () => {
        expect(tool.name).toBe('list_directory');
        expect(tool.description).toBe('List the contents of a directory');
        expect(tool.parameters).toHaveProperty('type');
        expect(tool.parameters).toHaveProperty('properties');
        expect(tool.parameters).toHaveProperty('required');
    });

    it('should list directory contents successfully', async () => {
        const result = await tool.execute({ path: '/test' });
        
        expect(result).toHaveProperty('entries');
        expect(result).toHaveProperty('count');
        
        expect(Array.isArray(result.entries)).toBe(true);
        expect(result.count).toBe(5);
        expect(result.entries).toContain('file1.ts');
        expect(result.entries).toContain('file2.js');
        expect(result.entries).toContain('README.md');
        expect(result.entries).toContain('package.json');
        expect(result.entries).toContain('src');
    });

    it('should handle subdirectory', async () => {
        const result = await tool.execute({ path: '/test/src' });
        
        expect(result.count).toBe(2);
        expect(result.entries).toContain('main.ts');
        expect(result.entries).toContain('utils.ts');
    });

    it('should handle empty directory', async () => {
        const result = await tool.execute({ path: '/test/empty' });
        
        expect(result.count).toBe(0);
        expect(result.entries).toHaveLength(0);
    });

    it('should handle non-existent directory', async () => {
        const result = await tool.execute({ path: '/test/nonexistent' });
        
        expect(result).toHaveProperty('error');
        expect(result.error).toContain('Directory not found');
    });

    it('should not modify original entries', async () => {
        const result1 = await tool.execute({ path: '/test' });
        const result2 = await tool.execute({ path: '/test' });
        
        // Modify result1 entries
        result1.entries.push('modified');
        
        // result2 should not be affected
        expect(result2.count).toBe(5);
        expect(result2.entries).not.toContain('modified');
    });

    it('should handle different path formats', async () => {
        // Add some test directories with different naming
        mockFS.addDirectory('/test/with-dash', ['file-1.ts', 'file-2.js']);
        mockFS.addDirectory('/test/with_underscore', ['file_1.ts', 'file_2.js']);
        
        const dashResult = await tool.execute({ path: '/test/with-dash' });
        expect(dashResult.count).toBe(2);
        
        const underscoreResult = await tool.execute({ path: '/test/with_underscore' });
        expect(underscoreResult.count).toBe(2);
    });
});
