'use strict'

module.exports = function (editor, needle) {
  var sel = editor.getSelection();
  var element = sel.getSelectedElement();
  if (element && element.is(needle)) {
    return element;
  }

  var widget;
  if (editor.widgets && (widget = editor.widgets.selected[0])) {
    if (widget.element.is(needle)) {
      return widget.element;
    }
  }

  var range = sel.getRanges()[0];
  if (range) {
    range.shrink(CKEDITOR.SHRINK_TEXT);
    return editor.elementPath(range.getCommonAncestor()).contains(needle, 1);
  }
}