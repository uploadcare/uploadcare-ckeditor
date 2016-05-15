(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
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
},{"../tools/search-selected-element":8}],2:[function(require,module,exports){
'use scrict'

module.exports = function() {
  this.editor = null;
  this.targetImg = null;
}
},{}],3:[function(require,module,exports){
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
      exec : require('./commands/show-uploadcare-dialog')
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
          var body = getBody();
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
        clearToolbar();
      });

      function onResizeAction(raEvt) {
        clearToolbar();
        var img = targetImg;
        var rect = getPosition(img);
        var selection = editor.getSelection();
        if(selection.fake) {
          selection.fake(img);
        }
        
        var body = getBody();
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
        var body = getBody();
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

},{"./commands/show-uploadcare-dialog":1,"./styles/resize":4,"./tools/clear-toolbar":5,"./tools/find-one":6,"./tools/get-body":7}],4:[function(require,module,exports){

module.exports = 
".tools-container {" + 
"  position: absolute;" +
"  float: left;" +
"  border: 1px solid #ddd;" +
"  border-radius: 4px;" +
"  background: #fff;" +
"}" +

".button {" +
"  border: 0px;" +
"  background: #fff;" +
"  border-radius: 2px;" +
"  margin: 2px;" +
"}" +

".button:hover {" +
"  background-color: #e1edf7;" +
"}" +

".icon {" +
"  width: 22px;" +
"  height: 20px;" +
"}" +

".icon-resize {" +
"  background: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTZweCIgaGVpZ2h0PSIxNnB4IiB2aWV3Qm94PSIwIDAgMTYgMTYiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+DQogICAgPGcgaWQ9IlBhZ2UtMSIgc3Ryb2tlPSJub25lIiBzdHJva2Utd2lkdGg9IjEiIGZpbGw9Im5vbmUiIGZpbGwtcnVsZT0iZXZlbm9kZCI+DQogICAgICAgIDxnIHRyYW5zZm9ybT0idHJhbnNsYXRlKC0xLjAwMDAwMCwgLTEuMDAwMDAwKSI+DQogICAgICAgICAgICA8cGF0aCBkPSJNMTEuNDkxMjIwMywxLjAwMDM5Njk2IEMxMS4yOTA3OTQ5LDEuMDA5Nzk0NDMgMTEuMTM1OTM5MiwxLjE3OTkyMTAxIDExLjE0NTI5NjIsMS4zODAzNDYzMyBDMTEuMTU0NjkzNywxLjU4MDgxMjE1IDExLjMyNDgyMDMsMS43MzU2Njc4NSAxMS41MjUyNDU2LDEuNzI2MjcwMzggTDE1LjcyNzM3MjIsMS43MjYyNzAzOCBMMS43MjU5NTQ0MywxNS43Mjc2ODgxIEwxLjcyNTk1NDQzLDExLjUyNTYwMiBDMS43MzAyODg2MSwxMS4zMjUxMzYyIDEuNTcxMzAxMjcsMTEuMTU5MTgxOCAxLjM3MDg3NTk1LDExLjE1NDg0NzYgQzEuMzU0OTk3NDcsMTEuMTU0NTIzNSAxLjMzOTExODk5LDExLjE1NTIxMjIgMS4zMjMzMjE1MiwxMS4xNTY5NTM5IEMxLjEzNjM0NDMsMTEuMTc3NTMxMSAwLjk5NjAzMDM4LDExLjMzNzQ5MDYgMS4wMDAwODEwMSwxMS41MjU2MDIgTDEuMDAwMDgxMDEsMTYuNjA2Njc1NCBDMS4wMDAwODEwMSwxNi44MDcxNDEzIDEuMTYyNTkyNDEsMTYuOTY5NTcxNiAxLjM2MzAxNzcyLDE2Ljk2OTYxMjIgTDYuNDQ0MTMxNjUsMTYuOTY5NjEyMiBDNi42NDQ1OTc0NywxNi45NzI0ODgxIDYuODA5Mzc3MjIsMTYuODEyMjQ1MSA2LjgxMjIxMjY2LDE2LjYxMTgxOTcgQzYuODE1MDQ4MSwxNi40MTEzNTM5IDYuNjU0ODg2MDgsMTYuMjQ2NTc0MiA2LjQ1NDM3OTc1LDE2LjI0MzczODcgQzYuNDUwOTc3MjIsMTYuMjQzNjk4MiA2LjQ0NzUzNDE4LDE2LjI0MzY5ODIgNi40NDQxMzE2NSwxNi4yNDM3Mzg3IEwyLjIzNjMzNDE4LDE2LjI0MzczODcgTDE2LjI0MzQyMjgsMi4yMzY2NTAxMyBMMTYuMjQzNDIyOCw2LjQ0NDQ0NzU5IEMxNi4yNDA1ODczLDYuNjQ0OTEzNDIgMTYuNDAwNzg5OSw2LjgwOTY5MzE2IDE2LjYwMTIxNTIsNi44MTI1Mjg2MSBDMTYuODAxNjgxLDYuODE1MzY0MDUgMTYuOTY2NDYwOCw2LjY1NTE2MTUyIDE2Ljk2OTI5NjIsNi40NTQ2OTU3IEMxNi45NjkzMzY3LDYuNDUxMjkzMTYgMTYuOTY5MzM2Nyw2LjQ0Nzg1MDEzIDE2Ljk2OTI5NjIsNi40NDQ0NDc1OSBMMTYuOTY5Mjk2MiwxLjM2MzMzMzY3IEMxNi45NjkyNTU3LDEuMTYyOTA4MzUgMTYuODA2ODI1MywxLjAwMDM5Njk2IDE2LjYwNjM1OTUsMS4wMDAzOTY5NiBMMTEuNTI1MjQ1NiwxLjAwMDM5Njk2IEMxMS41MTM5NDQzLDAuOTk5ODcwMzggMTEuNTAyNTYyLDAuOTk5ODcwMzggMTEuNDkxMjIwMywxLjAwMDM5Njk2IiBpZD0iRmlsbC0xIiBmaWxsPSIjMDAwMDAwIj48L3BhdGg+DQogICAgICAgICAgICA8cmVjdCBpZD0iUmVjdGFuZ2xlLTEiIHg9IjAiIHk9IjAiIHdpZHRoPSIxOCIgaGVpZ2h0PSIxOCI+PC9yZWN0Pg0KICAgICAgICA8L2c+DQogICAgPC9nPg0KPC9zdmc+') 100% 100% no-repeat;" +
"  background-position: center;" +
"  background-size: 16px 16px;" +
"}" +

".icon-uploadcare {" +
"  background: url(\"../icons/uploadcare.png\") 100% 100% no-repeat;" +
"  background-position: center;" +
"}" +

".icon-crop {" +
"  background: url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMTZweCIgaGVpZ2h0PSIxNnB4IiB2aWV3Qm94PSIwIDAgMTYgMTYiIHZlcnNpb249IjEuMSIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIiB4bWxuczp4bGluaz0iaHR0cDovL3d3dy53My5vcmcvMTk5OS94bGluayI+DQogICAgPHRpdGxlPlBhZ2UgMTwvdGl0bGU+DQogICAgPGRlc2M+Q3JlYXRlZCB3aXRoIFNrZXRjaC48L2Rlc2M+DQogICAgPGRlZnM+PC9kZWZzPg0KICAgIDxnIGlkPSJQYWdlLTEiIHN0cm9rZT0ibm9uZSIgc3Ryb2tlLXdpZHRoPSIxIiBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPg0KICAgICAgICA8ZyB0cmFuc2Zvcm09InRyYW5zbGF0ZSgtMS4wMDAwMDAsIC0xLjAwMDAwMCkiPg0KICAgICAgICAgICAgPHBhdGggZD0iTTEyLjEyNTAyNzcsMTMuMDM5OTU1NiBMNS40NDY0Mzk2NSwxMy4wMzk5NTU2IEwxMi4xMjUwMjc3LDYuMzk4NDQ2MTcgTDEyLjEyNTAyNzcsMTMuMDM5OTU1NiBaIE0xMS41MTc4ODMzLDUuOTM2NzM2OTYgTDQuODU3MTUyNDcsMTIuNTYwNDg4MyBMNC44NTcxNTI0Nyw1LjkzNjczNjk2IEwxMS41MTc4ODMzLDUuOTM2NzM2OTYgWiBNMTYuODkyODU2OSwxLjYzOTI4OTY4IEMxNy4wMzU3MTQ0LDEuNDk3MjI1MzEgMTcuMDM1NzE0NCwxLjI0ODYxMjY1IDE2Ljg5Mjg1NjksMS4xMDY1NDgyOCBDMTYuNzQ5OTk5NCwwLjk2NDQ4MzkwNyAxNi41MDAwMzg2LDAuOTY0NDgzOTA3IDE2LjM1NzE4MTEsMS4xMDY1NDgyOCBMMTIuODM5MzE1Miw0LjYyMjY0MTUxIEw0Ljg1NzE1MjQ3LDQuNjIyNjQxNTEgTDQuODU3MTUyNDcsMi42MzM3NDAyOSBDNC44NTcxNTI0NywyLjI3ODU3OTM2IDQuNTUzNTgwMjgsMS45NzY2OTI1NiA0LjE5NjM5NjY3LDEuOTc2NjkyNTYgQzMuODM5MjUyOTMsMS45NzY2OTI1NiAzLjUzNTcyMDYsMi4yNzg1NzkzNiAzLjUzNTcyMDYsMi42MzM3NDAyOSBMMy41MzU3MjA2LDQuNjIyNjQxNTEgTDEuNjYwNzE1OTMsNC42MjI2NDE1MSBDMS4zMDM1NzIxOCw0LjYyMjY0MTUxIDEsNC45MjQ1MjgzIDEsNS4yNzk2ODkyMyBDMSw1LjYzNDg1MDE3IDEuMzAzNTcyMTgsNS45MzY3MzY5NiAxLjY2MDcxNTkzLDUuOTM2NzM2OTYgTDMuNTM1NzIwNiw1LjkzNjczNjk2IEwzLjUzNTcyMDYsMTQuMzU0MDUxMSBMMTIuMTI1MDI3NywxNC4zNTQwNTExIEwxMi4xMjUwMjc3LDE2LjM0Mjk1MjMgQzEyLjEyNTAyNzcsMTYuNjk4MTEzMiAxMi40Mjg1NiwxNyAxMi43ODU3MDM4LDE3IEMxMy4xNDI4NDc1LDE3IDEzLjQ0NjQxOTcsMTYuNjk4MTEzMiAxMy40NDY0MTk3LDE2LjM0Mjk1MjMgTDEzLjQ0NjQxOTcsMTQuMzM2MjkzIEwxNS4zMjE0MjQ0LDE0LjMzNjI5MyBDMTUuNjc4NTY4MSwxNC4zMzYyOTMgMTUuOTgyMTgwMiwxNC4wMzQ0MDYyIDE1Ljk4MjE4MDIsMTMuNjc5MjQ1MyBDMTUuOTgyMTgwMiwxMy4zMjQwODQ0IDE1LjY3ODU2ODEsMTMuMDIyMTk3NiAxNS4zMjE0MjQ0LDEzLjAyMjE5NzYgTDEzLjQ0NjQxOTcsMTMuMDIyMTk3NiBMMTMuNDQ2NDE5Nyw1LjA4NDM1MDcyIEwxNi44OTI4NTY5LDEuNjM5Mjg5NjggWiIgaWQ9IkZpbGwtMSIgZmlsbD0iIzAwMDAwMCI+PC9wYXRoPg0KICAgICAgICAgICAgPHJlY3QgaWQ9IlJlY3RhbmdsZS0xIiB4PSIwIiB5PSIwIiB3aWR0aD0iMTgiIGhlaWdodD0iMTgiPjwvcmVjdD4NCiAgICAgICAgPC9nPg0KICAgIDwvZz4NCjwvc3ZnPg==') 100% 100% no-repeat;" +
"  background-position: center;" +
"  background-size: 16px 16px;" +
"}" + 
 
".screen-overlay {" +
"  position: absolute;" +
"  top: 0;" +
"  left: 0;" +
"  min-height: 100%;" +
"  min-width: 100%;" +
"  z-index: 10;" +
"  cursor: default;" +
"}" +

".resize-border {" +
"  position: absolute;" +
"  border: 1px dashed #bbbbbb;" +
"  z-index: 11;" +
"  background-color: rgba(128, 128, 128, 0.15);" +
"  cursor: default;" +
"}" +

".resizer {" +
"  background-color: white;" +
"  border: 1px solid #bbbbbb;" +
"  position: absolute;" +
"  z-index: 12;" +
"}" +

".top-left {" +
"  cursor: nw-resize;" +
"}" +

".top-right {" +
"  cursor: ne-resize;" +
"}" +

".bottom-left {" +
"  cursor: sw-resize;" +
"}" +

".bottom-right {" +
"  cursor: se-resize;" +
"}";

},{}],5:[function(require,module,exports){
'use strict'

var getBody = require('./get-body');
var findOne = require('./find-one');

module.exports = function() {        
  var body = getBody();
  
  if(!body) {
    return;
  }
    
  var tools = body.findOne ? body.findOne('div.tools-container') : findOne.bind(body)('div.tools-container'); 
  
  if(tools) {
    tools.hide();
  }
}
},{"./find-one":6,"./get-body":7}],6:[function(require,module,exports){
module.exports = function( selector ) {
  var removeTmpId = createTmpId( this ),
    found = this.$.querySelector( getContextualizedSelector( this, selector ) );

  removeTmpId();

  return found ? new CKEDITOR.dom.element( found ) : null;
}


function getContextualizedSelector( element, selector ) {
		return '#' + element.$.id + ' ' + selector.split( /,\s*/ ).join( ', #' + element.$.id + ' ' );
	}

function createTmpId( element ) {
		var hadId = true;

		if ( !element.$.id ) {
			element.$.id = 'cke_tmp_' + CKEDITOR.tools.getNextNumber();
			hadId = false;
		}

		return function() {
			if ( !hadId )
				element.removeAttribute( 'id' );
		};
	}
  
},{}],7:[function(require,module,exports){
'use strict'

var editor = require('../globals/editor').editor;

module.exports = function getBody() {
  try {
    var editor = CKEDITOR.currentInstance;
    var editable = editor.editable();
    var doc = editable.getDocument();
    return doc.getBody();
  } catch (ex) {
    return null;      
  }
}
},{"../globals/editor":2}],8:[function(require,module,exports){
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
},{}]},{},[3])
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvY29tbWFuZHMvc2hvdy11cGxvYWRjYXJlLWRpYWxvZy5qcyIsInNyYy9nbG9iYWxzL2VkaXRvci5qcyIsInNyYy9wbHVnaW4uanMiLCJzcmMvc3R5bGVzL3Jlc2l6ZS5qcyIsInNyYy90b29scy9jbGVhci10b29sYmFyLmpzIiwic3JjL3Rvb2xzL2ZpbmQtb25lLmpzIiwic3JjL3Rvb2xzL2dldC1ib2R5LmpzIiwic3JjL3Rvb2xzL3NlYXJjaC1zZWxlY3RlZC1lbGVtZW50LmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUN0RUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ0xBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTs7QUM1UkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25GQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDakJBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQzNCQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBIiwiZmlsZSI6ImdlbmVyYXRlZC5qcyIsInNvdXJjZVJvb3QiOiIiLCJzb3VyY2VzQ29udGVudCI6WyIoZnVuY3Rpb24gZSh0LG4scil7ZnVuY3Rpb24gcyhvLHUpe2lmKCFuW29dKXtpZighdFtvXSl7dmFyIGE9dHlwZW9mIHJlcXVpcmU9PVwiZnVuY3Rpb25cIiYmcmVxdWlyZTtpZighdSYmYSlyZXR1cm4gYShvLCEwKTtpZihpKXJldHVybiBpKG8sITApO3ZhciBmPW5ldyBFcnJvcihcIkNhbm5vdCBmaW5kIG1vZHVsZSAnXCIrbytcIidcIik7dGhyb3cgZi5jb2RlPVwiTU9EVUxFX05PVF9GT1VORFwiLGZ9dmFyIGw9bltvXT17ZXhwb3J0czp7fX07dFtvXVswXS5jYWxsKGwuZXhwb3J0cyxmdW5jdGlvbihlKXt2YXIgbj10W29dWzFdW2VdO3JldHVybiBzKG4/bjplKX0sbCxsLmV4cG9ydHMsZSx0LG4scil9cmV0dXJuIG5bb10uZXhwb3J0c312YXIgaT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2Zvcih2YXIgbz0wO288ci5sZW5ndGg7bysrKXMocltvXSk7cmV0dXJuIHN9KSIsIid1c2Ugc3RyaWN0J1xuXG52YXIgc2VhcmNoU2VsZWN0ZWRFbGVtZW50ID0gcmVxdWlyZSAoJy4uL3Rvb2xzL3NlYXJjaC1zZWxlY3RlZC1lbGVtZW50Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0eXBlb2YgdXBsb2FkY2FyZSA9PSAndW5kZWZpbmVkJykge1xuICAgIHJldHVybjsgLy8gbm90IGxvYWRlZCB5ZXRcbiAgfVxuICB2YXIgZWRpdG9yID0gQ0tFRElUT1IuY3VycmVudEluc3RhbmNlO1xuICBcbiAgdmFyIGNvbmZpZyA9IGVkaXRvci5jb25maWcudXBsb2FkY2FyZSB8fCB7fTtcbiAgXG4gIC8vIEFwcGx5IGRlZmF1bHQgcHJvcGVydGllcy5cbiAgaWYgKCAhICgnY3JvcCcgaW4gY29uZmlnKSkge1xuICAgIGNvbmZpZy5jcm9wID0gJyc7XG4gIH1cblxuICB1cGxvYWRjYXJlLnBsdWdpbihmdW5jdGlvbih1Yykge1xuICAgIHZhciBzZXR0aW5ncywgZWxlbWVudCwgZmlsZTtcblxuICAgIGlmIChlbGVtZW50ID0gc2VhcmNoU2VsZWN0ZWRFbGVtZW50KGVkaXRvciwgJ2ltZycpKSB7XG4gICAgICBmaWxlID0gZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ3NyYycpO1xuICAgIH0gZWxzZSBpZiAoZWxlbWVudCA9IHNlYXJjaFNlbGVjdGVkRWxlbWVudChlZGl0b3IsICdhJykpIHtcbiAgICAgIGZpbGUgPSBlbGVtZW50LmdldEF0dHJpYnV0ZSgnaHJlZicpO1xuICAgIH1cblxuICAgIGlmIChmaWxlICYmIHVjLnV0aWxzLnNwbGl0Q2RuVXJsKGZpbGUpKSB7XG4gICAgICBzZXR0aW5ncyA9IHVjLnNldHRpbmdzLmJ1aWxkKFxuICAgICAgICB1Yy5qUXVlcnkuZXh0ZW5kKHt9LCBjb25maWcsIHttdWx0aXBsZTogZmFsc2V9KVxuICAgICAgKTtcbiAgICAgIGZpbGUgPSB1cGxvYWRjYXJlLmZpbGVGcm9tKCd1cGxvYWRlZCcsIGZpbGUsIHNldHRpbmdzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2V0dGluZ3MgPSB1Yy5zZXR0aW5ncy5idWlsZChjb25maWcpXG4gICAgICBmaWxlID0gbnVsbDtcbiAgICB9XG5cbiAgICB2YXIgZGlhbG9nID0gdXBsb2FkY2FyZS5vcGVuRGlhbG9nKGZpbGUsIHNldHRpbmdzKS5kb25lKGZ1bmN0aW9uKHNlbGVjdGVkKSB7XG4gICAgICB2YXIgZmlsZXMgPSBzZXR0aW5ncy5tdWx0aXBsZSA/IHNlbGVjdGVkLmZpbGVzKCkgOiBbc2VsZWN0ZWRdO1xuICAgICAgdWMualF1ZXJ5LndoZW4uYXBwbHkobnVsbCwgZmlsZXMpLmRvbmUoZnVuY3Rpb24oKSB7XG4gICAgICAgIHVjLmpRdWVyeS5lYWNoKGFyZ3VtZW50cywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIGltYWdlVXJsID0gdGhpcy5jZG5Vcmw7XG4gICAgICAgICAgaWYgKHRoaXMuaXNJbWFnZSAmJiAhIHRoaXMuY2RuVXJsTW9kaWZpZXJzKSB7XG4gICAgICAgICAgICBpbWFnZVVybCArPSAnLS9wcmV2aWV3Lyc7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChlbGVtZW50KSB7XG4gICAgICAgICAgICB2YXIgd2lkZ2V0O1xuICAgICAgICAgICAgaWYgKGVkaXRvci53aWRnZXRzICYmICh3aWRnZXQgPSBlZGl0b3Iud2lkZ2V0cy5zZWxlY3RlZFswXSlcbiAgICAgICAgICAgICAgICAmJiB3aWRnZXQuZWxlbWVudCA9PT0gZWxlbWVudFxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIHdpZGdldC5zZXREYXRhKCdzcmMnLCBpbWFnZVVybCkuc2V0RGF0YSgnaGVpZ2h0JywgbnVsbClcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZWxlbWVudC5nZXROYW1lKCkgPT0gJ2ltZycpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC5kYXRhKCdja2Utc2F2ZWQtc3JjJywgJycpO1xuICAgICAgICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSgnc3JjJywgaW1hZ2VVcmwpO1xuICAgICAgICAgICAgICBlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZSgnd2lkdGgnKTtcbiAgICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoJ2hlaWdodCcpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC5kYXRhKCdja2Utc2F2ZWQtaHJlZicsICcnKTtcbiAgICAgICAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2hyZWYnLCB0aGlzLmNkblVybCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmlzSW1hZ2UpIHtcbiAgICAgICAgICAgICAgZWRpdG9yLmluc2VydEh0bWwoJzxpbWcgc3JjPVwiJyArIGltYWdlVXJsICsgJ1wiIGFsdD1cIlwiLz48YnI+JywgJ3VuZmlsdGVyZWRfaHRtbCcpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgZWRpdG9yLmluc2VydEh0bWwoJzxhIGhyZWY9XCInICsgdGhpcy5jZG5VcmwgKyAnXCI+JyArIHRoaXMubmFtZSArICc8L2E+ICcsICd1bmZpbHRlcmVkX2h0bWwnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xufSIsIid1c2Ugc2NyaWN0J1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uKCkge1xuICB0aGlzLmVkaXRvciA9IG51bGw7XG4gIHRoaXMudGFyZ2V0SW1nID0gbnVsbDtcbn0iLCIvLyBVcGxvYWRjYXJlIENLZWRpdG9yIHBsdWdpblxuLy8gVmVyc2lvbjogMi4xLjVcbid1c2Ugc3RyaWN0JztcblxudmFyIGZpbmRPbmUgPSByZXF1aXJlKCcuL3Rvb2xzL2ZpbmQtb25lJyk7XG5cbkNLRURJVE9SLnBsdWdpbnMuYWRkKCd1cGxvYWRjYXJlJywge1xuICBoaWRwaTogdHJ1ZSxcbiAgaWNvbnM6ICd1cGxvYWRjYXJlJyxcbiAgaW5pdCA6IGZ1bmN0aW9uKGVkaXRvcikge1xuICAgIHZhciB0YXJnZXRJbWcgPSBudWxsO1xuICAgIHZhciBnZXRCb2R5ID0gcmVxdWlyZSgnLi90b29scy9nZXQtYm9keScpO1xuICAgIFxuICAgIENLRURJVE9SLmFkZENzcyhyZXF1aXJlKCcuL3N0eWxlcy9yZXNpemUnKSk7XG4gICAgdmFyIGNvbmZpZyA9IGVkaXRvci5jb25maWcudXBsb2FkY2FyZSB8fCB7fTtcblxuICAgIC8vIENoZWNrIGlmIFVwbG9hZGNhcmUgaXMgYWxyZWFkeSBsb2FkZWQgYW5kIGxvYWQgaXQgaWYgbm90LlxuICAgIGlmICh0eXBlb2YgdXBsb2FkY2FyZSA9PT0gJ3VuZGVmaW5lZCcpIHtcbiAgICAgICAgdmFyIHZlcnNpb24gPSBjb25maWcud2lkZ2V0VmVyc2lvbiB8fCAnMi40LjAnO1xuICAgICAgICB2YXIgd2lkZ2V0X3VybCA9ICdodHRwczovL3VjYXJlY2RuLmNvbS93aWRnZXQvJyArIHZlcnNpb24gK1xuICAgICAgICAgICAgICAgICAnL3VwbG9hZGNhcmUvdXBsb2FkY2FyZS5mdWxsLm1pbi5qcydcbiAgICAgICAgQ0tFRElUT1Iuc2NyaXB0TG9hZGVyLmxvYWQod2lkZ2V0X3VybCk7XG4gICAgfVxuXG4gICAgZWRpdG9yLmFkZENvbW1hbmQoJ3Nob3dVcGxvYWRjYXJlRGlhbG9nJywge1xuICAgICAgYWxsb3dlZENvbnRlbnQ6ICdpbWdbIXNyYyxhbHRde3dpZHRoLGhlaWdodH07YVshaHJlZl0nLFxuICAgICAgcmVxdWlyZWRDb250ZW50OiAnaW1nW3NyY107YVtocmVmXScsXG4gICAgICBleGVjIDogcmVxdWlyZSgnLi9jb21tYW5kcy9zaG93LXVwbG9hZGNhcmUtZGlhbG9nJylcbiAgICB9KTtcblxuICAgIGVkaXRvci51aS5hZGRCdXR0b24gJiYgZWRpdG9yLnVpLmFkZEJ1dHRvbignVXBsb2FkY2FyZScsIHtcbiAgICAgIGxhYmVsIDogJ1VwbG9hZGNhcmUnLFxuICAgICAgdG9vbGJhciA6ICdpbnNlcnQnLFxuICAgICAgY29tbWFuZCA6ICdzaG93VXBsb2FkY2FyZURpYWxvZydcbiAgICB9KTtcbiAgICBcbiAgICBlZGl0b3Iub24oJ2NvbnRlbnREb20nLCBmdW5jdGlvbigpIHtcbiAgICAgIFxuICAgICAgdmFyIGVkaXRhYmxlID0gZWRpdG9yLmVkaXRhYmxlKCk7XG4gICAgICB2YXIgdG9vbHMgPSBudWxsO1xuICAgICAgdmFyIGlzUmVzaXppbmcgPSBmYWxzZTtcbiAgICAgIHZhciByZXNpemVJbWcgPSBudWxsO1xuICAgICAgdmFyIHJlc2l6ZUVsZW1lbnRzID0gbnVsbDtcbiAgICAgIHZhciByZXNpemVyU2l6ZSA9IDEyO1xuICAgICAgXG4gICAgICB2YXIgY2xlYXJUb29sYmFyID0gcmVxdWlyZSgnLi90b29scy9jbGVhci10b29sYmFyJyk7XG4gICAgICBcbiAgICAgIGVkaXRhYmxlLmF0dGFjaExpc3RlbmVyKCBlZGl0YWJsZS5pc0lubGluZSgpID8gZWRpdGFibGUgOiBlZGl0b3IuZG9jdW1lbnQsICdtb3VzZW1vdmUnLCBmdW5jdGlvbiggZXZ0ICkge1xuICAgICAgICBldnQgPSBldnQuZGF0YTtcbiAgICAgICAgdmFyIHRhcmdldCA9IGV2dC5nZXRUYXJnZXQoKTtcbiAgICAgICAgdmFyIHNyYyA9IHRhcmdldC4kLmdldEF0dHJpYnV0ZSgnc3JjJyk7XG4gICAgICAgICBcbiAgICAgICAgZnVuY3Rpb24gb25Nb3VzZU91dChldnQpIHtcbiAgICAgICAgICB2YXIgdGFyZ2V0ID0gZXZ0LmRhdGEuZ2V0VGFyZ2V0KCk7XG4gICAgICAgICAgdmFyIHJlY3QgPSB0YXJnZXQuJC5nZXRCb3VuZGluZ0NsaWVudFJlY3QoKTtcbiAgICAgICAgICBcbiAgICAgICAgICBpZigoZXZ0LmRhdGEuJC5jbGllbnRYIDwgcmVjdC5sZWZ0IHx8IGV2dC5kYXRhLiQuY2xpZW50WCA+IHJlY3QucmlnaHQpIHx8IFxuICAgICAgICAgIChldnQuZGF0YS4kLmNsaWVudFkgPCByZWN0LnRvcCB8fCBldnQuZGF0YS4kLmNsaWVudFkgPiByZWN0LmJvdHRvbSkpIHtcbiAgICAgICAgICAgIHRvb2xzLmhpZGUoKTsgIFxuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYodGFyZ2V0LmlzKCdpbWcnKSAmJiAoc3JjLmluZGV4T2YoJ3d3dy51Y2FyZWNkbi5jb20nKSA+IC0xKSAmJiAhaXNSZXNpemluZykge1xuICAgICAgICAgIHZhciBib2R5ID0gZ2V0Qm9keSgpO1xuICAgICAgICAgIGlmKCFib2R5KSB7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIHRhcmdldEltZyA9IHRhcmdldDtcbiAgICAgICAgICBpZighdG9vbHMpIHtcbiAgICAgICAgICAgIHRvb2xzID0gYm9keS5maW5kT25lID8gYm9keS5maW5kT25lKCdkaXYudG9vbHMtY29udGFpbmVyJykgOiBmaW5kT25lLmJpbmQoYm9keSkoJ2Rpdi50b29scy1jb250YWluZXInKTtcbiAgICAgICAgICAgIGlmKCF0b29scykge1xuICAgICAgICAgICAgICB0b29scyA9IENLRURJVE9SLmRvbS5lbGVtZW50LmNyZWF0ZUZyb21IdG1sKCc8ZGl2IGNsYXNzPVwidG9vbHMtY29udGFpbmVyXCI+PGJ1dHRvbiBjbGFzcz1cImJ1dHRvbiByZXNpemUgaWNvbiBpY29uLXJlc2l6ZVwiPjwvYnV0dG9uPjxidXR0b24gY2xhc3M9XCJidXR0b24gZGlhbG9nIGljb24gaWNvbi1jcm9wXCI+PC9idXR0b24+PC9kaXY+Jyk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgICB0b29scy5zZXRTdHlsZSgnemluZGV4JywgJzEwMCcpO1xuICAgICAgICAgICAgYm9keS5hcHBlbmQodG9vbHMpOyBcbiAgICAgICAgICAgIHRvb2xzLm9uKCdtb3VzZW91dCcsIG9uTW91c2VPdXQpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB0b29scy5yZW1vdmVBbGxMaXN0ZW5lcnMoKTtcbiAgICAgICAgICAgIHZhciByZXNpemVCdG4gPSB0b29scy5maW5kT25lID8gdG9vbHMuZmluZE9uZSgnYnV0dG9uLnJlc2l6ZScpIDogZmluZE9uZS5iaW5kKHRvb2xzKSgnYnV0dG9uLnJlc2l6ZScpO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICByZXNpemVCdG4ub24oJ2NsaWNrJywgb25SZXNpemVBY3Rpb24pO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB2YXIgZGlhbG9nQnRuID0gdG9vbHMuZmluZE9uZSA/IHRvb2xzLmZpbmRPbmUoJ2J1dHRvbi5kaWFsb2cnKSA6IGZpbmRPbmUuYmluZCh0b29scykoJ2J1dHRvbi5kaWFsb2cnKTtcbiAgICAgICAgICAgIGRpYWxvZ0J0bi5vbignY2xpY2snLCBmdW5jdGlvbigpe1xuICAgICAgICAgICAgICBlZGl0b3IuZ2V0U2VsZWN0aW9uKCkuc2VsZWN0RWxlbWVudCggdGFyZ2V0SW1nICk7XG4gICAgICAgICAgICAgIGVkaXRvci5leGVjQ29tbWFuZCgnc2hvd1VwbG9hZGNhcmVEaWFsb2cnKTtcbiAgICAgICAgICAgIH0pO1xuICAgICAgICAgICAgXG4gICAgICAgICAgICB0YXJnZXQucmVtb3ZlQWxsTGlzdGVuZXJzKCk7XG4gICAgICAgICAgICB0YXJnZXQub24oJ21vdXNlb3V0Jywgb25Nb3VzZU91dCk7ICAgICAgICAgIFxuICAgICAgICAgICAgXG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdG9vbHMuc2hvdygpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBcbiAgICAgICAgICB2YXIgcmVjdCA9IGdldFBvc2l0aW9uKHRhcmdldCk7XG4gICAgICAgICAgdG9vbHMuc2V0U3R5bGUoJ3RvcCcsIHJlY3QudG9wICsgJ3B4Jyk7XG4gICAgICAgICAgdG9vbHMuc2V0U3R5bGUoJ2xlZnQnLCByZWN0LmxlZnQgKyAncHgnKTtcbiAgICAgICAgICBcbiAgICAgICAgICBcbiAgICAgICAgfSBlbHNlIGlmICh0b29scyAmJiB0YXJnZXQuJCAhPT0gdG9vbHMuJCAmJiAhaXNSZXNpemluZykge1xuICAgICAgICAgIGlmKHRhcmdldC5nZXRQYXJlbnQoKSAmJiAhdGFyZ2V0LmdldFBhcmVudCgpLmhhc0NsYXNzKCd0b29scy1jb250YWluZXInKSkge1xuICAgICAgICAgICAgdG9vbHMuaGlkZSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYoaXNSZXNpemluZykge1xuICAgICAgICAgIHZhciBuYXRpdmVFdnQgPSBldnQuJDtcblxuICAgICAgICAgIHZhciBtb3ZlRGlmZlggPSBuYXRpdmVFdnQuc2NyZWVuWCAtIHJlc2l6ZUVsZW1lbnRzLnN0YXJ0WDtcbiAgICAgICAgICB2YXIgbW92ZURpZmZZID0gcmVzaXplRWxlbWVudHMuc3RhcnRZIC0gbmF0aXZlRXZ0LnNjcmVlblk7XG4gICAgICAgICAgdmFyIG1vdmVSYXRpbyA9IE1hdGguYWJzKG1vdmVEaWZmWCAvIG1vdmVEaWZmWSk7XG4gICAgICAgICAgXG4gICAgICAgICAgaWYgKCBtb3ZlRGlmZlggPD0gMCApIHtcblx0XHRcdFx0XHRcdGlmICggbW92ZURpZmZZIDw9IDAgKSB7XG5cdFx0XHRcdFx0XHRcdGFkanVzdFRvWChtb3ZlRGlmZlgpO1xuICAgICAgICAgICAgfSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0aWYgKCBtb3ZlUmF0aW8gPj0gcmVzaXplRWxlbWVudHMucmF0aW8gKSB7XG5cdFx0XHRcdFx0XHRcdFx0YWRqdXN0VG9YKG1vdmVEaWZmWCk7XG4gICAgICAgICAgICAgIH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdFx0YWRqdXN0VG9ZKG1vdmVEaWZmWSk7IFxuICAgICAgICAgICAgICB9XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdGlmICggbW92ZURpZmZZIDw9IDAgKSB7XG5cdFx0XHRcdFx0XHRcdGlmICggbW92ZVJhdGlvID49IHJlc2l6ZUVsZW1lbnRzLnJhdGlvICkge1xuXHRcdFx0XHRcdFx0XHRcdGFkanVzdFRvWShtb3ZlRGlmZlkpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRcdGFkanVzdFRvWChtb3ZlRGlmZlgpO1xuICAgICAgICAgICAgICB9XG5cdFx0XHRcdFx0XHR9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRhZGp1c3RUb1kobW92ZURpZmZZKTtcblx0XHRcdFx0XHRcdH1cblx0XHRcdFx0XHR9XG4gICAgICAgICAgICBpZihyZXNpemVFbGVtZW50cy5uZXdXaWR0aCA+PSAxNSAmJiByZXNpemVFbGVtZW50cy5uZXdIZWlnaHQgPj0gMTUpIHtcbiAgICAgICAgICAgICAgcmVzaXplSW1nLnNldEF0dHJpYnV0ZXMoIHt3aWR0aDogcmVzaXplRWxlbWVudHMubmV3V2lkdGgsIGhlaWdodDogcmVzaXplRWxlbWVudHMubmV3SGVpZ2h0fSApO1xuICAgICAgICAgICAgICByZXNpemVFbGVtZW50cy5yZXNpemVCb3JkZXIuc2V0U3R5bGUoJ3dpZHRoJywgcmVzaXplRWxlbWVudHMubmV3V2lkdGggKyAncHgnKTtcbiAgICAgICAgICAgICAgcmVzaXplRWxlbWVudHMucmVzaXplQm9yZGVyLnNldFN0eWxlKCdoZWlnaHQnLCByZXNpemVFbGVtZW50cy5uZXdIZWlnaHQgKyAncHgnKTtcbiAgICAgICAgICAgICAgXG4gICAgICAgICAgICAgIHJlc2l6ZUVsZW1lbnRzLmJvdHRvbVJpZ2h0UmVzaXplci5zZXRTdHlsZSgnbGVmdCcsIHJlc2l6ZUVsZW1lbnRzLmltZ1JlY3QubGVmdCArIHJlc2l6ZUVsZW1lbnRzLm5ld1dpZHRoIC0gcmVzaXplclNpemUvMiArICdweCcpO1xuICAgICAgICAgICAgICByZXNpemVFbGVtZW50cy5ib3R0b21SaWdodFJlc2l6ZXIuc2V0U3R5bGUoJ3RvcCcsIHJlc2l6ZUVsZW1lbnRzLmltZ1JlY3QudG9wICsgcmVzaXplRWxlbWVudHMubmV3SGVpZ2h0IC0gcmVzaXplclNpemUvMiArICdweCcpO1xuICAgICAgICAgICAgfVxuXHRcdFx0XHRcdH1cbiAgICAgIH0pO1xuICAgICAgXG4gICAgICBlZGl0b3Iub24oJ2RyYWdzdGFydCcsIGZ1bmN0aW9uKGV2dCkge1xuICAgICAgICBjbGVhclRvb2xiYXIoKTtcbiAgICAgIH0pO1xuXG4gICAgICBmdW5jdGlvbiBvblJlc2l6ZUFjdGlvbihyYUV2dCkge1xuICAgICAgICBjbGVhclRvb2xiYXIoKTtcbiAgICAgICAgdmFyIGltZyA9IHRhcmdldEltZztcbiAgICAgICAgdmFyIHJlY3QgPSBnZXRQb3NpdGlvbihpbWcpO1xuICAgICAgICB2YXIgc2VsZWN0aW9uID0gZWRpdG9yLmdldFNlbGVjdGlvbigpO1xuICAgICAgICBpZihzZWxlY3Rpb24uZmFrZSkge1xuICAgICAgICAgIHNlbGVjdGlvbi5mYWtlKGltZyk7XG4gICAgICAgIH1cbiAgICAgICAgXG4gICAgICAgIHZhciBib2R5ID0gZ2V0Qm9keSgpO1xuICAgICAgICBpZighYm9keSkge1xuICAgICAgICAgIHJldHVybjtcbiAgICAgICAgfVxuICAgICAgICB2YXIgc2NyZWVuT3ZlcmxheSA9IENLRURJVE9SLmRvbS5lbGVtZW50LmNyZWF0ZUZyb21IdG1sKCc8ZGl2IGNsYXNzPVwic2NyZWVuLW92ZXJsYXlcIj48ZGl2PicpO1xuICAgICAgICB2YXIgcmVzaXplQm9yZGVyID0gQ0tFRElUT1IuZG9tLmVsZW1lbnQuY3JlYXRlRnJvbUh0bWwoJzxkaXYgY2xhc3M9XCJyZXNpemUtYm9yZGVyXCI+PGRpdj4nKTtcbiAgICAgICAgc2NyZWVuT3ZlcmxheS5hcHBlbmQocmVzaXplQm9yZGVyKTtcbiAgICAgICAgYm9keS5hcHBlbmQoc2NyZWVuT3ZlcmxheSk7XG4gICAgICAgIFxuICAgICAgICB2YXIgYm9keVJlY3QgPSBnZXRQb3NpdGlvbihlZGl0YWJsZS5nZXREb2N1bWVudCgpLmdldERvY3VtZW50RWxlbWVudCgpKTtcbiAgICAgICAgXG4gICAgICAgIHNjcmVlbk92ZXJsYXkuc2V0U3R5bGUoJ3dpZHRoJywgYm9keVJlY3Qud2lkdGggKyAncHgnKTtcbiAgICAgICAgc2NyZWVuT3ZlcmxheS5zZXRTdHlsZSgnaGVpZ2h0JywgYm9keVJlY3QuaGVpZ2h0ICsgJ3B4Jyk7XG4gICAgICAgIFxuICAgICAgICByZXNpemVCb3JkZXIuc2V0U3R5bGUoJ3RvcCcsIHJlY3QudG9wICsgJ3B4Jyk7XG4gICAgICAgIHJlc2l6ZUJvcmRlci5zZXRTdHlsZSgnbGVmdCcsIHJlY3QubGVmdCArICdweCcpO1xuICAgICAgICByZXNpemVCb3JkZXIuc2V0U3R5bGUoJ3dpZHRoJywgcmVjdC53aWR0aCArICdweCcpO1xuICAgICAgICByZXNpemVCb3JkZXIuc2V0U3R5bGUoJ2hlaWdodCcsIHJlY3QuaGVpZ2h0ICsgJ3B4Jyk7XG4gICAgICAgIFxuICAgICAgICByZXNpemVFbGVtZW50cyA9IHtcbiAgICAgICAgICByZXNpemVCb3JkZXI6IHJlc2l6ZUJvcmRlcixcbiAgICAgICAgICBpbWdSZWN0OiByZWN0LFxuICAgICAgICAgIG5ld1dpZHRoOiByZWN0LndpZHRoLFxuICAgICAgICAgIG5ld0hlaWdodDogcmVjdC5oZWlnaHRcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgY3JlYXRlUmVzaXplcnMocmVjdCwgc2NyZWVuT3ZlcmxheSk7XG4gICAgICAgIHJlc2l6ZUltZyA9IGltZztcbiAgICAgICAgXG4gICAgICAgIHNjcmVlbk92ZXJsYXkub24oJ2NsaWNrJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICBlZGl0b3IucmVzZXRVbmRvKCk7XG4gICAgICAgICAgaWYoaXNSZXNpemluZykge1xuICAgICAgICAgICAgaXNSZXNpemluZyA9IGZhbHNlO1xuICAgICAgICAgICAgdXBkYXRlSW1nU3JjKCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIFxuICAgICAgICAgIHNjcmVlbk92ZXJsYXkucmVtb3ZlKCk7XG4gICAgICAgICAgcmVzaXplSW1nID0gbnVsbDtcbiAgICAgICAgICByZXNpemVFbGVtZW50cyA9IG51bGw7XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgcmVzaXplQm9yZGVyLm9uKCdjbGljaycsIGZ1bmN0aW9uKGNsaWNrRXZ0KSB7XG4gICAgICAgICAgY2xpY2tFdnQuZGF0YS4kLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgIGNsaWNrRXZ0LmRhdGEuJC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIHJlc2l6ZUVsZW1lbnRzLmJvdHRvbVJpZ2h0UmVzaXplci5vbignbW91c2Vkb3duJywgZnVuY3Rpb24obWRFdnQpIHtcbiAgICAgICAgICBcbiAgICAgICAgICBtZEV2dC5kYXRhLiQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgbWRFdnQuZGF0YS4kLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgaXNSZXNpemluZyA9IHRydWU7XG4gICAgICAgICAgcmVzaXplRWxlbWVudHMuc3RhcnRYID0gbWRFdnQuZGF0YS4kLnNjcmVlblg7XG5cdFx0XHRcdCAgcmVzaXplRWxlbWVudHMuc3RhcnRZID0gbWRFdnQuZGF0YS4kLnNjcmVlblk7XG4gICAgICAgICAgcmVzaXplRWxlbWVudHMuc3RhcnRXaWR0aCA9IHJlc2l6ZUltZy4kLmNsaWVudFdpZHRoO1xuICAgICAgICAgIHJlc2l6ZUVsZW1lbnRzLnN0YXJ0SGVpZ2h0ID0gcmVzaXplSW1nLiQuY2xpZW50SGVpZ2h0O1xuICAgICAgICAgIHJlc2l6ZUVsZW1lbnRzLnJhdGlvID0gcmVzaXplRWxlbWVudHMuc3RhcnRXaWR0aCAvIHJlc2l6ZUVsZW1lbnRzLnN0YXJ0SGVpZ2h0O1xuICAgICAgICAgIFxuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIHJlc2l6ZUVsZW1lbnRzLmJvdHRvbVJpZ2h0UmVzaXplci5vbignbW91c2V1cCcsIGZ1bmN0aW9uKGV2dCkge1xuICAgICAgICAgIGVkaXRvci5yZXNldFVuZG8oKTtcbiAgICAgICAgICBpc1Jlc2l6aW5nID0gZmFsc2U7XG4gICAgICAgICAgdXBkYXRlSW1nU3JjKCk7XG4gICAgICAgIH0pO1xuICAgICAgfVxuICAgICAgXG4gICAgICBmdW5jdGlvbiBjcmVhdGVSZXNpemVycyhyZWN0LCBvdmVybGF5KSB7XG4gICAgICAgIFxuICAgICAgICB2YXIgYm90dG9tUmlnaHRSZXNpemVyID0gQ0tFRElUT1IuZG9tLmVsZW1lbnQuY3JlYXRlRnJvbUh0bWwoJzxkaXYgY2xhc3M9XCJyZXNpemVyIGJvdHRvbS1yaWdodFwiPjxkaXY+Jyk7XG4gICAgICAgIHNldFVwUmVzaXplcihib3R0b21SaWdodFJlc2l6ZXIsIHJlY3QuYm90dG9tLCByZWN0LnJpZ2h0LCByZXNpemVyU2l6ZSk7XG4gICAgICAgIG92ZXJsYXkuYXBwZW5kKGJvdHRvbVJpZ2h0UmVzaXplcik7XG4gICAgICAgIHJlc2l6ZUVsZW1lbnRzLmJvdHRvbVJpZ2h0UmVzaXplciA9IGJvdHRvbVJpZ2h0UmVzaXplcjtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgZnVuY3Rpb24gc2V0VXBSZXNpemVyKGVsZW1lbnQsIHRvcCwgbGVmdCwgc2l6ZSkge1xuICAgICAgICBlbGVtZW50LnNldFN0eWxlKCd0b3AnLCB0b3AgLSBzaXplLzIgKyAncHgnKTtcbiAgICAgICAgZWxlbWVudC5zZXRTdHlsZSgnbGVmdCcsIGxlZnQgLSBzaXplLzIgKyAncHgnKTtcbiAgICAgICAgZWxlbWVudC5zZXRTdHlsZSgnd2lkdGgnLCBzaXplICsgJ3B4Jyk7XG4gICAgICAgIGVsZW1lbnQuc2V0U3R5bGUoJ2hlaWdodCcsIHNpemUgKyAncHgnKTtcbiAgICAgICAgZWxlbWVudC5vbignY2xpY2snLCBmdW5jdGlvbihldnQpIHtcbiAgICAgICAgICBldnQuZGF0YS4kLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgIGV2dC5kYXRhLiQucHJldmVudERlZmF1bHQoKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIGZ1bmN0aW9uIGdldFBvc2l0aW9uKGVsZW1lbnQpIHtcbiAgICAgICAgdmFyIGJvZHkgPSBnZXRCb2R5KCk7XG4gICAgICAgIGlmKCFib2R5KSB7XG4gICAgICAgICAgcmV0dXJuO1xuICAgICAgICB9XG4gICAgICAgIHZhciByZXNSZWN0ID0gZWxlbWVudC4kLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICBcbiAgICAgICAgcmV0dXJuIHtcbiAgICAgICAgICB0b3A6IHJlc1JlY3QudG9wICsgYm9keS4kLnNjcm9sbFRvcCxcbiAgICAgICAgICBib3R0b206IHJlc1JlY3QuYm90dG9tICsgYm9keS4kLnNjcm9sbFRvcCxcbiAgICAgICAgICBsZWZ0OiByZXNSZWN0LmxlZnQgKyBib2R5LiQuc2Nyb2xsTGVmdCxcbiAgICAgICAgICByaWdodDogcmVzUmVjdC5yaWdodCArIGJvZHkuJC5zY3JvbGxMZWZ0LFxuICAgICAgICAgIHdpZHRoOiByZXNSZWN0LndpZHRoLFxuICAgICAgICAgIGhlaWdodDogcmVzUmVjdC5oZWlnaHRcbiAgICAgICAgfTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgZnVuY3Rpb24gdXBkYXRlSW1nU3JjKCkge1xuICAgICAgICB2YXIgaW5pdGlhbFVybCA9IHJlc2l6ZUltZy5nZXRBdHRyaWJ1dGUoJ3NyYycpO1xuICAgICAgICB2YXIgbmV3VXJsID0gaW5pdGlhbFVybC5zdWJzdHIoMCwgaW5pdGlhbFVybC5pbmRleE9mKCcvcHJldmlldycpKSArICcvcHJldmlldy8nICsgcmVzaXplRWxlbWVudHMubmV3V2lkdGggKyAneCcgKyByZXNpemVFbGVtZW50cy5uZXdIZWlnaHQgKyAnLyc7XG4gICAgICAgIHJlc2l6ZUltZy5zZXRBdHRyaWJ1dGVzKHtcbiAgICAgICAgICAgICAgJ2RhdGEtY2tlLXNhdmVkLXNyYyc6IG5ld1VybCxcbiAgICAgICAgICAgICAgJ3NyYyc6IG5ld1VybFxuICAgICAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIGZ1bmN0aW9uIGFkanVzdFRvWChtb3ZlRGlmZlgpIHtcblx0XHRcdFx0cmVzaXplRWxlbWVudHMubmV3V2lkdGggPSByZXNpemVFbGVtZW50cy5zdGFydFdpZHRoICsgbW92ZURpZmZYO1xuXHRcdFx0XHRyZXNpemVFbGVtZW50cy5uZXdIZWlnaHQgPSBNYXRoLnJvdW5kKCByZXNpemVFbGVtZW50cy5uZXdXaWR0aCAvIHJlc2l6ZUVsZW1lbnRzLnJhdGlvICk7XG5cdFx0XHR9XG5cblx0XHRcdC8vIENhbGN1bGF0ZSBoZWlnaHQgZmlyc3QsIGFuZCB0aGVuIGFkanVzdCB3aWR0aCwgcHJlc2VydmluZyByYXRpby5cblx0XHRcdGZ1bmN0aW9uIGFkanVzdFRvWShtb3ZlRGlmZlkpIHtcblx0XHRcdFx0cmVzaXplRWxlbWVudHMubmV3SGVpZ2h0ID0gcmVzaXplRWxlbWVudHMuc3RhcnRIZWlnaHQgLSBtb3ZlRGlmZlk7XG5cdFx0XHRcdHJlc2l6ZUVsZW1lbnRzLm5ld1dpZHRoID0gTWF0aC5yb3VuZCggcmVzaXplRWxlbWVudHMubmV3SGVpZ2h0ICogcmVzaXplRWxlbWVudHMucmF0aW8gKTtcblx0XHRcdH1cbiAgICB9KTsgICAgXG4gIH1cbn0pO1xuIiwiXG5tb2R1bGUuZXhwb3J0cyA9IFxuXCIudG9vbHMtY29udGFpbmVyIHtcIiArIFxuXCIgIHBvc2l0aW9uOiBhYnNvbHV0ZTtcIiArXG5cIiAgZmxvYXQ6IGxlZnQ7XCIgK1xuXCIgIGJvcmRlcjogMXB4IHNvbGlkICNkZGQ7XCIgK1xuXCIgIGJvcmRlci1yYWRpdXM6IDRweDtcIiArXG5cIiAgYmFja2dyb3VuZDogI2ZmZjtcIiArXG5cIn1cIiArXG5cblwiLmJ1dHRvbiB7XCIgK1xuXCIgIGJvcmRlcjogMHB4O1wiICtcblwiICBiYWNrZ3JvdW5kOiAjZmZmO1wiICtcblwiICBib3JkZXItcmFkaXVzOiAycHg7XCIgK1xuXCIgIG1hcmdpbjogMnB4O1wiICtcblwifVwiICtcblxuXCIuYnV0dG9uOmhvdmVyIHtcIiArXG5cIiAgYmFja2dyb3VuZC1jb2xvcjogI2UxZWRmNztcIiArXG5cIn1cIiArXG5cblwiLmljb24ge1wiICtcblwiICB3aWR0aDogMjJweDtcIiArXG5cIiAgaGVpZ2h0OiAyMHB4O1wiICtcblwifVwiICtcblxuXCIuaWNvbi1yZXNpemUge1wiICtcblwiICBiYWNrZ3JvdW5kOiB1cmwoJ2RhdGE6aW1hZ2Uvc3ZnK3htbDtiYXNlNjQsUEhOMlp5QjNhV1IwYUQwaU1UWndlQ0lnYUdWcFoyaDBQU0l4Tm5CNElpQjJhV1YzUW05NFBTSXdJREFnTVRZZ01UWWlJSFpsY25OcGIyNDlJakV1TVNJZ2VHMXNibk05SW1oMGRIQTZMeTkzZDNjdWR6TXViM0puTHpJd01EQXZjM1puSWlCNGJXeHVjenA0YkdsdWF6MGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNVGs1T1M5NGJHbHVheUkrRFFvZ0lDQWdQR2NnYVdROUlsQmhaMlV0TVNJZ2MzUnliMnRsUFNKdWIyNWxJaUJ6ZEhKdmEyVXRkMmxrZEdnOUlqRWlJR1pwYkd3OUltNXZibVVpSUdacGJHd3RjblZzWlQwaVpYWmxibTlrWkNJK0RRb2dJQ0FnSUNBZ0lEeG5JSFJ5WVc1elptOXliVDBpZEhKaGJuTnNZWFJsS0MweExqQXdNREF3TUN3Z0xURXVNREF3TURBd0tTSStEUW9nSUNBZ0lDQWdJQ0FnSUNBOGNHRjBhQ0JrUFNKTk1URXVORGt4TWpJd015d3hMakF3TURNNU5qazJJRU14TVM0eU9UQTNPVFE1TERFdU1EQTVOemswTkRNZ01URXVNVE0xT1RNNU1pd3hMakUzT1RreU1UQXhJREV4TGpFME5USTVOaklzTVM0ek9EQXpORFl6TXlCRE1URXVNVFUwTmprek55d3hMalU0TURneE1qRTFJREV4TGpNeU5EZ3lNRE1zTVM0M016VTJOamM0TlNBeE1TNDFNalV5TkRVMkxERXVOekkyTWpjd016Z2dUREUxTGpjeU56TTNNaklzTVM0M01qWXlOekF6T0NCTU1TNDNNalU1TlRRME15d3hOUzQzTWpjMk9EZ3hJRXd4TGpjeU5UazFORFF6TERFeExqVXlOVFl3TWlCRE1TNDNNekF5T0RnMk1Td3hNUzR6TWpVeE16WXlJREV1TlRjeE16QXhNamNzTVRFdU1UVTVNVGd4T0NBeExqTTNNRGczTlRrMUxERXhMakUxTkRnME56WWdRekV1TXpVME9UazNORGNzTVRFdU1UVTBOVEl6TlNBeExqTXpPVEV4T0RrNUxERXhMakUxTlRJeE1qSWdNUzR6TWpNek1qRTFNaXd4TVM0eE5UWTVOVE01SUVNeExqRXpOak0wTkRNc01URXVNVGMzTlRNeE1TQXdMams1TmpBek1ETTRMREV4TGpNek56UTVNRFlnTVM0d01EQXdPREV3TVN3eE1TNDFNalUyTURJZ1RERXVNREF3TURneE1ERXNNVFl1TmpBMk5qYzFOQ0JETVM0d01EQXdPREV3TVN3eE5pNDRNRGN4TkRFeklERXVNVFl5TlRreU5ERXNNVFl1T1RZNU5UY3hOaUF4TGpNMk16QXhOemN5TERFMkxqazJPVFl4TWpJZ1REWXVORFEwTVRNeE5qVXNNVFl1T1RZNU5qRXlNaUJETmk0Mk5EUTFPVGMwTnl3eE5pNDVOekkwT0RneElEWXVPREE1TXpjM01qSXNNVFl1T0RFeU1qUTFNU0EyTGpneE1qSXhNalkyTERFMkxqWXhNVGd4T1RjZ1F6WXVPREUxTURRNE1Td3hOaTQwTVRFek5UTTVJRFl1TmpVME9EZzJNRGdzTVRZdU1qUTJOVGMwTWlBMkxqUTFORE0zT1RjMUxERTJMakkwTXpjek9EY2dRell1TkRVd09UYzNNaklzTVRZdU1qUXpOams0TWlBMkxqUTBOelV6TkRFNExERTJMakkwTXpZNU9ESWdOaTQwTkRReE16RTJOU3d4Tmk0eU5ETTNNemczSUV3eUxqSXpOak16TkRFNExERTJMakkwTXpjek9EY2dUREUyTGpJME16UXlNamdzTWk0eU16WTJOVEF4TXlCTU1UWXVNalF6TkRJeU9DdzJMalEwTkRRME56VTVJRU14Tmk0eU5EQTFPRGN6TERZdU5qUTBPVEV6TkRJZ01UWXVOREF3TnpnNU9TdzJMamd3T1RZNU16RTJJREUyTGpZd01USXhOVElzTmk0NE1USTFNamcyTVNCRE1UWXVPREF4TmpneExEWXVPREUxTXpZME1EVWdNVFl1T1RZMk5EWXdPQ3cyTGpZMU5URTJNVFV5SURFMkxqazJPVEk1TmpJc05pNDBOVFEyT1RVM0lFTXhOaTQ1Tmprek16WTNMRFl1TkRVeE1qa3pNVFlnTVRZdU9UWTVNek0yTnl3MkxqUTBOemcxTURFeklERTJMamsyT1RJNU5qSXNOaTQwTkRRME5EYzFPU0JNTVRZdU9UWTVNamsyTWl3eExqTTJNek16TXpZM0lFTXhOaTQ1TmpreU5UVTNMREV1TVRZeU9UQTRNelVnTVRZdU9EQTJPREkxTXl3eExqQXdNRE01TmprMklERTJMall3TmpNMU9UVXNNUzR3TURBek9UWTVOaUJNTVRFdU5USTFNalExTml3eExqQXdNRE01TmprMklFTXhNUzQxTVRNNU5EUXpMREF1T1RrNU9EY3dNemdnTVRFdU5UQXlOVFl5TERBdU9UazVPRGN3TXpnZ01URXVORGt4TWpJd015d3hMakF3TURNNU5qazJJaUJwWkQwaVJtbHNiQzB4SWlCbWFXeHNQU0lqTURBd01EQXdJajQ4TDNCaGRHZytEUW9nSUNBZ0lDQWdJQ0FnSUNBOGNtVmpkQ0JwWkQwaVVtVmpkR0Z1WjJ4bExURWlJSGc5SWpBaUlIazlJakFpSUhkcFpIUm9QU0l4T0NJZ2FHVnBaMmgwUFNJeE9DSStQQzl5WldOMFBnMEtJQ0FnSUNBZ0lDQThMMmMrRFFvZ0lDQWdQQzluUGcwS1BDOXpkbWMrJykgMTAwJSAxMDAlIG5vLXJlcGVhdDtcIiArXG5cIiAgYmFja2dyb3VuZC1wb3NpdGlvbjogY2VudGVyO1wiICtcblwiICBiYWNrZ3JvdW5kLXNpemU6IDE2cHggMTZweDtcIiArXG5cIn1cIiArXG5cblwiLmljb24tdXBsb2FkY2FyZSB7XCIgK1xuXCIgIGJhY2tncm91bmQ6IHVybChcXFwiLi4vaWNvbnMvdXBsb2FkY2FyZS5wbmdcXFwiKSAxMDAlIDEwMCUgbm8tcmVwZWF0O1wiICtcblwiICBiYWNrZ3JvdW5kLXBvc2l0aW9uOiBjZW50ZXI7XCIgK1xuXCJ9XCIgK1xuXG5cIi5pY29uLWNyb3Age1wiICtcblwiICBiYWNrZ3JvdW5kOiB1cmwoJ2RhdGE6aW1hZ2Uvc3ZnK3htbDtiYXNlNjQsUEhOMlp5QjNhV1IwYUQwaU1UWndlQ0lnYUdWcFoyaDBQU0l4Tm5CNElpQjJhV1YzUW05NFBTSXdJREFnTVRZZ01UWWlJSFpsY25OcGIyNDlJakV1TVNJZ2VHMXNibk05SW1oMGRIQTZMeTkzZDNjdWR6TXViM0puTHpJd01EQXZjM1puSWlCNGJXeHVjenA0YkdsdWF6MGlhSFIwY0RvdkwzZDNkeTUzTXk1dmNtY3ZNVGs1T1M5NGJHbHVheUkrRFFvZ0lDQWdQSFJwZEd4bFBsQmhaMlVnTVR3dmRHbDBiR1UrRFFvZ0lDQWdQR1JsYzJNK1EzSmxZWFJsWkNCM2FYUm9JRk5yWlhSamFDNDhMMlJsYzJNK0RRb2dJQ0FnUEdSbFpuTStQQzlrWldaelBnMEtJQ0FnSUR4bklHbGtQU0pRWVdkbExURWlJSE4wY205clpUMGlibTl1WlNJZ2MzUnliMnRsTFhkcFpIUm9QU0l4SWlCbWFXeHNQU0p1YjI1bElpQm1hV3hzTFhKMWJHVTlJbVYyWlc1dlpHUWlQZzBLSUNBZ0lDQWdJQ0E4WnlCMGNtRnVjMlp2Y20wOUluUnlZVzV6YkdGMFpTZ3RNUzR3TURBd01EQXNJQzB4TGpBd01EQXdNQ2tpUGcwS0lDQWdJQ0FnSUNBZ0lDQWdQSEJoZEdnZ1pEMGlUVEV5TGpFeU5UQXlOemNzTVRNdU1ETTVPVFUxTmlCTU5TNDBORFkwTXprMk5Td3hNeTR3TXprNU5UVTJJRXd4TWk0eE1qVXdNamMzTERZdU16azRORFEyTVRjZ1RERXlMakV5TlRBeU56Y3NNVE11TURNNU9UVTFOaUJhSUUweE1TNDFNVGM0T0RNekxEVXVPVE0yTnpNMk9UWWdURFF1T0RVM01UVXlORGNzTVRJdU5UWXdORGc0TXlCTU5DNDROVGN4TlRJME55dzFMamt6Tmpjek5qazJJRXd4TVM0MU1UYzRPRE16TERVdU9UTTJOek0yT1RZZ1dpQk5NVFl1T0RreU9EVTJPU3d4TGpZek9USTRPVFk0SUVNeE55NHdNelUzTVRRMExERXVORGszTWpJMU16RWdNVGN1TURNMU56RTBOQ3d4TGpJME9EWXhNalkxSURFMkxqZzVNamcxTmprc01TNHhNRFkxTkRneU9DQkRNVFl1TnpRNU9UazVOQ3d3TGprMk5EUTRNemt3TnlBeE5pNDFNREF3TXpnMkxEQXVPVFkwTkRnek9UQTNJREUyTGpNMU56RTRNVEVzTVM0eE1EWTFORGd5T0NCTU1USXVPRE01TXpFMU1pdzBMall5TWpZME1UVXhJRXcwTGpnMU56RTFNalEzTERRdU5qSXlOalF4TlRFZ1REUXVPRFUzTVRVeU5EY3NNaTQyTXpNM05EQXlPU0JETkM0NE5UY3hOVEkwTnl3eUxqSTNPRFUzT1RNMklEUXVOVFV6TlRnd01qZ3NNUzQ1TnpZMk9USTFOaUEwTGpFNU5qTTVOalkzTERFdU9UYzJOamt5TlRZZ1F6TXVPRE01TWpVeU9UTXNNUzQ1TnpZMk9USTFOaUF6TGpVek5UY3lNRFlzTWk0eU56ZzFOemt6TmlBekxqVXpOVGN5TURZc01pNDJNek0zTkRBeU9TQk1NeTQxTXpVM01qQTJMRFF1TmpJeU5qUXhOVEVnVERFdU5qWXdOekUxT1RNc05DNDJNakkyTkRFMU1TQkRNUzR6TURNMU56SXhPQ3cwTGpZeU1qWTBNVFV4SURFc05DNDVNalExTWpneklERXNOUzR5TnprMk9Ea3lNeUJETVN3MUxqWXpORGcxTURFM0lERXVNekF6TlRjeU1UZ3NOUzQ1TXpZM016WTVOaUF4TGpZMk1EY3hOVGt6TERVdU9UTTJOek0yT1RZZ1RETXVOVE0xTnpJd05pdzFMamt6Tmpjek5qazJJRXd6TGpVek5UY3lNRFlzTVRRdU16VTBNRFV4TVNCTU1USXVNVEkxTURJM055d3hOQzR6TlRRd05URXhJRXd4TWk0eE1qVXdNamMzTERFMkxqTTBNamsxTWpNZ1F6RXlMakV5TlRBeU56Y3NNVFl1TmprNE1URXpNaUF4TWk0ME1qZzFOaXd4TnlBeE1pNDNPRFUzTURNNExERTNJRU14TXk0eE5ESTRORGMxTERFM0lERXpMalEwTmpReE9UY3NNVFl1TmprNE1URXpNaUF4TXk0ME5EWTBNVGszTERFMkxqTTBNamsxTWpNZ1RERXpMalEwTmpReE9UY3NNVFF1TXpNMk1qa3pJRXd4TlM0ek1qRTBNalEwTERFMExqTXpOakk1TXlCRE1UVXVOamM0TlRZNE1Td3hOQzR6TXpZeU9UTWdNVFV1T1RneU1UZ3dNaXd4TkM0d016UTBNRFl5SURFMUxqazRNakU0TURJc01UTXVOamM1TWpRMU15QkRNVFV1T1RneU1UZ3dNaXd4TXk0ek1qUXdPRFEwSURFMUxqWTNPRFUyT0RFc01UTXVNREl5TVRrM05pQXhOUzR6TWpFME1qUTBMREV6TGpBeU1qRTVOellnVERFekxqUTBOalF4T1Rjc01UTXVNREl5TVRrM05pQk1NVE11TkRRMk5ERTVOeXcxTGpBNE5ETTFNRGN5SUV3eE5pNDRPVEk0TlRZNUxERXVOak01TWpnNU5qZ2dXaUlnYVdROUlrWnBiR3d0TVNJZ1ptbHNiRDBpSXpBd01EQXdNQ0krUEM5d1lYUm9QZzBLSUNBZ0lDQWdJQ0FnSUNBZ1BISmxZM1FnYVdROUlsSmxZM1JoYm1kc1pTMHhJaUI0UFNJd0lpQjVQU0l3SWlCM2FXUjBhRDBpTVRnaUlHaGxhV2RvZEQwaU1UZ2lQand2Y21WamRENE5DaUFnSUNBZ0lDQWdQQzluUGcwS0lDQWdJRHd2Wno0TkNqd3ZjM1puUGc9PScpIDEwMCUgMTAwJSBuby1yZXBlYXQ7XCIgK1xuXCIgIGJhY2tncm91bmQtcG9zaXRpb246IGNlbnRlcjtcIiArXG5cIiAgYmFja2dyb3VuZC1zaXplOiAxNnB4IDE2cHg7XCIgK1xuXCJ9XCIgKyBcbiBcblwiLnNjcmVlbi1vdmVybGF5IHtcIiArXG5cIiAgcG9zaXRpb246IGFic29sdXRlO1wiICtcblwiICB0b3A6IDA7XCIgK1xuXCIgIGxlZnQ6IDA7XCIgK1xuXCIgIG1pbi1oZWlnaHQ6IDEwMCU7XCIgK1xuXCIgIG1pbi13aWR0aDogMTAwJTtcIiArXG5cIiAgei1pbmRleDogMTA7XCIgK1xuXCIgIGN1cnNvcjogZGVmYXVsdDtcIiArXG5cIn1cIiArXG5cblwiLnJlc2l6ZS1ib3JkZXIge1wiICtcblwiICBwb3NpdGlvbjogYWJzb2x1dGU7XCIgK1xuXCIgIGJvcmRlcjogMXB4IGRhc2hlZCAjYmJiYmJiO1wiICtcblwiICB6LWluZGV4OiAxMTtcIiArXG5cIiAgYmFja2dyb3VuZC1jb2xvcjogcmdiYSgxMjgsIDEyOCwgMTI4LCAwLjE1KTtcIiArXG5cIiAgY3Vyc29yOiBkZWZhdWx0O1wiICtcblwifVwiICtcblxuXCIucmVzaXplciB7XCIgK1xuXCIgIGJhY2tncm91bmQtY29sb3I6IHdoaXRlO1wiICtcblwiICBib3JkZXI6IDFweCBzb2xpZCAjYmJiYmJiO1wiICtcblwiICBwb3NpdGlvbjogYWJzb2x1dGU7XCIgK1xuXCIgIHotaW5kZXg6IDEyO1wiICtcblwifVwiICtcblxuXCIudG9wLWxlZnQge1wiICtcblwiICBjdXJzb3I6IG53LXJlc2l6ZTtcIiArXG5cIn1cIiArXG5cblwiLnRvcC1yaWdodCB7XCIgK1xuXCIgIGN1cnNvcjogbmUtcmVzaXplO1wiICtcblwifVwiICtcblxuXCIuYm90dG9tLWxlZnQge1wiICtcblwiICBjdXJzb3I6IHN3LXJlc2l6ZTtcIiArXG5cIn1cIiArXG5cblwiLmJvdHRvbS1yaWdodCB7XCIgK1xuXCIgIGN1cnNvcjogc2UtcmVzaXplO1wiICtcblwifVwiO1xuIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBnZXRCb2R5ID0gcmVxdWlyZSgnLi9nZXQtYm9keScpO1xudmFyIGZpbmRPbmUgPSByZXF1aXJlKCcuL2ZpbmQtb25lJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7ICAgICAgICBcbiAgdmFyIGJvZHkgPSBnZXRCb2R5KCk7XG4gIFxuICBpZighYm9keSkge1xuICAgIHJldHVybjtcbiAgfVxuICAgIFxuICB2YXIgdG9vbHMgPSBib2R5LmZpbmRPbmUgPyBib2R5LmZpbmRPbmUoJ2Rpdi50b29scy1jb250YWluZXInKSA6IGZpbmRPbmUuYmluZChib2R5KSgnZGl2LnRvb2xzLWNvbnRhaW5lcicpOyBcbiAgXG4gIGlmKHRvb2xzKSB7XG4gICAgdG9vbHMuaGlkZSgpO1xuICB9XG59IiwibW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiggc2VsZWN0b3IgKSB7XG4gIHZhciByZW1vdmVUbXBJZCA9IGNyZWF0ZVRtcElkKCB0aGlzICksXG4gICAgZm91bmQgPSB0aGlzLiQucXVlcnlTZWxlY3RvciggZ2V0Q29udGV4dHVhbGl6ZWRTZWxlY3RvciggdGhpcywgc2VsZWN0b3IgKSApO1xuXG4gIHJlbW92ZVRtcElkKCk7XG5cbiAgcmV0dXJuIGZvdW5kID8gbmV3IENLRURJVE9SLmRvbS5lbGVtZW50KCBmb3VuZCApIDogbnVsbDtcbn1cblxuXG5mdW5jdGlvbiBnZXRDb250ZXh0dWFsaXplZFNlbGVjdG9yKCBlbGVtZW50LCBzZWxlY3RvciApIHtcblx0XHRyZXR1cm4gJyMnICsgZWxlbWVudC4kLmlkICsgJyAnICsgc2VsZWN0b3Iuc3BsaXQoIC8sXFxzKi8gKS5qb2luKCAnLCAjJyArIGVsZW1lbnQuJC5pZCArICcgJyApO1xuXHR9XG5cbmZ1bmN0aW9uIGNyZWF0ZVRtcElkKCBlbGVtZW50ICkge1xuXHRcdHZhciBoYWRJZCA9IHRydWU7XG5cblx0XHRpZiAoICFlbGVtZW50LiQuaWQgKSB7XG5cdFx0XHRlbGVtZW50LiQuaWQgPSAnY2tlX3RtcF8nICsgQ0tFRElUT1IudG9vbHMuZ2V0TmV4dE51bWJlcigpO1xuXHRcdFx0aGFkSWQgPSBmYWxzZTtcblx0XHR9XG5cblx0XHRyZXR1cm4gZnVuY3Rpb24oKSB7XG5cdFx0XHRpZiAoICFoYWRJZCApXG5cdFx0XHRcdGVsZW1lbnQucmVtb3ZlQXR0cmlidXRlKCAnaWQnICk7XG5cdFx0fTtcblx0fVxuICAiLCIndXNlIHN0cmljdCdcblxudmFyIGVkaXRvciA9IHJlcXVpcmUoJy4uL2dsb2JhbHMvZWRpdG9yJykuZWRpdG9yO1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIGdldEJvZHkoKSB7XG4gIHRyeSB7XG4gICAgdmFyIGVkaXRvciA9IENLRURJVE9SLmN1cnJlbnRJbnN0YW5jZTtcbiAgICB2YXIgZWRpdGFibGUgPSBlZGl0b3IuZWRpdGFibGUoKTtcbiAgICB2YXIgZG9jID0gZWRpdGFibGUuZ2V0RG9jdW1lbnQoKTtcbiAgICByZXR1cm4gZG9jLmdldEJvZHkoKTtcbiAgfSBjYXRjaCAoZXgpIHtcbiAgICByZXR1cm4gbnVsbDsgICAgICBcbiAgfVxufSIsIid1c2Ugc3RyaWN0J1xuXG5tb2R1bGUuZXhwb3J0cyA9IGZ1bmN0aW9uIChlZGl0b3IsIG5lZWRsZSkge1xuICB2YXIgc2VsID0gZWRpdG9yLmdldFNlbGVjdGlvbigpO1xuICB2YXIgZWxlbWVudCA9IHNlbC5nZXRTZWxlY3RlZEVsZW1lbnQoKTtcbiAgaWYgKGVsZW1lbnQgJiYgZWxlbWVudC5pcyhuZWVkbGUpKSB7XG4gICAgcmV0dXJuIGVsZW1lbnQ7XG4gIH1cblxuICB2YXIgd2lkZ2V0O1xuICBpZiAoZWRpdG9yLndpZGdldHMgJiYgKHdpZGdldCA9IGVkaXRvci53aWRnZXRzLnNlbGVjdGVkWzBdKSkge1xuICAgIGlmICh3aWRnZXQuZWxlbWVudC5pcyhuZWVkbGUpKSB7XG4gICAgICByZXR1cm4gd2lkZ2V0LmVsZW1lbnQ7XG4gICAgfVxuICB9XG5cbiAgdmFyIHJhbmdlID0gc2VsLmdldFJhbmdlcygpWzBdO1xuICBpZiAocmFuZ2UpIHtcbiAgICByYW5nZS5zaHJpbmsoQ0tFRElUT1IuU0hSSU5LX1RFWFQpO1xuICAgIHJldHVybiBlZGl0b3IuZWxlbWVudFBhdGgocmFuZ2UuZ2V0Q29tbW9uQW5jZXN0b3IoKSkuY29udGFpbnMobmVlZGxlLCAxKTtcbiAgfVxufSJdfQ==
