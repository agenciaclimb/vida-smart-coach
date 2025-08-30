import path from 'node:path';
import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  	plugins: [react()],
  	server: {
      		cors: true,
      		allowedHosts: true,
    },
  	resolve: {
      		extensions: ['.jsx', '.js', '.tsx', '.ts', '.json'],
      		alias: {
            			'@': path.resolve(__dirname, './src'),
          },
    },
  	build: {
      		outDir: 'dist',
      		sourcemap: false,
      		rollupOptions: {
            			output: {
                    				manualChunks: {
                              					vendor: ['react', 'react-dom'],
                              					ui: ['@radix-ui/react-dialog', '@radix-ui/react-dropdown-menu']
                            }
                  }
          }
    }
});
