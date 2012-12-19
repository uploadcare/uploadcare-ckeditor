CKEDITOR.plugins.add('uploadcare', {
    requires : [ 'iframedialog' ],
    init : function(editor) {
        var me = this;

        editor.addCommand('uploadcareDialog', new CKEDITOR.dialogCommand('uploadcareDialog'));

        editor.ui.addButton('Uploadcare', {
            label : 'Uploadcare',
            command : 'uploadcareDialog',
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
                        src : me.path + 'dialog.php',
                        width : '800',
                        height : '600',
                        onContentLoad : function() {
                            var iframe = document.getElementById( this._.frameId ),
                                iframeWindow = iframe.contentWindow;     
                            iframeWindow.document.getElementById('editor_name').value = editor.name;
                        }
                    } ]
                } ]
            };
        });
    }
});