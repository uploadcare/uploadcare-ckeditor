'use strict'

var editor = require('../globals/editor').editor;

module.exports = function getBody() {
  var editable = editor.editable();
  return editable.getDocument().getDocumentElement().findOne('body');
}