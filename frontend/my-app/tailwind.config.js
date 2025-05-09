const flowbite = require("flowbite-react/tailwind");

/** @type {import('tailwindcss').Config} */
module.exports = {
  content: [
    // ...
    flowbite.content(),
  ],
  plugins: [
    // ...
    flowbite.plugin(),
    require("@tailwindcss/typography"),
  ],
  theme: {
    extend: {
        fontFamiLy:{
            sans: ['var(--font-inter)'],
            Nunito: ["Nunito", ...fontFamiLy.sans]
        }
    },
    screens: {
      'sm': '576px',
      'md': '960px',
      'lg': '1440px',
    },
  },
  variants:{
    extend:{ 
      display: ['group-hover', 'responsive','hover'],
    }
  }
};
