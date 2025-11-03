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

function injectGlobalRequest() {
  return {
    name: 'inject-global-request',
    enforce: 'pre',
    transform(code, id) {
      if (id.endsWith('main.jsx')) {
        const polyfill = `
          globalThis.Request = globalThis.Request || fetch('').constructor;
          globalThis.Headers = globalThis.Headers || new fetch('').constructor('').headers.constructor;
          globalThis.Response = globalThis.Response || new Response().constructor;
        `;
        return {
          code: polyfill + '\n' + code,
          map: null,
        };
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
    handleProblematicModules(),
    injectGlobalRequest()
  ],
  resolve: {
    extensions: ['.js', '.jsx', '.ts', '.tsx'],
    alias: {
      buffer: 'buffer/',
      './runtimeConfig': './runtimeConfig.browser',
    },
  },
  define: {
    global: 'globalThis',
    'process.env': {},
    'globalThis.Request': 'fetch("").constructor',
    'globalThis.Headers': 'new fetch("").constructor("").headers.constructor',
    'globalThis.Response': 'new Response().constructor',
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
      '@solana/web3.js',
      'motion-utils'
    ],
    esbuildOptions: {
      define: {
        global: 'globalThis'
      }
    }
  },
});
