import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import basicSsl from '@vitejs/plugin-basic-ssl'
import path from 'path'

// https://vite.dev/config/
// Phone cameras (the inventory scanner) need a secure context. Run
// `VITE_HTTPS=1 npm run dev -- --host` to serve the dev server over HTTPS on
// the LAN with a self-signed certificate (accept the warning on the phone).
export default defineConfig(({ mode }) => ({
  plugins: [react(), tailwindcss(), ...(process.env.VITE_HTTPS && mode !== 'production' ? [basicSsl()] : [])],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
}))
