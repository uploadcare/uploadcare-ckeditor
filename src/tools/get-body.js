'use strict'

var editor = require('../globals/editor').editor;

module.exports = function getBody() {
  var editable = editor.editable();
  var doc = editable.getDocument();
  return doc.getBody();
}