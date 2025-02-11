import { build } from './build.js'

build({
  platform: 'browser',
  target: ['es2021'],
  format: 'iife',
  entryPoints: ['game/client/index.ts'],
  outfile: '../build/client.js',
})
