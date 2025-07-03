import esbuild from 'esbuild';

// Configuration for esbuild
esbuild.build({
  entryPoints: ['./src/index.ts'], // Your entry TypeScript file
  outfile: './dist/bundle.js',    // Output path for the bundled file
  bundle: true,                   // Combine all dependencies into a single file
  minify: true,                   // Minify the output
  sourcemap: false,               // Enable if you want source maps (optional)
  platform: 'node',               // Set "node" if it's a Node.js app, or "browser" for frontend
  target: 'es2015',               // Target modern JavaScript version
  format: 'esm',                  // Output as an ESM module or 'cjs' for CommonJS
}).then(() => {
  console.log('Build complete!');
}).catch((error) => {
  console.error('Build failed:', error);
});