import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
  // Load env file based on `mode` in the current working directory.
  // Setting the third parameter to '' loads all env regardless of the `VITE_` prefix.
  const env = loadEnv(mode, process.cwd(), '')

  return {
    base: '/',
    plugins: [react()],
    define: {
      // Critical: This replaces 'process.env.API_KEY' in your code with the actual value during build.
      'process.env.API_KEY': JSON.stringify(env.API_KEY),
      // Polyfill the rest of process.env to prevent runtime crashes if other libs reference it.
      'process.env': {}
    }
  }
})