// Uploadcare CKeditor plugin
// Version: 2.1.5
'use strict';

var findOne = require('./tools/find-one');

CKEDITOR.plugins.add('uploadcare', {
  hidpi: true,
  icons: 'uploadcare',
  init : function(editor) {
    var targetImg = null;
    var getBody = require('./tools/get-body');
    
    CKEDITOR.addCss(require('./styles/resize'));
    var config = editor.config.uploadcare || {};

    // Check if Uploadcare is already loaded and load it if not.
    if (typeof uploadcare === 'undefined') {
        var version = config.widgetVersion || '2.4.0';
        var widget_url = 'https://ucarecdn.com/widget/' + version +
                 '/uploadcare/uploadcare.full.min.js'
        CKEDITOR.scriptLoader.load(widget_url);
    }
    

    editor.addCommand('showUploadcareDialog', {
      allowedContent: 'img[!src,alt]{width,height};a[!href]',
      requiredContent: 'img[src];a[href]',
      exec : require('./commands/show-uploadcare-dialog').bind(editor)
    });

    editor.ui.addButton && editor.ui.addButton('Uploadcare', {
      label : 'Uploadcare',
      toolbar : 'insert',
      command : 'showUploadcareDialog'
    });
    
    editor.on('contentDom', function() {
      
      var editable = editor.editable();
      var tools = null;
      var isResizing = false;
      var resizeImg = null;
      var resizeElements = null;
      var resizerSize = 12;
      
      var clearToolbar = require('./tools/clear-toolbar');
      
      editable.attachListener( editable.isInline() ? editable : editor.document, 'mousemove', function( evt ) {
        evt = evt.data;
        var target = evt.getTarget();
        var src = target.$.getAttribute('src');
         
        function onMouseOut(evt) {
          var target = evt.data.getTarget();
          var rect = target.$.getBoundingClientRect();
          
          if((evt.data.$.clientX < rect.left || evt.data.$.clientX > rect.right) || 
          (evt.data.$.clientY < rect.top || evt.data.$.clientY > rect.bottom)) {
            tools.hide();  
          }
        }
        
        if(target.is('img') && (src.indexOf('www.ucarecdn.com') > -1) && !isResizing) {
          var body = getBody(editor);
          if(!body) {
            return;
          }
          targetImg = target;
          if(!tools) {
            tools = body.findOne ? body.findOne('div.tools-container') : findOne.bind(body)('div.tools-container');
            if(!tools) {
              tools = CKEDITOR.dom.element.createFromHtml('<div class="tools-container"><button class="button resize icon icon-resize"></button><button class="button dialog icon icon-crop"></button></div>');
            }
            tools.setStyle('zindex', '100');
            body.append(tools); 
            tools.on('mouseout', onMouseOut);
            
            tools.removeAllListeners();
            var resizeBtn = tools.findOne ? tools.findOne('button.resize') : findOne.bind(tools)('button.resize');
            
            resizeBtn.on('click', onResizeAction);
            
            var dialogBtn = tools.findOne ? tools.findOne('button.dialog') : findOne.bind(tools)('button.dialog');
            dialogBtn.on('click', function(){
              editor.getSelection().selectElement( targetImg );
              editor.execCommand('showUploadcareDialog');
            });
            
            target.removeAllListeners();
            target.on('mouseout', onMouseOut);          
            
          }
          else {
            tools.show();
          }
          
          var rect = getPosition(target);
          tools.setStyle('top', rect.top + 'px');
          tools.setStyle('left', rect.left + 'px');
          
          
        } else if (tools && target.$ !== tools.$ && !isResizing) {
          if(target.getParent() && !target.getParent().hasClass('tools-container')) {
            tools.hide();
          }
        }
        
        if(isResizing) {
          var nativeEvt = evt.$;

          var moveDiffX = nativeEvt.screenX - resizeElements.startX;
          var moveDiffY = resizeElements.startY - nativeEvt.screenY;
          var moveRatio = Math.abs(moveDiffX / moveDiffY);
          
          if ( moveDiffX <= 0 ) {
						if ( moveDiffY <= 0 ) {
							adjustToX(moveDiffX);
            } else {
							if ( moveRatio >= resizeElements.ratio ) {
								adjustToX(moveDiffX);
              } else {
								adjustToY(moveDiffY); 
              }
						}
					} else {
						if ( moveDiffY <= 0 ) {
							if ( moveRatio >= resizeElements.ratio ) {
								adjustToY(moveDiffY);
              } else {
								adjustToX(moveDiffX);
              }
						} else {
							adjustToY(moveDiffY);
						}
					}
            if(resizeElements.newWidth >= 15 && resizeElements.newHeight >= 15) {
              resizeImg.setAttributes( {width: resizeElements.newWidth, height: resizeElements.newHeight} );
              resizeElements.resizeBorder.setStyle('width', resizeElements.newWidth + 'px');
              resizeElements.resizeBorder.setStyle('height', resizeElements.newHeight + 'px');
              
              resizeElements.bottomRightResizer.setStyle('left', resizeElements.imgRect.left + resizeElements.newWidth - resizerSize/2 + 'px');
              resizeElements.bottomRightResizer.setStyle('top', resizeElements.imgRect.top + resizeElements.newHeight - resizerSize/2 + 'px');
            }
					}
      });
      
      editor.on('dragstart', function(evt) {
        clearToolbar(editor);
      });

      function onResizeAction(raEvt) {
        clearToolbar(editor);
        var img = targetImg;
        var rect = getPosition(img);
        var selection = editor.getSelection();
        if(selection.fake) {
          selection.fake(img);
        }
        
        var body = getBody(editor);
        if(!body) {
          return;
        }
        var screenOverlay = CKEDITOR.dom.element.createFromHtml('<div class="screen-overlay"><div>');
        var resizeBorder = CKEDITOR.dom.element.createFromHtml('<div class="resize-border"><div>');
        screenOverlay.append(resizeBorder);
        body.append(screenOverlay);
        
        var bodyRect = getPosition(editable.getDocument().getDocumentElement());
        
        screenOverlay.setStyle('width', bodyRect.width + 'px');
        screenOverlay.setStyle('height', bodyRect.height + 'px');
        
        resizeBorder.setStyle('top', rect.top + 'px');
        resizeBorder.setStyle('left', rect.left + 'px');
        resizeBorder.setStyle('width', rect.width + 'px');
        resizeBorder.setStyle('height', rect.height + 'px');
        
        resizeElements = {
          resizeBorder: resizeBorder,
          imgRect: rect,
          newWidth: rect.width,
          newHeight: rect.height
        }
        
        createResizers(rect, screenOverlay);
        resizeImg = img;
        
        screenOverlay.on('click', function(){
          editor.resetUndo();
          if(isResizing) {
            isResizing = false;
            updateImgSrc();
            return;
          }
          
          screenOverlay.remove();
          resizeImg = null;
          resizeElements = null;
        });
        
        resizeBorder.on('click', function(clickEvt) {
          clickEvt.data.$.stopPropagation();
          clickEvt.data.$.preventDefault();
        });
        
        resizeElements.bottomRightResizer.on('mousedown', function(mdEvt) {
          
          mdEvt.data.$.stopPropagation();
          mdEvt.data.$.preventDefault();
          isResizing = true;
          resizeElements.startX = mdEvt.data.$.screenX;
				  resizeElements.startY = mdEvt.data.$.screenY;
          resizeElements.startWidth = resizeImg.$.clientWidth;
          resizeElements.startHeight = resizeImg.$.clientHeight;
          resizeElements.ratio = resizeElements.startWidth / resizeElements.startHeight;
          
        });
        
        resizeElements.bottomRightResizer.on('mouseup', function(evt) {
          editor.resetUndo();
          isResizing = false;
          updateImgSrc();
        });
      }
      
      function createResizers(rect, overlay) {
        
        var bottomRightResizer = CKEDITOR.dom.element.createFromHtml('<div class="resizer bottom-right"><div>');
        setUpResizer(bottomRightResizer, rect.bottom, rect.right, resizerSize);
        overlay.append(bottomRightResizer);
        resizeElements.bottomRightResizer = bottomRightResizer;
      }
      
      function setUpResizer(element, top, left, size) {
        element.setStyle('top', top - size/2 + 'px');
        element.setStyle('left', left - size/2 + 'px');
        element.setStyle('width', size + 'px');
        element.setStyle('height', size + 'px');
        element.on('click', function(evt) {
          evt.data.$.stopPropagation();
          evt.data.$.preventDefault();
        });
      }
      
      function getPosition(element) {
        var body = getBody(editor);
        if(!body) {
          return;
        }
        var resRect = element.$.getBoundingClientRect();
        
        return {
          top: resRect.top + body.$.scrollTop,
          bottom: resRect.bottom + body.$.scrollTop,
          left: resRect.left + body.$.scrollLeft,
          right: resRect.right + body.$.scrollLeft,
          width: resRect.width,
          height: resRect.height
        };
      }
      
      function updateImgSrc() {
        var initialUrl = resizeImg.getAttribute('src');
        var newUrl = initialUrl.substr(0, initialUrl.indexOf('/preview')) + '/preview/' + resizeElements.newWidth + 'x' + resizeElements.newHeight + '/';
        resizeImg.setAttributes({
              'data-cke-saved-src': newUrl,
              'src': newUrl
            });
      }
      
      function adjustToX(moveDiffX) {
				resizeElements.newWidth = resizeElements.startWidth + moveDiffX;
				resizeElements.newHeight = Math.round( resizeElements.newWidth / resizeElements.ratio );
			}

			// Calculate height first, and then adjust width, preserving ratio.
			function adjustToY(moveDiffY) {
				resizeElements.newHeight = resizeElements.startHeight - moveDiffY;
				resizeElements.newWidth = Math.round( resizeElements.newHeight * resizeElements.ratio );
			}
    });    
  }
});
