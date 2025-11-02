import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { resolve } from 'path';
import rollupNodePolyFill from 'rollup-plugin-node-polyfills';



// Custom plugin to handle problematic modules
function handleProblematicModules() {
  const problematicModules = [
    '@keystonehq/bc-ur-registry-sol',
    '@keystonehq/bc-ur-registry',
    'axios'
  ];
  
  return {
    name: 'handle-problematic-modules',
    resolveId(id) {
      if (problematicModules.some(mod => id.includes(mod))) {
        return { id, external: true };
      }
      return null;
    }
  };
}

// https://vitejs.dev/config/
export default defineConfig({
  base: '/',
  plugins: [
    react(),
    handleProblematicModules()
  ],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    alias: {
      buffer: 'buffer/',
      './runtimeConfig': './runtimeConfig.browser',
    },
  },
  define: {
    global: 'window',
    'process.env': {}
  },
  server: {
    port: 5173,
    host: true,
    strictPort: true,
    proxy: {
      '/api': {
        target: 'http://localhost:5050',
        changeOrigin: true,
        secure: false,
      }
    },
    historyApiFallback: true
  },
  build: {
    commonjsOptions: {
      transformMixedEsModules: true,
    },
    rollupOptions: {
      plugins: [rollupNodePolyFill()],
      output: {
        manualChunks: {
          vendor: [
            'react',
            'react-dom',
            'react-router-dom',
            '@solana/web3.js',
            '@solana/wallet-adapter-react'
          ]
        }
      }
    }
  },
  optimizeDeps: {
    include: [
      '@solana/wallet-adapter-base',
      '@solana/wallet-adapter-react',
      '@solana/wallet-adapter-react-ui',
      '@solana/web3.js'
    ],
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  },
});
