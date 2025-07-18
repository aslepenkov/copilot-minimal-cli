/**
 * Test for SaveDocumentTool
 */

import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { SaveDocumentTool } from "../src/tools/save-document";
import * as fs from "fs/promises";
import * as path from "path";

describe("SaveDocumentTool", () => {
  let tool: SaveDocumentTool;
  const testLogsPath = path.join(process.cwd(), "output");

  beforeEach(() => {
    tool = new SaveDocumentTool();
  });

  afterEach(async () => {
    // Clean up test files
    try {
      const files = await fs.readdir(testLogsPath);
      for (const file of files) {
        if (file.startsWith("test_")) {
          await fs.unlink(path.join(testLogsPath, file));
        }
      }
    } catch {
      // Ignore cleanup errors
    }
  });

  it("should have correct name and description", () => {
    expect(tool.name).toBe("save_document");
    expect(tool.description).toContain(
      "Save markdown, JSON, or text documents",
    );
  });

  it("should have correct parameters schema", () => {
    expect(tool.parameters.type).toBe("object");
    expect(tool.parameters.properties.filename).toEqual({
      type: "string",
      description:
        "Name of the file to save (including extension: .md, .json, .txt)",
    });
    expect(tool.parameters.properties.filePath).toEqual({
      type: "string",
      description:
        "Alternative parameter name for filename (including extension: .md, .json, .txt)",
    });
    expect(tool.parameters.properties.content).toEqual({
      type: "string",
      description: "Content to write to the file",
    });
    expect(tool.parameters.required).toEqual(["content"]);
  });

  it("should save a markdown file successfully", async () => {
    const args = {
      filename: "test_report.md",
      content: "# Test Report\n\nThis is a test markdown file.",
      description: "Test markdown report",
    };

    const result = await tool.execute(args);

    expect(result.success).toBe(true);
    expect(result.filename).toMatch(/^test_report(_[\d\w\-tz:.]+)?\.md$/i);
    expect(result.description).toBe("Test markdown report");
    expect(result.message).toContain("Document saved successfully");

    // Verify file was created
    const filePath = path.join(testLogsPath, result.filename);
    const content = await fs.readFile(filePath, "utf8");
    expect(content).toBe(args.content);
  });

  it("should save a JSON file successfully", async () => {
    const jsonContent = JSON.stringify({ test: "data", value: 123 }, null, 2);
    const args = {
      filename: "test_data.json",
      content: jsonContent,
    };

    const result = await tool.execute(args);

    expect(result.success).toBe(true);
    expect(result.filename).toMatch(/^test_data(_[\d\w\-tz:.]+)?\.json$/i);

    // Verify file was created and is valid JSON
    const filePath = path.join(testLogsPath, result.filename);
    const content = await fs.readFile(filePath, "utf8");
    const parsed = JSON.parse(content);
    expect(parsed.test).toBe("data");
    expect(parsed.value).toBe(123);
  });

  it("should save a text file successfully", async () => {
    const args = {
      filename: "test_notes.txt",
      content: "These are some test notes.\nLine 2 of the notes.",
    };

    const result = await tool.execute(args);

    expect(result.success).toBe(true);
    expect(result.filename).toMatch(/^test_notes(_[\d\w\-tz:.]+)?\.txt$/i);

    // Verify file was created
    const filePath = path.join(testLogsPath, result.filename);
    const content = await fs.readFile(filePath, "utf8");
    expect(content).toBe(args.content);
  });

  it("should reject invalid file extensions", async () => {
    const args = {
      filename: "test_file.exe",
      content: "some content",
    };

    const result = await tool.execute(args);

    expect(result.error).toContain("Invalid file extension");
    expect(result.error).toContain(".md, .json, .txt");
  });

  it("should reject invalid JSON content", async () => {
    const args = {
      filename: "test_invalid.json",
      content: "{ invalid json content",
    };

    const result = await tool.execute(args);

    expect(result.error).toBe("Invalid JSON content");
  });

  it("should sanitize dangerous filenames", async () => {
    const args = {
      filename: "Test File With Spaces & Special<>Chars.md",
      content: "# Sanitized filename test",
    };

    const result = await tool.execute(args);

    expect(result.success).toBe(true);
    expect(result.filename).toMatch(
      /^test_file_with_spaces_special_chars(_[\d\w\-tz:.]+)?\.md$/i,
    );

    // Verify file was created with sanitized name
    const filePath = path.join(testLogsPath, result.filename);
    const exists = await fs
      .access(filePath)
      .then(() => true)
      .catch(() => false);
    expect(exists).toBe(true);
  });

  it("should include file size and timestamp in result", async () => {
    const args = {
      filename: "test_metadata.txt",
      content: "Content for metadata test",
    };

    const result = await tool.execute(args);

    expect(result.success).toBe(true);
    expect(result.timestamp).toBeDefined();
    expect(new Date(result.timestamp)).toBeInstanceOf(Date);
  });

  it("should work with filePath parameter instead of filename", async () => {
    const args = {
      filePath: "test_filepath.md",
      content: "# Test with filePath parameter",
    };

    const result = await tool.execute(args);

    expect(result.success).toBe(true);
    expect(result.filename).toMatch(/^test_filepath(_[\d\w\-tz:.]+)?\.md$/i);

    // Verify file was created
    const filePath = path.join(testLogsPath, result.filename);
    const content = await fs.readFile(filePath, "utf8");
    expect(content).toBe(args.content);
  });
});
