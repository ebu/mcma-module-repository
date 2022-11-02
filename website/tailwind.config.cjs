const flattenColorPalette = require("tailwindcss/lib/util/flattenColorPalette").default;

module.exports = {
  mode: "jit",
  content: ["./src/**/*.{html,ts,scss,css}"],
  darkMode: "media",
  theme: {
    extend: {
      colors: {
        customGray: {
          lightBorder: "#3a4350",
          lighter: "#394559",
          light: "#303c4f",
          DEFAULT: "#2a2e37",
          alt: "#282e35",
          dark: "#222631",
          darker: "#1a1e26"
        },
        turquoise: {
          light: "#79f1e7",
          DEFAULT: "#5eddd3",
          dark: "#0cc4b8",
          darker: "#00a89a"
        },
        customPurple: {
          darkest: "#5d75cc",
          darker: "#6880d4",
          dark: "#7289da",
          DEFAULT: "#7289da",
          light: "#7c9aff",
          lighter: "#8fa8ff",
          lightest: "#9fbcff"
        }
      },
      backgroundImage: {
        "hero": "url('src/assets/hero.jpg')"
      }
    }
  },
  variants: {
    extend: {},
  },
  plugins: [
    ({ addUtilities, theme, variants }) => {
      let colors = flattenColorPalette(theme('borderColor'));
      delete colors['default'];

      if (this.theme?.extend?.colors !== undefined){
        colors = Object.assign(colors, this.theme.extend.colors);
      }

      const colorMap = Object.keys(colors)
          .map(color => ({
            [`.border-t-${color}`]: {borderTopColor: colors[color]},
            [`.border-r-${color}`]: {borderRightColor: colors[color]},
            [`.border-b-${color}`]: {borderBottomColor: colors[color]},
            [`.border-l-${color}`]: {borderLeftColor: colors[color]},
          }));

      const utilities = Object.assign({}, ...colorMap);

      addUtilities(utilities, variants('borderColor'));
    },
  ]
}
