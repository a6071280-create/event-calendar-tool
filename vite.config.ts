import { defineConfig } from 'vitest/config'
import react from '@vitejs/plugin-react'

export default defineConfig({
  base: '/event-calendar-tool/',
  plugins: [react()],
  test: {
    environment: 'jsdom',
    globals: true,
  },
})
