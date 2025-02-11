import { defineConfig } from 'vite';
import typescript from 'vite-plugin-ts';

export default defineConfig({
    plugins: [typescript()], // Enable TypeScript support
    build: {
        outDir: 'dist', // Output directory for the build
        emptyOutDir: true, // Clear the output directory before building
    },
    base: './',
    server: {
        port: 3000, // Development server port
    },
});