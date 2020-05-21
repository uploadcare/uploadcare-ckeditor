import jscc from 'rollup-plugin-jscc'
import license from 'rollup-plugin-license'
import copy from 'rollup-plugin-copy'
import pkg from './package.json'

export default {
  input: 'src/uploadcare-ckeditor4.js',
  plugins: [
    copy({
      targets: [{
        src: 'src/icons',
        dest: 'dist/uploadcare/',
      }],
    }),
    license({
      banner: `
        <%= pkg.name %> <%= pkg.version %>
        <%= pkg.description %>
        <%= pkg.homepage %>
        Date: <%= moment().format('YYYY-MM-DD') %>
      `,
    }),
    jscc({values: {_WIDGET_VERSION: pkg.widgetVersion}}),
  ],
  output: {
    file: 'dist/uploadcare/plugin.js',
    format: 'iife',
  },
}
