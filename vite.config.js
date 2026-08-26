import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
    plugins: [react()],
    server: {
        // Spotify only accepts HTTPS or loopback-IP redirect URIs, so dev has to
        // run on 127.0.0.1 rather than localhost for the OAuth round trip to work.
        host: '127.0.0.1',
        port: 3000
    },
    build: {
        outDir: 'dist'
    }
});
