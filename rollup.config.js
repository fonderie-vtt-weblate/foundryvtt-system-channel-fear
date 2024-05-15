import sass from 'rollup-plugin-sass';
import autoprefixer from 'autoprefixer';
import postcss from 'postcss';

export default {
  input: './module/channel-fear.mjs',
  output: {
    file: 'assets/channel-fear.js',
    format: 'es',
  },
  plugins: [
    sass({
      output: true,
      processor: css => postcss([autoprefixer])
        .process(css, { from: './assets/channel-fear.css' })
        .then(result => result.css),
    }),
  ],
  watch: ['module/', 'scss/'],
};
