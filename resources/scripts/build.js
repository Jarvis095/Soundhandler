import esbuild from 'esbuild'

const dev = process.argv[2] === '-dev'

export const build = async (esbuildOptions) => {
  const ctx = await esbuild.context({
    bundle: true,
    format: 'esm',
    target: 'esnext',
    logLevel: 'info',
    sourcemap: 'both',
    minify: !dev,
    // keepNames: dev,
    keepNames: true,
    define: {
      __DEV_MODE__: `${dev}`,
    },
    ...esbuildOptions,
  })

  if (dev) {
    ctx.watch()
  } else {
    ctx.rebuild()
    ctx.dispose()
  }
}
