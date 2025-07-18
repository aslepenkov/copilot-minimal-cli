/**
 * FindCodeFilesTool Tests
 *
 * Tests for the file discovery tool functionality using Vitest
 */

import { describe, it, expect, beforeEach } from "vitest";
import { FindCodeFilesTool } from "../src/tools/find-files";
import { MockFileSystem } from "./mock-filesystem";

describe("FindCodeFilesTool", () => {
  let mockFS: MockFileSystem;
  let tool: FindCodeFilesTool;

  beforeEach(() => {
    mockFS = new MockFileSystem();
    tool = new FindCodeFilesTool(mockFS);
  });

  it("should have correct metadata", () => {
    expect(tool.name).toBe("find_all_files");
    expect(tool.description).toBe("Find all files in the workspace");
    expect(tool.parameters).toHaveProperty("type");
    expect(tool.parameters).toHaveProperty("properties");
    expect(tool.parameters).toHaveProperty("required");
  });

  it("should find all files in workspace", async () => {
    const result = await tool.execute({});

    expect(result).toHaveProperty("codeFiles");
    expect(result).toHaveProperty("count");

    expect(Array.isArray(result.codeFiles)).toBe(true);
    expect(result.count).toBeGreaterThan(0);
    expect(result.count).toBe(result.codeFiles.length);

    // Should include the files from mock structure
    expect(
      result.codeFiles.some((file: string) => file.includes("file1.ts")),
    ).toBe(true);
    expect(
      result.codeFiles.some((file: string) => file.includes("file2.js")),
    ).toBe(true);
    expect(
      result.codeFiles.some((file: string) => file.includes("README.md")),
    ).toBe(true);
    expect(
      result.codeFiles.some((file: string) => file.includes("package.json")),
    ).toBe(true);
  });

  it("should exclude build directories", async () => {
    // Create a structure with build directories
    const structureWithBuild = [
      "file1.ts",
      "src/main.ts",
      "node_modules/package/index.js",
      "dist/main.js",
      "build/output.js",
      "bin/executable",
      "obj/temp.o",
      "__pycache__/cache.pyc",
      "logs/app.log",
    ].join("\n");

    const buildMockFS = {
      async getWorkspaceStructure() {
        return structureWithBuild;
      },
    } as any;

    const buildTool = new FindCodeFilesTool(buildMockFS);
    const result = await buildTool.execute({});

    // Should include source files
    expect(
      result.codeFiles.some((file: string) => file.includes("file1.ts")),
    ).toBe(true);
    expect(
      result.codeFiles.some((file: string) => file.includes("src/main.ts")),
    ).toBe(true);

    // Should exclude build directories
    expect(
      result.codeFiles.some((file: string) => file.includes("node_modules")),
    ).toBe(false);
    expect(result.codeFiles.some((file: string) => file.includes("dist"))).toBe(
      false,
    );
    expect(
      result.codeFiles.some((file: string) => file.includes("build")),
    ).toBe(false);
    expect(result.codeFiles.some((file: string) => file.includes("bin"))).toBe(
      false,
    );
    expect(result.codeFiles.some((file: string) => file.includes("obj"))).toBe(
      false,
    );
    expect(
      result.codeFiles.some((file: string) => file.includes("__pycache__")),
    ).toBe(false);
    expect(result.codeFiles.some((file: string) => file.includes("logs"))).toBe(
      false,
    );
  });

  it("should handle empty workspace", async () => {
    const emptyMockFS = {
      async getWorkspaceStructure() {
        return "";
      },
    } as any;

    const emptyTool = new FindCodeFilesTool(emptyMockFS);
    const result = await emptyTool.execute({});

    expect(result.count).toBe(0);
    expect(result.codeFiles.length).toBe(0);
  });

  it("should filter empty lines", async () => {
    const structureWithEmptyLines = [
      "file1.ts",
      "",
      "file2.js",
      "   ",
      "src/main.ts",
      "",
    ].join("\n");

    const filterMockFS = {
      async getWorkspaceStructure() {
        return structureWithEmptyLines;
      },
    } as any;

    const filterTool = new FindCodeFilesTool(filterMockFS);
    const result = await filterTool.execute({});

    // Should only count non-empty, non-whitespace lines
    expect(result.count).toBe(3);
    expect(result.codeFiles).toContain("file1.ts");
    expect(result.codeFiles).toContain("file2.js");
    expect(result.codeFiles).toContain("src/main.ts");
  });

  it("should handle file system errors", async () => {
    const errorMockFS = {
      async getWorkspaceStructure() {
        throw new Error("File system access denied");
      },
    } as any;

    const errorTool = new FindCodeFilesTool(errorMockFS);
    const result = await errorTool.execute({});

    expect(result).toHaveProperty("error");
    expect(result.error).toContain("File system access denied");
  });

  it("should handle nested exclusions", async () => {
    const nestedStructure = [
      "src/components/Button.tsx",
      "src/utils/helpers.ts",
      "src/node_modules/package/index.js", // nested node_modules
      "tests/src/dist/output.js", // nested dist
      "docs/build/html/index.html", // nested build
      "api/logs/error.log", // nested logs
    ].join("\n");

    const nestedMockFS = {
      async getWorkspaceStructure() {
        return nestedStructure;
      },
    } as any;

    const nestedTool = new FindCodeFilesTool(nestedMockFS);
    const result = await nestedTool.execute({});

    // Should include valid source files
    expect(
      result.codeFiles.some((file: string) => file.includes("Button.tsx")),
    ).toBe(true);
    expect(
      result.codeFiles.some((file: string) => file.includes("helpers.ts")),
    ).toBe(true);

    // Should exclude nested excluded directories
    expect(
      result.codeFiles.some((file: string) => file.includes("node_modules")),
    ).toBe(false);
    expect(result.codeFiles.some((file: string) => file.includes("dist"))).toBe(
      false,
    );
    expect(
      result.codeFiles.some((file: string) => file.includes("build")),
    ).toBe(false);
    expect(result.codeFiles.some((file: string) => file.includes("logs"))).toBe(
      false,
    );
  });
});
