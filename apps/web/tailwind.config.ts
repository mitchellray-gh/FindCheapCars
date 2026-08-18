import type { Config } from 'tailwindcss';
import forms from '@tailwindcss/forms';

const config: Config = {
  content: [
    './src/**/*.{ts,tsx}',
  ],
  theme: {
    extend: {
      colors: {
        dashboard: {
          bg: '#020617',
          card: '#0f172a',
          border: '#1e293b',
          'border-light': '#334155',
        },
        brand: {
          primary: '#3b82f6',
          'primary-hover': '#2563eb',
          success: '#10b981',
          warning: '#f59e0b',
          danger: '#ef4444',
        },
      },
      fontFamily: {
        sans: ['Inter', 'system-ui', '-apple-system', 'sans-serif'],
        mono: ['JetBrains Mono', 'Fira Code', 'monospace'],
      },
    },
  },
  plugins: [
    forms,
  ],
};

export default config;
