import { defineConfig } from 'vitest/config';
import react from '@vitejs/plugin-react'


export default defineConfig({
    plugins: [react()],
    server: {
        port: 5173,
        proxy: {
            '/api': 'http://localhost:3000'
        }
    }
})