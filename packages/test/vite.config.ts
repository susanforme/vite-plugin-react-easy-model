import react from '@vitejs/plugin-react';
import { defineConfig } from 'vite';
import Inspect from 'vite-plugin-inspect';
import { model } from 'vite-plugin-react-easy-model';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [Inspect(), react(), model()],
});
