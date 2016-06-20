'use strict'

module.exports = function getBody(editor) {
  try {
    var editable = editor.editable();
    var doc = editable.getDocument();
    return doc.getBody();
  } catch (ex) {
    return null;      
  }
}
