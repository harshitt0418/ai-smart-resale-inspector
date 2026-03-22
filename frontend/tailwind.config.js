/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    './src/pages/**/*.{js,ts,jsx,tsx,mdx}',
    './src/components/**/*.{js,ts,jsx,tsx,mdx}',
    './src/app/**/*.{js,ts,jsx,tsx,mdx}',
  ],
  theme: {
    extend: {
      // ─── Brand color palette ───────────────────────────────────────────
      colors: {
        brand: {
          bg:        '#0A0A0A',   // matte black background
          surface:   '#161616',   // dark graphite card / panel surface
          border:    '#1F2937',   // subtle dark gray borders
          accent:    '#22C55E',   // emerald — AI scanning / analysis
          warning:   '#F59E0B',   // amber — repair / damage
          // "red" repurposed as neutral silver-gray (Apple system control style)
          red:       '#8E8E93',   // neutral silver gray — primary interface color
          'red-glow':'#AEAEB2',   // light silver — hover state
          'red-dim': '#48484A',   // dark silver — active state
          white:     '#F5F5F7',   // pure white primary text
          muted:     '#8E8E93',   // cool gray secondary text
          highlight: '#1C1C1E',   // Apple dark surface highlight
        },
      },

      // ─── Typography ────────────────────────────────────────────────────
      fontFamily: {
        sans:  ['Inter', 'ui-sans-serif', 'system-ui'],
        grotesk: ['Space Grotesk', 'ui-sans-serif', 'system-ui'],
        outfit: ['Outfit', 'ui-sans-serif', 'system-ui'],
      },

      // ─── Shadows & glows ───────────────────────────────────────────────
      boxShadow: {
        'glow-red':   '0 0 20px rgba(34,197,94,0.12)',
        'glow-red-lg':'0 0 40px rgba(34,197,94,0.08)',
        'glow-green': '0 0 25px rgba(34,197,94,0.15)',
        'card':       '0 4px 32px rgba(0,0,0,0.80)',
      },

      // ─── Keyframe animations ───────────────────────────────────────────
      keyframes: {
        'scan-line': {
          '0%':   { top: '0%' },
          '100%': { top: '100%' },
        },
        'pulse-border': {
          '0%, 100%': { borderColor: 'rgba(142,142,147,0.25)' },
          '50%':      { borderColor: 'rgba(142,142,147,0.70)' },
        },
        'fade-in': {
          from: { opacity: '0', transform: 'translateY(8px)' },
          to:   { opacity: '1', transform: 'translateY(0)' },
        },
      },
      animation: {
        'scan-line':     'scan-line 2s linear infinite',
        'pulse-border':  'pulse-border 2s ease-in-out infinite',
        'fade-in':       'fade-in 0.4s ease forwards',
      },

      // ─── Background gradients ──────────────────────────────────────────
      backgroundImage: {
        'gradient-radial':  'radial-gradient(var(--tw-gradient-stops))',
        'hero-glow':        'radial-gradient(ellipse at 50% 0%, rgba(34,197,94,0.06) 0%, transparent 60%)',
      },
    },
  },
  plugins: [],
};
