'use strict'

var editor = require('../globals/editor').editor;

module.exports = function getBody() {
  try {
    var editor = CKEDITOR.currentInstance;
    var editable = editor.editable();
    var doc = editable.getDocument();
    return doc.getBody();
  } catch (ex) {
    return null;      
  }
}
