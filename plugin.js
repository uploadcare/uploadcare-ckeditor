CKEDITOR.plugins.add('uploadcare', {
    requires : [ 'iframedialog' ],
    init : function(editor) {
        var me = this;
        var _file_id;

        CKEDITOR.scriptLoader.load('https://ucarecdn.com/widget/0.5.0/uploadcare/uploadcare-0.5.0.min.js');
        CKEDITOR.scriptLoader.load('https://ajax.googleapis.com/ajax/libs/jquery/1.8.3/jquery.min.js');
        CKEDITOR.scriptLoader.load(me.path + 'config.js');

        editor.addCommand('uploadcareDialog', new CKEDITOR.dialogCommand('uploadcareDialog'));

        editor.addCommand('showUploadcareDialog', {exec: function() {   
            jQuery('.cke_button__uploadcare_icon').html('');
            var uploader = new uploadcare.uploader.Uploader();
            var circle = new uploadcare.ui.progress.Circle('.cke_button__uploadcare_icon');
            uploadcare.widget.showDialog().pipe(function(file) {
                var upload = uploader.upload(file);
                circle.listen(upload);
                return upload;
            }).fail(function(error) {
            }).done(function(file) {
                _file_id = file.fileId;
                editor.execCommand('uploadcareDialog', true);
            });
        }});         
        
        editor.ui.addButton('Uploadcare', {
            label : 'Uploadcare',
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