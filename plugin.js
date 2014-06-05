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
    CKEDITOR.scriptLoader.load(widget_url);


    // Apply default properties.
    if ( ! 'crop' in config) {
      config.crop = '';
    }
    if ( ! 'autostore' in config) {
      config.autostore = true;
    }

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
