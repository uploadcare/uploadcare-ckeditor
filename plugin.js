CKEDITOR.plugins.add('uploadcare', {
    requires : [ 'iframedialog' ],
    init : function(editor) {
        var me = this;
        var _file_id;

        CKEDITOR.scriptLoader.load('https://ucarecdn.com/widget/0.6.7/uploadcare/uploadcare-0.6.7.min.js');
        CKEDITOR.scriptLoader.load(me.path + 'config.js');

        editor.addCommand('uploadcareDialog', new CKEDITOR.dialogCommand('uploadcareDialog'));

        editor.addCommand('showUploadcareDialog', {exec: function() {
            var circle = new uploadcare.Circle('.cke_button__uploadcare_icon');
            var dialog = uploadcare.openDialog().done(function(file) {
                file.startUpload();
                circle.listen(file.upload);
                file.upload.done(function() {
                    _file_id = file.fileId;
                    editor.execCommand('uploadcareDialog', true);
                });
            });
        }});

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
                        src : me.path + 'dialog.php?file_id='+_file_id,
                        width : '800',
                        height : '600',
                        onContentLoad : function() {
                            var iframe = document.getElementById(this._.frameId), iframeWindow = iframe.contentWindow;
                            iframeWindow.document.getElementById('editor_name').value = editor.name;
                        }
                    } ]
                } ]
            };
        });
    }
});
