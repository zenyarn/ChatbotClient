module.exports = {
  content: [
    './src/app/**/*.{js,ts,jsx,tsx}',
    './src/components/**/*.{js,ts,jsx,tsx}',
  ],
  theme: {
    extend: {
      spacing: {
        '0.25': '0.0625rem', // 1px
      }
    }
  },
  plugins: [
    require('@tailwindcss/typography'),
    // 其他插件...
  ],
} 