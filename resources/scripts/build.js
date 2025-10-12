import esbuild from 'esbuild';

const dev = process.argv.includes('--dev');

export const build = async (esbuildOptions) => {
  const ctx = await esbuild.context({
    bundle: true,
    logLevel: 'info',
    sourcemap: 'inline',
    minify: false,
    keepNames: true, // Only keep names in dev mode
    define: {
      __DEV_MODE__: dev ? 'true' : 'false', // Ensure proper boolean value
    },
    ...esbuildOptions,
  });

  if (dev) {
    await ctx.watch();
    console.log('⚡ Watching for changes...');
  } else {
    await ctx.rebuild();
    await ctx.dispose();
    console.log('✅ Build complete.');
  }
};