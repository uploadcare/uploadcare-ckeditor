'use strict'

var searchSelectedElement = require ('../tools/search-selected-element');

module.exports = function() {
  if (typeof uploadcare == 'undefined') {
    return; // not loaded yet
  }
  var editor = CKEDITOR.currentInstance;
  
  var config = editor.config.uploadcare || {};
  
  // Apply default properties.
  if ( ! ('crop' in config)) {
    config.crop = '';
  }

  uploadcare.plugin(function(uc) {
    var settings, element, file;

    if (element = searchSelectedElement(editor, 'img')) {
      file = element.getAttribute('src');
    } else if (element = searchSelectedElement(editor, 'a')) {
      file = element.getAttribute('href');
    }

    if (file && uc.utils.splitCdnUrl(file)) {
      settings = uc.settings.build(
        uc.jQuery.extend({}, config, {multiple: false})
      );
      file = uploadcare.fileFrom('uploaded', file, settings);
    } else {
      settings = uc.settings.build(config)
      file = null;
    }

    var dialog = uploadcare.openDialog(file, settings).done(function(selected) {
      var files = settings.multiple ? selected.files() : [selected];
      uc.jQuery.when.apply(null, files).done(function() {
        uc.jQuery.each(arguments, function() {
          var imageUrl = this.cdnUrl;
          if (this.isImage && ! this.cdnUrlModifiers) {
            imageUrl += '-/preview/';
          }
          if (element) {
            var widget;
            if (editor.widgets && (widget = editor.widgets.selected[0])
                && widget.element === element
            ) {
              widget.setData('src', imageUrl).setData('height', null)
            } else if (element.getName() == 'img') {
              element.data('cke-saved-src', '');
              element.setAttribute('src', imageUrl);
              element.removeAttribute('width');
              element.removeAttribute('height');
            } else {
              element.data('cke-saved-href', '');
              element.setAttribute('href', this.cdnUrl);
            }
          } else {
            if (this.isImage) {
              editor.insertHtml('<img src="' + imageUrl + '" alt=""/><br>', 'unfiltered_html');
            } else {
              editor.insertHtml('<a href="' + this.cdnUrl + '">' + this.name + '</a> ', 'unfiltered_html');
            }
          }
        });
      });
    });
  });
}