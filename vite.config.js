import { defineConfig, loadEnv } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { readFileSync } from 'fs'
import { resolve } from 'path'

// Plugin to inject environment variables by reading .env file directly
function injectEnvPlugin(googleSheetUrl, apiUrl) {
  return {
    name: 'inject-env',
    configResolved() {
      // Plugin initialized
    },
    transform(code, id) {
      // Replace import.meta.env.VITE_GOOGLE_SHEET_URL with the actual value
      if (id.includes('node_modules')) return null
      
      if (code.includes('import.meta.env.VITE_GOOGLE_SHEET_URL')) {
        return code.replace(
          /import\.meta\.env\.VITE_GOOGLE_SHEET_URL/g,
          JSON.stringify(googleSheetUrl)
        )
      }
      return null
    }
  }
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  // Try loadEnv first
  const env = loadEnv(mode, process.cwd(), 'VITE_')
  
  // Read .env file directly since loadEnv seems to not be working
  let googleSheetUrl = env.VITE_GOOGLE_SHEET_URL || ''
  let apiUrl = env.VITE_API_URL || ''
  
  // Always try reading .env file directly as primary method
  try {
    const envPath = resolve(process.cwd(), '.env')
    
    // Read file - detect and handle encoding properly
    let envContent
    const buffer = readFileSync(envPath)
    
    // Check for UTF-16 LE BOM (FF FE)
    if (buffer[0] === 0xFF && buffer[1] === 0xFE) {
      envContent = buffer.toString('utf16le', 2) // Skip BOM (2 bytes)
    } 
    // Check if it's UTF-16 - look for the pattern after UTF-8 BOM or in the content
    // Pattern: UTF-16 has null bytes between ASCII characters
    else if (buffer.length >= 10) {
      let startOffset = 0
      // Skip UTF-8 BOM if present (ef bb bf)
      if (buffer[0] === 0xEF && buffer[1] === 0xBB && buffer[2] === 0xBF) {
        startOffset = 3
      }
      
      // Check if bytes after BOM show UTF-16 pattern (ASCII char, null, ASCII char, null...)
      if (buffer.length > startOffset + 5 &&
          buffer[startOffset + 1] === 0 && 
          buffer[startOffset + 3] === 0 && 
          buffer[startOffset + 5] === 0 &&
          buffer[startOffset] >= 32 && buffer[startOffset] <= 126) {
        // Read as UTF-16 starting from the actual content (skip UTF-8 BOM if present)
        envContent = buffer.toString('utf16le', startOffset)
      } else {
        // Try UTF-8
        envContent = buffer.toString('utf-8', startOffset)
        // Remove UTF-8 BOM if present (already skipped in startOffset, but check for char BOM)
        if (envContent.charCodeAt(0) === 0xFEFF) {
          envContent = envContent.slice(1)
        }
      }
    } else {
      // Try UTF-8
      envContent = buffer.toString('utf-8')
      if (envContent.charCodeAt(0) === 0xFEFF) {
        envContent = envContent.slice(1)
      }
    }
    
    // Remove any remaining BOM or non-printable characters at the start
    envContent = envContent.replace(/^\uFEFF/, '').trimStart()
    
    const lines = envContent.split(/\r?\n/)
    
    for (let i = 0; i < lines.length; i++) {
      // Remove BOM and trim
      let trimmedLine = lines[i].replace(/^\uFEFF/, '').trim()
      if (!trimmedLine || trimmedLine.startsWith('#')) continue
      
      // Parse VITE_GOOGLE_SHEET_URL - use regex that doesn't require exact start
      const googleSheetMatch = trimmedLine.match(/VITE_GOOGLE_SHEET_URL\s*=\s*(.+)$/)
      if (googleSheetMatch && googleSheetMatch[1]) {
        googleSheetUrl = googleSheetMatch[1].trim()
      }
      
      // Parse VITE_API_URL - use regex that doesn't require exact start
      const apiUrlMatch = trimmedLine.match(/VITE_API_URL\s*=\s*(.+)$/)
      if (apiUrlMatch && apiUrlMatch[1]) {
        apiUrl = apiUrlMatch[1].trim()
      }
    }
  } catch (e) {
    // Silently handle errors - fall back to empty values
  }
  
  return {
    plugins: [
      react(), 
      tailwindcss(),
      injectEnvPlugin(googleSheetUrl, apiUrl)
    ],
    build: {
      outDir: 'dist',
      assetsDir: 'assets',
      sourcemap: false,
      minify: 'esbuild',
      rollupOptions: {
        output: {
          manualChunks: {
            vendor: ['react', 'react-dom'],
            router: ['react-router-dom'],
            ui: ['react-icons']
          }
        }
      }
    },
    server: {
      port: 5173,
      host: true
    },
    // Explicitly define the env vars so they're available in the client
    // This works by replacing the property access at build time
    define: {
      'import.meta.env.VITE_GOOGLE_SHEET_URL': JSON.stringify(googleSheetUrl),
      'import.meta.env.VITE_API_URL': JSON.stringify(apiUrl)
    },
    envPrefix: 'VITE_'
  }
})
