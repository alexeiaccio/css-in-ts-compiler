import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { cssints } from '@cssints/unplugin/vite'

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [
    cssints({       
      css: {
        minify: true,
        output: 'styles.css'
      },
      naming: {
        devPrefix: true,
        hashLength: 7
      }
    }) as any,
    react() as any
  ],
})
