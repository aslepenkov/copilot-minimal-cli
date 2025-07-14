/**
 * ESBuild Configuration
 * 
 * Modern bundling configuration for fast production builds
 * Handles ESM imports without file extensions
 */

import { build } from 'esbuild';

const config = {
  entryPoints: ['main.ts'],
  bundle: true,
  platform: 'node',
  target: 'node20',
  format: 'esm',
  outfile: 'dist/bundle.js',
  sourcemap: true,
  minify: false, // Keep readable for debugging
  
  // External dependencies (not bundled)
  external: [
    // Node.js built-ins
    'fs',
    'path',
    'os',
    'crypto',
    'events',
    'stream',
    'url',
    'util',
    'zlib',
    'buffer',
    'child_process',
    'net',
    'http',
    'https',
    'tls',
    // npm dependencies
    '@vscode/copilot-api',
    'dotenv',
    'fs-extra'
  ],
  
  // Enable modern features
  allowOverwrite: true,
  logLevel: 'info',
  
  // Handle import resolution
  resolveExtensions: ['.ts', '.js', '.json'],
  
  // Preserve function names for better debugging
  keepNames: true,
  
  // Tree shaking for smaller bundles
  treeShaking: true,
  
  // Banner for Node.js ESM compatibility
  banner: {
    js: '// Built with esbuild for Node.js ESM\n'
  }
};

// Build function
export async function buildProd() {
  try {
    console.log('🚀 Building production bundle with esbuild...');
    
    const result = await build(config);
    
    console.log('✅ Build completed successfully!');
    console.log(`📦 Output: ${config.outfile}`);
    
    if (result.warnings.length > 0) {
      console.warn('⚠️  Build warnings:', result.warnings);
    }
    
  } catch (error) {
    console.error('❌ Build failed:', error);
    process.exit(1);
  }
}

// Run build if called directly
if (import.meta.url === `file://${process.argv[1]}`) {
  buildProd();
}
