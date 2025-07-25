/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  darkMode: 'class',
  theme: {
    extend: {
      colors: {
        // Eve-Cortex Brand Colors
        cortex: {
          blue: {
            DEFAULT: '#0066FF',
            50: '#E6F2FF',
            100: '#CCE5FF',
            200: '#99CCFF',
            300: '#66B2FF',
            400: '#3399FF',
            500: '#0066FF',
            600: '#0052CC',
            700: '#003D99',
            800: '#002966',
            900: '#001433',
          },
        },
        neural: {
          purple: {
            DEFAULT: '#6B46C1',
            50: '#F3F0FF',
            100: '#E7E0FF',
            200: '#CFC1FF',
            300: '#B7A2FF',
            400: '#9F83FF',
            500: '#8B5CF6',
            600: '#6B46C1',
            700: '#553C9A',
            800: '#3F2973',
            900: '#29174C',
          },
        },
        eve: {
          gold: {
            DEFAULT: '#FFB800',
            50: '#FFF9E6',
            100: '#FFF3CC',
            200: '#FFE799',
            300: '#FFDB66',
            400: '#FFCF33',
            500: '#FFB800',
            600: '#E6A600',
            700: '#B38500',
            800: '#806000',
            900: '#4D3A00',
          },
        },
        // Dark Theme Colors
        dark: {
          primary: '#0A0A0B',
          secondary: '#1A1A1C',
          tertiary: '#2A2A2E',
          quaternary: '#3A3A3E',
        },
        // Status Colors
        success: {
          DEFAULT: '#10B981',
          50: '#ECFDF5',
          100: '#D1FAE5',
          200: '#A7F3D0',
          300: '#6EE7B7',
          400: '#34D399',
          500: '#10B981',
          600: '#059669',
          700: '#047857',
          800: '#065F46',
          900: '#064E3B',
        },
        warning: {
          DEFAULT: '#F59E0B',
          50: '#FFFBEB',
          100: '#FEF3C7',
          200: '#FDE68A',
          300: '#FCD34D',
          400: '#FBBF24',
          500: '#F59E0B',
          600: '#D97706',
          700: '#B45309',
          800: '#92400E',
          900: '#78350F',
        },
        error: {
          DEFAULT: '#EF4444',
          50: '#FEF2F2',
          100: '#FEE2E2',
          200: '#FECACA',
          300: '#FCA5A5',
          400: '#F87171',
          500: '#EF4444',
          600: '#DC2626',
          700: '#B91C1C',
          800: '#991B1B',
          900: '#7F1D1D',
        },
      },
      fontFamily: {
        sans: ['Inter', 'SF Pro Display', '-apple-system', 'BlinkMacSystemFont', 'sans-serif'],
        mono: ['JetBrains Mono', 'SF Mono', 'Monaco', 'Cascadia Code', 'monospace'],
      },
      fontSize: {
        '6xl': ['3.75rem', { lineHeight: '1.1' }],
        '5xl': ['3rem', { lineHeight: '1.1' }],
        '4xl': ['2.25rem', { lineHeight: '1.2' }],
        '3xl': ['1.875rem', { lineHeight: '1.3' }],
        '2xl': ['1.5rem', { lineHeight: '1.4' }],
        xl: ['1.25rem', { lineHeight: '1.5' }],
        lg: ['1.125rem', { lineHeight: '1.6' }],
        base: ['1rem', { lineHeight: '1.6' }],
        sm: ['0.875rem', { lineHeight: '1.6' }],
        xs: ['0.75rem', { lineHeight: '1.6' }],
      },
      spacing: {
        18: '4.5rem',
        88: '22rem',
        128: '32rem',
      },
      borderRadius: {
        '4xl': '2rem',
      },
      boxShadow: {
        cortex: '0 4px 12px rgba(0, 102, 255, 0.3)',
        neural: '0 4px 12px rgba(107, 70, 193, 0.3)',
        eve: '0 4px 12px rgba(255, 184, 0, 0.3)',
        glow: '0 0 20px rgba(0, 102, 255, 0.5)',
        'inner-glow': 'inset 0 0 20px rgba(0, 102, 255, 0.1)',
      },
      backgroundImage: {
        'gradient-cortex': 'linear-gradient(135deg, #0066FF, #6B46C1)',
        'gradient-neural': 'linear-gradient(135deg, #6B46C1, #FFB800)',
        'gradient-radial': 'radial-gradient(var(--tw-gradient-stops))',
        'gradient-conic': 'conic-gradient(from 180deg at 50% 50%, var(--tw-gradient-stops))',
      },
      animation: {
        'pulse-slow': 'pulse 3s cubic-bezier(0.4, 0, 0.6, 1) infinite',
        'bounce-slow': 'bounce 2s infinite',
        'spin-slow': 'spin 3s linear infinite',
        'fade-in': 'fadeIn 0.5s ease-in-out',
        'slide-up': 'slideUp 0.3s ease-out',
        'slide-down': 'slideDown 0.3s ease-out',
      },
      keyframes: {
        fadeIn: {
          '0%': { opacity: '0' },
          '100%': { opacity: '1' },
        },
        slideUp: {
          '0%': { transform: 'translateY(10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
        slideDown: {
          '0%': { transform: 'translateY(-10px)', opacity: '0' },
          '100%': { transform: 'translateY(0)', opacity: '1' },
        },
      },
    },
  },
  plugins: [require('@tailwindcss/forms'), require('@tailwindcss/typography')],
}
