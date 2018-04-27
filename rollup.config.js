import jscc from "rollup-plugin-jscc";
import license from "rollup-plugin-license";
import cp from "rollup-plugin-cp";

const widgetVersion = "3.x";

export default {
  input: "src/uploadcare-ckeditor4.js",
  plugins: [
    cp({
      "icons": "dist/uploadcare/icons/"
    }),
    license({
      banner: `
        Uploadcare CKEditor v4 plugin
        Version: <%= pkg.version %>
      `
    }),
    jscc({
      values: {
        _WIDGET_VERSION: widgetVersion
      }
    })
  ],
  output: {
    file: "dist/uploadcare/plugin.js",
    format: "iife"
  }
};
