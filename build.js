
const esbuild = require('esbuild');

esbuild.build({
  entryPoints: ['src/content/content.ts'],
  bundle: true,
  outfile: 'dist/content.js',
  platform: 'browser',
  target: 'es2020',
  sourcemap: true,
  minify: false
}).catch(() => process.exit(1));
esbuild.build({
  entryPoints: ['src/content/content.ts'],
  bundle: true,
  outfile: 'dist/content.js',
  platform: 'browser',
  target: 'es2020',
  sourcemap: true,
  minify: false
}).catch(() => process.exit(1));
