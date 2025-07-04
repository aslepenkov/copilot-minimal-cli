/**
 * Represents a source code file with its path and content
 */
export interface SourceFile {
  /** Absolute or relative path of the file */
  path: string;
  /** Content of the file */
  content: string;
  /** Optional metadata for the file */
  metadata?: Record<string, any>;
}

/**
 * Represents a directory structure entry
 */
export interface DirectoryStructure {
  /** Name of the file or directory */
  name: string;
  /** Type of the entry */
  type: 'file' | 'directory';
  /** Children entries if this is a directory */
  children?: DirectoryStructure[];
}

/**
 * Configuration for source code location
 */
export interface SourceConfig {
  /** Path for local files or URL for GitHub */
  location: string;
  /** Additional options for the source */
  options?: Record<string, any>;
}

/**
 * Represents an output file to be generated
 */
export interface OutputFile {
  /** Path where the file should be written */
  path: string;
  /** Content of the file */
  content: string;
}

/**
 * Configuration for prompt generation
 */
export interface PromptConfig {
  /** Path to general prompt, defaults to prompts/general/base.txt */
  generalPromptPath?: string;
  /** Path to specific prompt, can be null */
  specificPromptPath?: string;
  /** Name of the context (project/folder) */
  contextName: string;
}
