import { SourceConfig } from '../../types';
import { LocalFileSource } from './localFileSource';
import { Source } from './sourceInterface';

/**
 * Factory function to create the appropriate source implementation
 */
export function createSource(type: 'local' | 'github', config: SourceConfig): Source {
  switch (type) {
    case 'local':
      return new LocalFileSource();
    case 'github':
      // TODO: Implement GitHub source
      throw new Error('GitHub source not implemented yet');
    default:
      throw new Error(`Unknown source type: ${type}`);
  }
}
