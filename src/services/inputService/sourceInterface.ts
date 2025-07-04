import { DirectoryStructure, SourceConfig, SourceFile } from '../../types';

/**
 * Interface for all source implementations (local files, GitHub, etc.)
 */
export interface Source {
  /**
   * Get all files and their content from the source
   */
  getFiles(): Promise<SourceFile[]>;
  
  /**
   * Get the directory structure from the source
   */
  getStructure(): Promise<DirectoryStructure>;
  
  /**
   * Initialize the source with configuration
   */
  initialize(config: SourceConfig): Promise<void>;
}
