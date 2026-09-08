const fs = require('node:fs/promises');
const path = require('node:path');

const esbuild = require('esbuild');

const project_directory = path.resolve(__dirname, '..');
const output_directory = path.join(project_directory, 'dist');

const build_webserver = async () => {
  await fs.rm(output_directory, { force: true, recursive: true });

  await esbuild.build({
    entryPoints: [path.join(project_directory, 'src/server.js')],
    outfile: path.join(output_directory, 'server.js'),
    bundle: true,
    format: 'cjs',
    platform: 'node',
    target: 'node20',
    packages: 'external',
    sourcemap: true,
    logLevel: 'info',
  });

  await fs.cp(
    path.join(project_directory, 'src/public'),
    path.join(output_directory, 'public'),
    { recursive: true },
  );

  console.log('Webserver build completed in dist/');
};

build_webserver().catch((error) => {
  console.error(`Webserver build failed: ${error.message}`);
  process.exit(1);
});
