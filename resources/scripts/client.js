import { build } from './build.js';
import JavaScriptObfuscator from 'javascript-obfuscator';
import { readFileSync, writeFileSync } from 'fs';

// Auto-run build
await build({
  platform: 'browser',
  target: ['es2021'],
  format: 'iife',
  entryPoints: ['game/client/index.ts'],
  outfile: '../build/client.js',
})

// Obfuscate the output file if not in dev mode
if (!process.argv.includes('--dev')) {
  const outputFilePath = '../build/client.js';
  const code = readFileSync(outputFilePath, 'utf-8');

  const obfuscationResult = JavaScriptObfuscator.obfuscate(code, {
    compact: true,
    controlFlowFlattening: true,
    controlFlowFlatteningThreshold: 1,
    deadCodeInjection: false,
    debugProtection: true,
    debugProtectionInterval: 0,
    disableConsoleOutput: true,
    identifierNamesGenerator: 'hexadecimal',
    log: false,
    numbersToExpressions: false,
    renameGlobals: false,
    selfDefending: true,
    simplify: true,
    splitStrings: true,
    stringArray: true,
    stringArrayCallsTransform: true,
    stringArrayCallsTransformThreshold: 1,
    stringArrayEncoding: ['rc4'],
    stringArrayIndexShift: true,
    stringArrayRotate: true,
    stringArrayShuffle: true,
    stringArrayWrappersCount: 1,
    stringArrayWrappersChainedCalls: true,
    stringArrayWrappersParametersMaxCount: 2,
    stringArrayWrappersType: 'function',
    stringArrayThreshold: 0.75,
    unicodeEscapeSequence: false,
  });

  writeFileSync(outputFilePath, obfuscationResult.getObfuscatedCode());
  console.log('✅ Obfuscation complete.');
}