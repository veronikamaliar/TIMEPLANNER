/** @type {import('tailwindcss').Config} */
export default {
  content: [
    "./index.html",
    "./src/**/*.{vue,js,ts,jsx,tsx}", // Прибрав пробіл після коми (теж міг бути баг)
  ],
  theme: {
    extend: {
      fontFamily: {
        sans: ['Montserrat Alternates', 'sans-serif']
      },
      colors: {
        brand: {
          // Ніжно-рожевий
          rose: '#FCE7F3',
          'rose-dark': '#FDA4AF',
          
          // Пастельний зелений
          matcha: '#D1FAE5',
          'matcha-dark': '#6EE7B7',
          
          // Нейтральні пастельні для тексту
          'text-main': '#4B5563',
          'text-soft': '#9CA3AF',
        }
      }, // <- Тут була зайва дужка і не було коми
      fontSize: {
        xs:   "12px",
        sm:   "14px",
        base: "16px",
        lg:   "18px",
        xl:   "20px",
        "2xl": "24px",
        "3xl": "32px",
      },
    },
  },
  plugins: [],
}