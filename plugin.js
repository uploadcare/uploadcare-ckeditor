// Uploadcare CKeditor plugin
// Version: 1.3.0

CKEDITOR.plugins.add('uploadcare', {
  hidpi: true,
  icons: 'uploadcare',
  init : function(editor) {
    var config = editor.config.uploadcare || {};
    var version = config.widgetVersion || '1.2.2';
    var widget_url = 'https://ucarecdn.com/widget/' + version +
             '/uploadcare/uploadcare-' + version + '.min.js'

    // Check for custom crop
    if (typeof UPLOADCARE_CROP === 'undefined') {
      UPLOADCARE_CROP = "";
    }

    UPLOADCARE_AUTOSTORE = true;
    CKEDITOR.scriptLoader.load(widget_url);

    function searchSelectedElement(editor, needle) {
      var sel = editor.getSelection();
      var element = sel.getSelectedElement();
      if (element && element.is(needle)) {
        return element;
      }

      var range = sel.getRanges()[0];
      if (range) {
        range.shrink(CKEDITOR.SHRINK_TEXT);
        return editor.elementPath(range.getCommonAncestor()).contains(needle, 1);
      }
    }

    editor.addCommand('showUploadcareDialog', {
      allowedContent: 'img[!src,alt]{width,height};a[!href]',
      requiredContent: 'img[src];a[href]',
      exec : function() {
        if (typeof uploadcare == 'undefined') {
          return; // not loaded yet
        }

        uploadcare.plugin(function(uc) {
          var settings = uc.settings.build(config);
          var element;
          var file;

          if (element = searchSelectedElement(editor, 'img')) {
            file = element.getAttribute('src');
          } else if (element = searchSelectedElement(editor, 'a')) {
            file = element.getAttribute('href');
          }

          if (file && uc.utils.splitCdnUrl(file)) {
            file = uploadcare.fileFrom('uploaded', file, settings);
            settings.multiple = false;
          } else {
            file = null;
          }

          var dialog = uploadcare.openDialog(file, settings).done(function(selected) {
            var files = settings.multiple ? selected.files() : [selected];
            uc.jQuery.when.apply(null, files).done(function() {
              uc.jQuery.each(arguments, function() {
                var url = this.cdnUrl;
                if (element) {
                  if (element.getName() == 'img') {
                    element.setAttribute('src', url);
                  } else {
                    element.setAttribute('href', url);
                  }
                } else {
                  if (this.isImage) {
                    editor.insertHtml('<img src="' + url + '" alt="" />', 'unfiltered_html');
                  } else {
                    editor.insertHtml('<a href="' + url + '">'+this.name+'</a>', 'unfiltered_html');
                  }
                }
              });
            });
          });

        });
      }
    });

    editor.ui.addButton && editor.ui.addButton('Uploadcare', {
      label : 'Uploadcare',
      toolbar : 'insert',
      command : 'showUploadcareDialog'
    });
  }
});
