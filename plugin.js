UPLOADCARE_CROP = true;

CKEDITOR.plugins.add('uploadcare', {
    init : function(editor) {
        var me = this;
        var _file_id;

        CKEDITOR.scriptLoader.load(me.path + 'config.js', function() {
            UPLOADCARE_CROP = !USE_PHP;
            UPLOADCARE_AUTOSTORE = !USE_PHP;
            CKEDITOR.scriptLoader.load('https://ucarecdn.com/widget/0.8.1/uploadcare/uploadcare-0.8.1.min.js');
        });

        editor.addCommand('uploadcareDialog', new CKEDITOR.dialogCommand('uploadcareDialog'));

        editor.addCommand('showUploadcareDialog', {
            exec : function() {
                var dialog = uploadcare.openDialog().done(function(file) {
                    file.done(function(fileInfo) {
                        _file_id = fileInfo.uuid;
                        dialog_path = me.path + 'dialog.php?file_id=' + _file_id;
                        url = fileInfo.cdnUrl;
                        if (USE_PHP) {
                            editor.execCommand('uploadcareDialog', true);
                        } else {
                            if (fileInfo.isImage) {
                                editor.insertHtml('<img src="'+url+'" />', 'unfiltered_html');
                            } else {
                                editor.insertHtml('<a href="'+url+'">'+fileInfo.name+'</a>', 'unfiltered_html');
                            }
                        }
                    });
                });
            }
        });

        editor.ui.addButton('Uploadcare', {
            label : 'Uploadcare',
            toolbar : 'insert',
            command : 'showUploadcareDialog',
            icon : this.path + 'images/logo.png'
        });

        CKEDITOR.dialog.add('uploadcareDialog', function() {
            return {
                title : 'Uploadcare',
                minWidth : 800,
                minHeight : 600,
                onShow : function() {
                    document.getElementById(this.getButton('ok').domId).style.display = 'none';
                },
                contents : [ {
                    id : 'iframe',
                    label : 'Uploadcare',
                    expand : false,
                    elements : [ {
                        type : 'iframe',
                        src : me.path + 'dialog.php?file_id=' + _file_id,
                        width : '800',
                        height : '600',
                        onContentLoad : function() {
                            var iframe = document.getElementById(this._.frameId), iframeWindow = iframe.contentWindow;
                            if (iframeWindow.document.getElementById('editor_name')) {
                                iframeWindow.document.getElementById('editor_name').value = editor.name;
                            }
                        }
                    } ]
                } ]
            };
        });
    }
});
