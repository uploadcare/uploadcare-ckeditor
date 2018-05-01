import jscc from 'rollup-plugin-jscc'
import license from 'rollup-plugin-license'
import cp from 'rollup-plugin-cp'
import pkg from './package.json'

export default {
  input: 'src/uploadcare-ckeditor4.js',
  plugins: [
    cp({'src/icons': 'dist/uploadcare/icons/'}),
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
