/**
 * Save Document Tool
 *
 * Allows the LLM to save markdown, JSON, and text documents to the logs folder
 */

import * as path from "path";
import * as fs from "fs/promises";
import { ITool } from "./interfaces";

export class SaveDocumentTool implements ITool {
  name = "save_document";
  description =
    "Save markdown, JSON, or text documents to the logs folder. Useful for creating analysis reports, summaries, or structured data files.";
  parameters = {
    type: "object",
    properties: {
      filename: {
        type: "string",
        description:
          "Name of the file to save (including extension: .md, .json, .txt)",
      },
      filePath: {
        type: "string",
        description:
          "Alternative parameter name for filename (including extension: .md, .json, .txt)",
      },
      content: {
        type: "string",
        description: "Content to write to the file",
      },
      description: {
        type: "string",
        description: "Optional description of what the document contains",
      },
    },
    required: ["content"],
  };

  private readonly outputPath: string;
  private readonly allowedExtensions = [".md", ".json", ".txt"];

  constructor() {
    this.outputPath = path.join(process.cwd(), "output");
  }

  async execute(args: {
    filename?: string;
    filePath?: string;
    content: string;
    description?: string;
  }): Promise<any> {
    try {
      // Accept either filename or filePath parameter
      // Add datetime to filename if not already present
      let filename = args.filename || args.filePath;
      if (filename && typeof filename === "string") {
        const ext = path.extname(filename);
        const base = path.basename(filename, ext);
        const datetime = new Date().toISOString().replace(/[:.]/g, "-");
        // Only add datetime if not already present
        if (!base.match(/\d{4}-\d{2}-\d{2}T\d{2}-\d{2}-\d{2}/)) {
          filename = `${base}_${datetime}${ext}`;
        }
      }

      // Validate required arguments
      if (!filename || typeof filename !== "string") {
        return {
          error: "filename or filePath is required and must be a string",
        };
      }
      if (!args.content || typeof args.content !== "string") {
        return { error: "content is required and must be a string" };
      }

      // Validate filename and extension
      const sanitizedFilename = this.sanitizeFilename(filename);
      const extension = path.extname(sanitizedFilename).toLowerCase();

      if (!this.allowedExtensions.includes(extension)) {
        return {
          error: `Invalid file extension. Allowed extensions: ${this.allowedExtensions.join(", ")}`,
        };
      }

      // Ensure logs directory exists
      await this.ensureLogsDirectory();

      // Generate full file path
      const filePath = path.join(this.outputPath, sanitizedFilename);

      // Validate content based on file type
      const validationResult = this.validateContent(args.content, extension);
      if (!validationResult.valid) {
        return { error: validationResult.error };
      }

      // Write file
      await fs.writeFile(filePath, args.content, "utf8");

      // Get file stats
      //const stats = await fs.stat(filePath);

      return {
        success: true,
        filename: sanitizedFilename,
        path: filePath,
        //size: stats.size,
        description: args.description || "",
        timestamp: new Date().toISOString(),
        message: `Document saved successfully to logs/${sanitizedFilename}`,
      };
    } catch (error: any) {
      return {
        error: `Failed to save document: ${error.message}`,
        filename: args.filename || args.filePath || "unknown",
      };
    }
  }

  private sanitizeFilename(filename: string): string {
    // Ensure filename is a string
    if (!filename || typeof filename !== "string") {
      throw new Error("Invalid filename provided");
    }

    // Remove dangerous characters and ensure it's a valid filename
    return filename
      .replace(/[<>:"/\\|?*&]/g, "_") // Replace dangerous chars with underscore (added &)
      .replace(/\s+/g, "_") // Replace spaces with underscore
      .replace(/_{2,}/g, "_") // Replace multiple underscores with single
      .toLowerCase();
  }

  private async ensureLogsDirectory(): Promise<void> {
    try {
      await fs.access(this.outputPath);
    } catch {
      await fs.mkdir(this.outputPath, { recursive: true });
    }
  }

  private validateContent(
    content: string,
    extension: string,
  ): { valid: boolean; error?: string } {
    switch (extension) {
      case ".json":
        try {
          JSON.parse(content);
          return { valid: true };
        } catch {
          return { valid: false, error: "Invalid JSON content" };
        }

      case ".md":
      case ".txt":
        // Basic validation for text content
        if (typeof content !== "string") {
          return { valid: false, error: "Content must be a string" };
        }
        return { valid: true };

      default:
        return { valid: false, error: "Unsupported file extension" };
    }
  }
}
