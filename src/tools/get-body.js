'use strict'

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
