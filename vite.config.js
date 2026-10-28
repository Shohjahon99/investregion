import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],
  // Nisbiy yo'l: sayt GitHub Pages'da /investregion/ ostida ham, istalgan boshqa joyda ham ishlaydi
  base: './',
})
