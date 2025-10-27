import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [react()],
  // IMPORTANTE: Altere 'pokerace-ae503' para o nome exato do seu repositório no GitHub.
  base: '/pokerace-ae503/',
});
