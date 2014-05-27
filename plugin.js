// Uploadcare CKeditor plugin
// Version: 1.3.0

CKEDITOR.plugins.add('uploadcare', {
    hidpi: true,
    icons: 'uploadcare',
    init : function(editor) {
        var config = editor.config.uploadcare || {};
        var version = config.widgetVersion || '1.2.0';
        var widget_url = 'https://ucarecdn.com/widget/' + version +
                         '/uploadcare/uploadcare-' + version + '.min.js'

        // Check for custom crop
        if (typeof UPLOADCARE_CROP === 'undefined') {
            UPLOADCARE_CROP = "";
        }

        UPLOADCARE_AUTOSTORE = true;
        CKEDITOR.scriptLoader.load(widget_url);

        editor.addCommand('showUploadcareDialog', {
            allowedContent: 'img',
            requiredContent: 'img',
            exec : function() {
                var dialog = uploadcare.openDialog().done(function(file) {
                    file.done(function(fileInfo) {
                        url = fileInfo.cdnUrl;
                        if (fileInfo.isImage) {
                            editor.insertHtml('<img src="'+url+'" />', 'unfiltered_html');
                        } else {
                            editor.insertHtml('<a href="'+url+'">'+fileInfo.name+'</a>', 'unfiltered_html');
                        }
                    });
                });
            }
        });

        editor.ui.addButton('Uploadcare', {
            label : 'Uploadcare',
            toolbar : 'insert',
            command : 'showUploadcareDialog',
            allowedContent: 'img[alt,dir,id,lang,longdesc,!src,title]{*}(*)',
            requiredContent: 'img[alt,src]'
        });
    }
});
