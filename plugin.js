(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
'use strict'

var searchSelectedElement = require ('../tools/search-selected-element');
var editInst = require('../globals/editor');

module.exports = function() {
  if (typeof uploadcare == 'undefined') {
    return; // not loaded yet
  }
  var editor = editInst.editor;
  
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
},{"../globals/editor":2,"../tools/search-selected-element":6}],2:[function(require,module,exports){
'use scrict'

module.exports = {
  editor:null
}
},{}],3:[function(require,module,exports){
// Uploadcare CKeditor plugin
// Version: 2.1.1
'use strict';

var editInst = require('./globals/editor');

CKEDITOR.plugins.add('uploadcare', {
  hidpi: true,
  icons: 'uploadcare',
  init : function(editor) {    
    editInst.editor = editor;
    var getBody = require('./tools/get-body');
    
    editor.addContentsCss( this.path + 'styles/plugin.css' );
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
      
      var clearTools = require('./tools/clear-tools');
      
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
          if(!tools) {
            tools = body.findOne('div.tools-container');
            if(!tools) {
              tools = CKEDITOR.dom.element.createFromHtml('<div class="tools-container"><button class="button resize icon icon-resize"></button><button class="button dialog icon icon-uploadcare"></button></div>');
            }
            tools.setStyle('zindex', '100');
            body.append(tools); 
            tools.on('mouseout', onMouseOut);
          }
          else {
            tools.show();
          }
          
          var rect = getPosition(target);
          tools.setStyle('top', rect.top + 'px');
          tools.setStyle('left', rect.left + 'px');
          
          tools.removeAllListeners();
          var resizeBtn = tools.findOne('button.resize');
          resizeBtn.removeAllListeners();
          resizeBtn.on('click', onResizeAction.bind(target));
          
          var dialogBtn = tools.findOne('button.dialog');
          dialogBtn.removeAllListeners();
          dialogBtn.on('click', function(){
            editor.getSelection().selectElement( target );
            editor.execCommand('showUploadcareDialog');
          });
          
          target.removeAllListeners();
          target.on('mouseout', onMouseOut);          
          
        } else if (tools && target.$ !== tools.$ && !isResizing) {
          if(target.getParent() && !target.getParent().hasClass('tools-container')) {
            tools.hide();
          }
        }
        
        if(isResizing) {
          console.log('Resizing!!!!');
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
        clearTools();
      });

      function onResizeAction(raEvt) {
        clearTools();
        var img = this;
        var rect = getPosition(img);
        editor.getSelection().fake(img);
        
        var body = getBody();
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
          
          console.log('mouse Down');
          console.log(mdEvt);
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
          console.log('Mouse Up');
          console.log(evt);
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

},{"./commands/show-uploadcare-dialog":1,"./globals/editor":2,"./tools/clear-tools":4,"./tools/get-body":5}],4:[function(require,module,exports){
'use strict'

var getBody = require('./get-body');

module.exports = function() {        
  var body = getBody();
  var tools = body.findOne('div.tools-container'); 
  
  if(tools) {
    tools.hide();
  } else {
    console.log('tools not found');
  }
}
},{"./get-body":5}],5:[function(require,module,exports){
'use strict'

var editor = require('../globals/editor').editor;

module.exports = function getBody() {
  var editable = editor.editable();
  return editable.getDocument().getDocumentElement().findOne('body');
}
},{"../globals/editor":2}],6:[function(require,module,exports){
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
//# sourceMappingURL=data:application/json;charset=utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIm5vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzcmMvY29tbWFuZHMvc2hvdy11cGxvYWRjYXJlLWRpYWxvZy5qcyIsInNyYy9nbG9iYWxzL2VkaXRvci5qcyIsInNyYy9wbHVnaW4uanMiLCJzcmMvdG9vbHMvY2xlYXItdG9vbHMuanMiLCJzcmMvdG9vbHMvZ2V0LWJvZHkuanMiLCJzcmMvdG9vbHMvc2VhcmNoLXNlbGVjdGVkLWVsZW1lbnQuanMiXSwibmFtZXMiOltdLCJtYXBwaW5ncyI6IkFBQUE7QUNBQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDdkVBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDSkE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ25SQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBOztBQ2JBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7O0FDUEE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiJ3VzZSBzdHJpY3QnXG5cbnZhciBzZWFyY2hTZWxlY3RlZEVsZW1lbnQgPSByZXF1aXJlICgnLi4vdG9vbHMvc2VhcmNoLXNlbGVjdGVkLWVsZW1lbnQnKTtcbnZhciBlZGl0SW5zdCA9IHJlcXVpcmUoJy4uL2dsb2JhbHMvZWRpdG9yJyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7XG4gIGlmICh0eXBlb2YgdXBsb2FkY2FyZSA9PSAndW5kZWZpbmVkJykge1xuICAgIHJldHVybjsgLy8gbm90IGxvYWRlZCB5ZXRcbiAgfVxuICB2YXIgZWRpdG9yID0gZWRpdEluc3QuZWRpdG9yO1xuICBcbiAgdmFyIGNvbmZpZyA9IGVkaXRvci5jb25maWcudXBsb2FkY2FyZSB8fCB7fTtcbiAgXG4gIC8vIEFwcGx5IGRlZmF1bHQgcHJvcGVydGllcy5cbiAgaWYgKCAhICgnY3JvcCcgaW4gY29uZmlnKSkge1xuICAgIGNvbmZpZy5jcm9wID0gJyc7XG4gIH1cblxuICB1cGxvYWRjYXJlLnBsdWdpbihmdW5jdGlvbih1Yykge1xuICAgIHZhciBzZXR0aW5ncywgZWxlbWVudCwgZmlsZTtcblxuICAgIGlmIChlbGVtZW50ID0gc2VhcmNoU2VsZWN0ZWRFbGVtZW50KGVkaXRvciwgJ2ltZycpKSB7XG4gICAgICBmaWxlID0gZWxlbWVudC5nZXRBdHRyaWJ1dGUoJ3NyYycpO1xuICAgIH0gZWxzZSBpZiAoZWxlbWVudCA9IHNlYXJjaFNlbGVjdGVkRWxlbWVudChlZGl0b3IsICdhJykpIHtcbiAgICAgIGZpbGUgPSBlbGVtZW50LmdldEF0dHJpYnV0ZSgnaHJlZicpO1xuICAgIH1cblxuICAgIGlmIChmaWxlICYmIHVjLnV0aWxzLnNwbGl0Q2RuVXJsKGZpbGUpKSB7XG4gICAgICBzZXR0aW5ncyA9IHVjLnNldHRpbmdzLmJ1aWxkKFxuICAgICAgICB1Yy5qUXVlcnkuZXh0ZW5kKHt9LCBjb25maWcsIHttdWx0aXBsZTogZmFsc2V9KVxuICAgICAgKTtcbiAgICAgIGZpbGUgPSB1cGxvYWRjYXJlLmZpbGVGcm9tKCd1cGxvYWRlZCcsIGZpbGUsIHNldHRpbmdzKTtcbiAgICB9IGVsc2Uge1xuICAgICAgc2V0dGluZ3MgPSB1Yy5zZXR0aW5ncy5idWlsZChjb25maWcpXG4gICAgICBmaWxlID0gbnVsbDtcbiAgICB9XG5cbiAgICB2YXIgZGlhbG9nID0gdXBsb2FkY2FyZS5vcGVuRGlhbG9nKGZpbGUsIHNldHRpbmdzKS5kb25lKGZ1bmN0aW9uKHNlbGVjdGVkKSB7XG4gICAgICB2YXIgZmlsZXMgPSBzZXR0aW5ncy5tdWx0aXBsZSA/IHNlbGVjdGVkLmZpbGVzKCkgOiBbc2VsZWN0ZWRdO1xuICAgICAgdWMualF1ZXJ5LndoZW4uYXBwbHkobnVsbCwgZmlsZXMpLmRvbmUoZnVuY3Rpb24oKSB7XG4gICAgICAgIHVjLmpRdWVyeS5lYWNoKGFyZ3VtZW50cywgZnVuY3Rpb24oKSB7XG4gICAgICAgICAgdmFyIGltYWdlVXJsID0gdGhpcy5jZG5Vcmw7XG4gICAgICAgICAgaWYgKHRoaXMuaXNJbWFnZSAmJiAhIHRoaXMuY2RuVXJsTW9kaWZpZXJzKSB7XG4gICAgICAgICAgICBpbWFnZVVybCArPSAnLS9wcmV2aWV3Lyc7XG4gICAgICAgICAgfVxuICAgICAgICAgIGlmIChlbGVtZW50KSB7XG4gICAgICAgICAgICB2YXIgd2lkZ2V0O1xuICAgICAgICAgICAgaWYgKGVkaXRvci53aWRnZXRzICYmICh3aWRnZXQgPSBlZGl0b3Iud2lkZ2V0cy5zZWxlY3RlZFswXSlcbiAgICAgICAgICAgICAgICAmJiB3aWRnZXQuZWxlbWVudCA9PT0gZWxlbWVudFxuICAgICAgICAgICAgKSB7XG4gICAgICAgICAgICAgIHdpZGdldC5zZXREYXRhKCdzcmMnLCBpbWFnZVVybCkuc2V0RGF0YSgnaGVpZ2h0JywgbnVsbClcbiAgICAgICAgICAgIH0gZWxzZSBpZiAoZWxlbWVudC5nZXROYW1lKCkgPT0gJ2ltZycpIHtcbiAgICAgICAgICAgICAgZWxlbWVudC5kYXRhKCdja2Utc2F2ZWQtc3JjJywgJycpO1xuICAgICAgICAgICAgICBlbGVtZW50LnNldEF0dHJpYnV0ZSgnc3JjJywgaW1hZ2VVcmwpO1xuICAgICAgICAgICAgICBlbGVtZW50LnJlbW92ZUF0dHJpYnV0ZSgnd2lkdGgnKTtcbiAgICAgICAgICAgICAgZWxlbWVudC5yZW1vdmVBdHRyaWJ1dGUoJ2hlaWdodCcpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgZWxlbWVudC5kYXRhKCdja2Utc2F2ZWQtaHJlZicsICcnKTtcbiAgICAgICAgICAgICAgZWxlbWVudC5zZXRBdHRyaWJ1dGUoJ2hyZWYnLCB0aGlzLmNkblVybCk7XG4gICAgICAgICAgICB9XG4gICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgIGlmICh0aGlzLmlzSW1hZ2UpIHtcbiAgICAgICAgICAgICAgZWRpdG9yLmluc2VydEh0bWwoJzxpbWcgc3JjPVwiJyArIGltYWdlVXJsICsgJ1wiIGFsdD1cIlwiLz48YnI+JywgJ3VuZmlsdGVyZWRfaHRtbCcpO1xuICAgICAgICAgICAgfSBlbHNlIHtcbiAgICAgICAgICAgICAgZWRpdG9yLmluc2VydEh0bWwoJzxhIGhyZWY9XCInICsgdGhpcy5jZG5VcmwgKyAnXCI+JyArIHRoaXMubmFtZSArICc8L2E+ICcsICd1bmZpbHRlcmVkX2h0bWwnKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICB9XG4gICAgICAgIH0pO1xuICAgICAgfSk7XG4gICAgfSk7XG4gIH0pO1xufSIsIid1c2Ugc2NyaWN0J1xuXG5tb2R1bGUuZXhwb3J0cyA9IHtcbiAgZWRpdG9yOm51bGxcbn0iLCIvLyBVcGxvYWRjYXJlIENLZWRpdG9yIHBsdWdpblxuLy8gVmVyc2lvbjogMi4xLjFcbid1c2Ugc3RyaWN0JztcblxudmFyIGVkaXRJbnN0ID0gcmVxdWlyZSgnLi9nbG9iYWxzL2VkaXRvcicpO1xuXG5DS0VESVRPUi5wbHVnaW5zLmFkZCgndXBsb2FkY2FyZScsIHtcbiAgaGlkcGk6IHRydWUsXG4gIGljb25zOiAndXBsb2FkY2FyZScsXG4gIGluaXQgOiBmdW5jdGlvbihlZGl0b3IpIHsgICAgXG4gICAgZWRpdEluc3QuZWRpdG9yID0gZWRpdG9yO1xuICAgIHZhciBnZXRCb2R5ID0gcmVxdWlyZSgnLi90b29scy9nZXQtYm9keScpO1xuICAgIFxuICAgIGVkaXRvci5hZGRDb250ZW50c0NzcyggdGhpcy5wYXRoICsgJ3N0eWxlcy9wbHVnaW4uY3NzJyApO1xuICAgIHZhciBjb25maWcgPSBlZGl0b3IuY29uZmlnLnVwbG9hZGNhcmUgfHwge307XG5cbiAgICAvLyBDaGVjayBpZiBVcGxvYWRjYXJlIGlzIGFscmVhZHkgbG9hZGVkIGFuZCBsb2FkIGl0IGlmIG5vdC5cbiAgICBpZiAodHlwZW9mIHVwbG9hZGNhcmUgPT09ICd1bmRlZmluZWQnKSB7XG4gICAgICAgIHZhciB2ZXJzaW9uID0gY29uZmlnLndpZGdldFZlcnNpb24gfHwgJzIuNC4wJztcbiAgICAgICAgdmFyIHdpZGdldF91cmwgPSAnaHR0cHM6Ly91Y2FyZWNkbi5jb20vd2lkZ2V0LycgKyB2ZXJzaW9uICtcbiAgICAgICAgICAgICAgICAgJy91cGxvYWRjYXJlL3VwbG9hZGNhcmUuZnVsbC5taW4uanMnXG4gICAgICAgIENLRURJVE9SLnNjcmlwdExvYWRlci5sb2FkKHdpZGdldF91cmwpO1xuICAgIH1cblxuICAgIGVkaXRvci5hZGRDb21tYW5kKCdzaG93VXBsb2FkY2FyZURpYWxvZycsIHtcbiAgICAgIGFsbG93ZWRDb250ZW50OiAnaW1nWyFzcmMsYWx0XXt3aWR0aCxoZWlnaHR9O2FbIWhyZWZdJyxcbiAgICAgIHJlcXVpcmVkQ29udGVudDogJ2ltZ1tzcmNdO2FbaHJlZl0nLFxuICAgICAgZXhlYyA6IHJlcXVpcmUoJy4vY29tbWFuZHMvc2hvdy11cGxvYWRjYXJlLWRpYWxvZycpXG4gICAgfSk7XG5cbiAgICBlZGl0b3IudWkuYWRkQnV0dG9uICYmIGVkaXRvci51aS5hZGRCdXR0b24oJ1VwbG9hZGNhcmUnLCB7XG4gICAgICBsYWJlbCA6ICdVcGxvYWRjYXJlJyxcbiAgICAgIHRvb2xiYXIgOiAnaW5zZXJ0JyxcbiAgICAgIGNvbW1hbmQgOiAnc2hvd1VwbG9hZGNhcmVEaWFsb2cnXG4gICAgfSk7XG4gICAgXG4gICAgZWRpdG9yLm9uKCdjb250ZW50RG9tJywgZnVuY3Rpb24oKSB7XG4gICAgICBcbiAgICAgIHZhciBlZGl0YWJsZSA9IGVkaXRvci5lZGl0YWJsZSgpO1xuICAgICAgdmFyIHRvb2xzID0gbnVsbDtcbiAgICAgIHZhciBpc1Jlc2l6aW5nID0gZmFsc2U7XG4gICAgICB2YXIgcmVzaXplSW1nID0gbnVsbDtcbiAgICAgIHZhciByZXNpemVFbGVtZW50cyA9IG51bGw7XG4gICAgICB2YXIgcmVzaXplclNpemUgPSAxMjtcbiAgICAgIFxuICAgICAgdmFyIGNsZWFyVG9vbHMgPSByZXF1aXJlKCcuL3Rvb2xzL2NsZWFyLXRvb2xzJyk7XG4gICAgICBcbiAgICAgIGVkaXRhYmxlLmF0dGFjaExpc3RlbmVyKCBlZGl0YWJsZS5pc0lubGluZSgpID8gZWRpdGFibGUgOiBlZGl0b3IuZG9jdW1lbnQsICdtb3VzZW1vdmUnLCBmdW5jdGlvbiggZXZ0ICkge1xuICAgICAgICBldnQgPSBldnQuZGF0YTtcbiAgICAgICAgdmFyIHRhcmdldCA9IGV2dC5nZXRUYXJnZXQoKTtcbiAgICAgICAgdmFyIHNyYyA9IHRhcmdldC4kLmdldEF0dHJpYnV0ZSgnc3JjJyk7XG4gICAgICAgIFxuICAgICAgICBmdW5jdGlvbiBvbk1vdXNlT3V0KGV2dCkge1xuICAgICAgICAgIHZhciB0YXJnZXQgPSBldnQuZGF0YS5nZXRUYXJnZXQoKTtcbiAgICAgICAgICB2YXIgcmVjdCA9IHRhcmdldC4kLmdldEJvdW5kaW5nQ2xpZW50UmVjdCgpO1xuICAgICAgICAgIFxuICAgICAgICAgIGlmKChldnQuZGF0YS4kLmNsaWVudFggPCByZWN0LmxlZnQgfHwgZXZ0LmRhdGEuJC5jbGllbnRYID4gcmVjdC5yaWdodCkgfHwgXG4gICAgICAgICAgKGV2dC5kYXRhLiQuY2xpZW50WSA8IHJlY3QudG9wIHx8IGV2dC5kYXRhLiQuY2xpZW50WSA+IHJlY3QuYm90dG9tKSkge1xuICAgICAgICAgICAgdG9vbHMuaGlkZSgpOyAgXG4gICAgICAgICAgfVxuICAgICAgICB9XG4gICAgICAgIFxuICAgICAgICBpZih0YXJnZXQuaXMoJ2ltZycpICYmIChzcmMuaW5kZXhPZignd3d3LnVjYXJlY2RuLmNvbScpID4gLTEpICYmICFpc1Jlc2l6aW5nKSB7XG4gICAgICAgICAgdmFyIGJvZHkgPSBnZXRCb2R5KCk7XG4gICAgICAgICAgaWYoIXRvb2xzKSB7XG4gICAgICAgICAgICB0b29scyA9IGJvZHkuZmluZE9uZSgnZGl2LnRvb2xzLWNvbnRhaW5lcicpO1xuICAgICAgICAgICAgaWYoIXRvb2xzKSB7XG4gICAgICAgICAgICAgIHRvb2xzID0gQ0tFRElUT1IuZG9tLmVsZW1lbnQuY3JlYXRlRnJvbUh0bWwoJzxkaXYgY2xhc3M9XCJ0b29scy1jb250YWluZXJcIj48YnV0dG9uIGNsYXNzPVwiYnV0dG9uIHJlc2l6ZSBpY29uIGljb24tcmVzaXplXCI+PC9idXR0b24+PGJ1dHRvbiBjbGFzcz1cImJ1dHRvbiBkaWFsb2cgaWNvbiBpY29uLXVwbG9hZGNhcmVcIj48L2J1dHRvbj48L2Rpdj4nKTtcbiAgICAgICAgICAgIH1cbiAgICAgICAgICAgIHRvb2xzLnNldFN0eWxlKCd6aW5kZXgnLCAnMTAwJyk7XG4gICAgICAgICAgICBib2R5LmFwcGVuZCh0b29scyk7IFxuICAgICAgICAgICAgdG9vbHMub24oJ21vdXNlb3V0Jywgb25Nb3VzZU91dCk7XG4gICAgICAgICAgfVxuICAgICAgICAgIGVsc2Uge1xuICAgICAgICAgICAgdG9vbHMuc2hvdygpO1xuICAgICAgICAgIH1cbiAgICAgICAgICBcbiAgICAgICAgICB2YXIgcmVjdCA9IGdldFBvc2l0aW9uKHRhcmdldCk7XG4gICAgICAgICAgdG9vbHMuc2V0U3R5bGUoJ3RvcCcsIHJlY3QudG9wICsgJ3B4Jyk7XG4gICAgICAgICAgdG9vbHMuc2V0U3R5bGUoJ2xlZnQnLCByZWN0LmxlZnQgKyAncHgnKTtcbiAgICAgICAgICBcbiAgICAgICAgICB0b29scy5yZW1vdmVBbGxMaXN0ZW5lcnMoKTtcbiAgICAgICAgICB2YXIgcmVzaXplQnRuID0gdG9vbHMuZmluZE9uZSgnYnV0dG9uLnJlc2l6ZScpO1xuICAgICAgICAgIHJlc2l6ZUJ0bi5yZW1vdmVBbGxMaXN0ZW5lcnMoKTtcbiAgICAgICAgICByZXNpemVCdG4ub24oJ2NsaWNrJywgb25SZXNpemVBY3Rpb24uYmluZCh0YXJnZXQpKTtcbiAgICAgICAgICBcbiAgICAgICAgICB2YXIgZGlhbG9nQnRuID0gdG9vbHMuZmluZE9uZSgnYnV0dG9uLmRpYWxvZycpO1xuICAgICAgICAgIGRpYWxvZ0J0bi5yZW1vdmVBbGxMaXN0ZW5lcnMoKTtcbiAgICAgICAgICBkaWFsb2dCdG4ub24oJ2NsaWNrJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICAgIGVkaXRvci5nZXRTZWxlY3Rpb24oKS5zZWxlY3RFbGVtZW50KCB0YXJnZXQgKTtcbiAgICAgICAgICAgIGVkaXRvci5leGVjQ29tbWFuZCgnc2hvd1VwbG9hZGNhcmVEaWFsb2cnKTtcbiAgICAgICAgICB9KTtcbiAgICAgICAgICBcbiAgICAgICAgICB0YXJnZXQucmVtb3ZlQWxsTGlzdGVuZXJzKCk7XG4gICAgICAgICAgdGFyZ2V0Lm9uKCdtb3VzZW91dCcsIG9uTW91c2VPdXQpOyAgICAgICAgICBcbiAgICAgICAgICBcbiAgICAgICAgfSBlbHNlIGlmICh0b29scyAmJiB0YXJnZXQuJCAhPT0gdG9vbHMuJCAmJiAhaXNSZXNpemluZykge1xuICAgICAgICAgIGlmKHRhcmdldC5nZXRQYXJlbnQoKSAmJiAhdGFyZ2V0LmdldFBhcmVudCgpLmhhc0NsYXNzKCd0b29scy1jb250YWluZXInKSkge1xuICAgICAgICAgICAgdG9vbHMuaGlkZSgpO1xuICAgICAgICAgIH1cbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgaWYoaXNSZXNpemluZykge1xuICAgICAgICAgIGNvbnNvbGUubG9nKCdSZXNpemluZyEhISEnKTtcbiAgICAgICAgICB2YXIgbmF0aXZlRXZ0ID0gZXZ0LiQ7XG5cbiAgICAgICAgICB2YXIgbW92ZURpZmZYID0gbmF0aXZlRXZ0LnNjcmVlblggLSByZXNpemVFbGVtZW50cy5zdGFydFg7XG4gICAgICAgICAgdmFyIG1vdmVEaWZmWSA9IHJlc2l6ZUVsZW1lbnRzLnN0YXJ0WSAtIG5hdGl2ZUV2dC5zY3JlZW5ZO1xuICAgICAgICAgIHZhciBtb3ZlUmF0aW8gPSBNYXRoLmFicyhtb3ZlRGlmZlggLyBtb3ZlRGlmZlkpO1xuICAgICAgICAgIFxuICAgICAgICAgIGlmICggbW92ZURpZmZYIDw9IDAgKSB7XG5cdFx0XHRcdFx0XHRpZiAoIG1vdmVEaWZmWSA8PSAwICkge1xuXHRcdFx0XHRcdFx0XHRhZGp1c3RUb1gobW92ZURpZmZYKTtcbiAgICAgICAgICAgIH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRcdGlmICggbW92ZVJhdGlvID49IHJlc2l6ZUVsZW1lbnRzLnJhdGlvICkge1xuXHRcdFx0XHRcdFx0XHRcdGFkanVzdFRvWChtb3ZlRGlmZlgpO1xuICAgICAgICAgICAgICB9IGVsc2Uge1xuXHRcdFx0XHRcdFx0XHRcdGFkanVzdFRvWShtb3ZlRGlmZlkpOyBcbiAgICAgICAgICAgICAgfVxuXHRcdFx0XHRcdFx0fVxuXHRcdFx0XHRcdH0gZWxzZSB7XG5cdFx0XHRcdFx0XHRpZiAoIG1vdmVEaWZmWSA8PSAwICkge1xuXHRcdFx0XHRcdFx0XHRpZiAoIG1vdmVSYXRpbyA+PSByZXNpemVFbGVtZW50cy5yYXRpbyApIHtcblx0XHRcdFx0XHRcdFx0XHRhZGp1c3RUb1kobW92ZURpZmZZKTtcbiAgICAgICAgICAgICAgfSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0XHRhZGp1c3RUb1gobW92ZURpZmZYKTtcbiAgICAgICAgICAgICAgfVxuXHRcdFx0XHRcdFx0fSBlbHNlIHtcblx0XHRcdFx0XHRcdFx0YWRqdXN0VG9ZKG1vdmVEaWZmWSk7XG5cdFx0XHRcdFx0XHR9XG5cdFx0XHRcdFx0fVxuICAgICAgICAgICAgaWYocmVzaXplRWxlbWVudHMubmV3V2lkdGggPj0gMTUgJiYgcmVzaXplRWxlbWVudHMubmV3SGVpZ2h0ID49IDE1KSB7XG4gICAgICAgICAgICAgIHJlc2l6ZUltZy5zZXRBdHRyaWJ1dGVzKCB7d2lkdGg6IHJlc2l6ZUVsZW1lbnRzLm5ld1dpZHRoLCBoZWlnaHQ6IHJlc2l6ZUVsZW1lbnRzLm5ld0hlaWdodH0gKTtcbiAgICAgICAgICAgICAgcmVzaXplRWxlbWVudHMucmVzaXplQm9yZGVyLnNldFN0eWxlKCd3aWR0aCcsIHJlc2l6ZUVsZW1lbnRzLm5ld1dpZHRoICsgJ3B4Jyk7XG4gICAgICAgICAgICAgIHJlc2l6ZUVsZW1lbnRzLnJlc2l6ZUJvcmRlci5zZXRTdHlsZSgnaGVpZ2h0JywgcmVzaXplRWxlbWVudHMubmV3SGVpZ2h0ICsgJ3B4Jyk7XG4gICAgICAgICAgICAgIFxuICAgICAgICAgICAgICByZXNpemVFbGVtZW50cy5ib3R0b21SaWdodFJlc2l6ZXIuc2V0U3R5bGUoJ2xlZnQnLCByZXNpemVFbGVtZW50cy5pbWdSZWN0LmxlZnQgKyByZXNpemVFbGVtZW50cy5uZXdXaWR0aCAtIHJlc2l6ZXJTaXplLzIgKyAncHgnKTtcbiAgICAgICAgICAgICAgcmVzaXplRWxlbWVudHMuYm90dG9tUmlnaHRSZXNpemVyLnNldFN0eWxlKCd0b3AnLCByZXNpemVFbGVtZW50cy5pbWdSZWN0LnRvcCArIHJlc2l6ZUVsZW1lbnRzLm5ld0hlaWdodCAtIHJlc2l6ZXJTaXplLzIgKyAncHgnKTtcbiAgICAgICAgICAgIH1cblx0XHRcdFx0XHR9XG4gICAgICB9KTtcbiAgICAgIFxuICAgICAgZWRpdG9yLm9uKCdkcmFnc3RhcnQnLCBmdW5jdGlvbihldnQpIHtcbiAgICAgICAgY2xlYXJUb29scygpO1xuICAgICAgfSk7XG5cbiAgICAgIGZ1bmN0aW9uIG9uUmVzaXplQWN0aW9uKHJhRXZ0KSB7XG4gICAgICAgIGNsZWFyVG9vbHMoKTtcbiAgICAgICAgdmFyIGltZyA9IHRoaXM7XG4gICAgICAgIHZhciByZWN0ID0gZ2V0UG9zaXRpb24oaW1nKTtcbiAgICAgICAgZWRpdG9yLmdldFNlbGVjdGlvbigpLmZha2UoaW1nKTtcbiAgICAgICAgXG4gICAgICAgIHZhciBib2R5ID0gZ2V0Qm9keSgpO1xuICAgICAgICB2YXIgc2NyZWVuT3ZlcmxheSA9IENLRURJVE9SLmRvbS5lbGVtZW50LmNyZWF0ZUZyb21IdG1sKCc8ZGl2IGNsYXNzPVwic2NyZWVuLW92ZXJsYXlcIj48ZGl2PicpO1xuICAgICAgICB2YXIgcmVzaXplQm9yZGVyID0gQ0tFRElUT1IuZG9tLmVsZW1lbnQuY3JlYXRlRnJvbUh0bWwoJzxkaXYgY2xhc3M9XCJyZXNpemUtYm9yZGVyXCI+PGRpdj4nKTtcbiAgICAgICAgc2NyZWVuT3ZlcmxheS5hcHBlbmQocmVzaXplQm9yZGVyKTtcbiAgICAgICAgYm9keS5hcHBlbmQoc2NyZWVuT3ZlcmxheSk7XG4gICAgICAgIFxuICAgICAgICB2YXIgYm9keVJlY3QgPSBnZXRQb3NpdGlvbihlZGl0YWJsZS5nZXREb2N1bWVudCgpLmdldERvY3VtZW50RWxlbWVudCgpKTtcbiAgICAgICAgXG4gICAgICAgIHNjcmVlbk92ZXJsYXkuc2V0U3R5bGUoJ3dpZHRoJywgYm9keVJlY3Qud2lkdGggKyAncHgnKTtcbiAgICAgICAgc2NyZWVuT3ZlcmxheS5zZXRTdHlsZSgnaGVpZ2h0JywgYm9keVJlY3QuaGVpZ2h0ICsgJ3B4Jyk7XG4gICAgICAgIFxuICAgICAgICByZXNpemVCb3JkZXIuc2V0U3R5bGUoJ3RvcCcsIHJlY3QudG9wICsgJ3B4Jyk7XG4gICAgICAgIHJlc2l6ZUJvcmRlci5zZXRTdHlsZSgnbGVmdCcsIHJlY3QubGVmdCArICdweCcpO1xuICAgICAgICByZXNpemVCb3JkZXIuc2V0U3R5bGUoJ3dpZHRoJywgcmVjdC53aWR0aCArICdweCcpO1xuICAgICAgICByZXNpemVCb3JkZXIuc2V0U3R5bGUoJ2hlaWdodCcsIHJlY3QuaGVpZ2h0ICsgJ3B4Jyk7XG4gICAgICAgIFxuICAgICAgICByZXNpemVFbGVtZW50cyA9IHtcbiAgICAgICAgICByZXNpemVCb3JkZXI6IHJlc2l6ZUJvcmRlcixcbiAgICAgICAgICBpbWdSZWN0OiByZWN0LFxuICAgICAgICAgIG5ld1dpZHRoOiByZWN0LndpZHRoLFxuICAgICAgICAgIG5ld0hlaWdodDogcmVjdC5oZWlnaHRcbiAgICAgICAgfVxuICAgICAgICBcbiAgICAgICAgY3JlYXRlUmVzaXplcnMocmVjdCwgc2NyZWVuT3ZlcmxheSk7XG4gICAgICAgIHJlc2l6ZUltZyA9IGltZztcbiAgICAgICAgXG4gICAgICAgIHNjcmVlbk92ZXJsYXkub24oJ2NsaWNrJywgZnVuY3Rpb24oKXtcbiAgICAgICAgICBlZGl0b3IucmVzZXRVbmRvKCk7XG4gICAgICAgICAgaWYoaXNSZXNpemluZykge1xuICAgICAgICAgICAgaXNSZXNpemluZyA9IGZhbHNlO1xuICAgICAgICAgICAgdXBkYXRlSW1nU3JjKCk7XG4gICAgICAgICAgICByZXR1cm47XG4gICAgICAgICAgfVxuICAgICAgICAgIFxuICAgICAgICAgIHNjcmVlbk92ZXJsYXkucmVtb3ZlKCk7XG4gICAgICAgICAgcmVzaXplSW1nID0gbnVsbDtcbiAgICAgICAgICByZXNpemVFbGVtZW50cyA9IG51bGw7XG4gICAgICAgIH0pO1xuICAgICAgICBcbiAgICAgICAgcmVzaXplQm9yZGVyLm9uKCdjbGljaycsIGZ1bmN0aW9uKGNsaWNrRXZ0KSB7XG4gICAgICAgICAgY2xpY2tFdnQuZGF0YS4kLnN0b3BQcm9wYWdhdGlvbigpO1xuICAgICAgICAgIGNsaWNrRXZ0LmRhdGEuJC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIHJlc2l6ZUVsZW1lbnRzLmJvdHRvbVJpZ2h0UmVzaXplci5vbignbW91c2Vkb3duJywgZnVuY3Rpb24obWRFdnQpIHtcbiAgICAgICAgICBcbiAgICAgICAgICBjb25zb2xlLmxvZygnbW91c2UgRG93bicpO1xuICAgICAgICAgIGNvbnNvbGUubG9nKG1kRXZ0KTtcbiAgICAgICAgICBtZEV2dC5kYXRhLiQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgbWRFdnQuZGF0YS4kLnByZXZlbnREZWZhdWx0KCk7XG4gICAgICAgICAgaXNSZXNpemluZyA9IHRydWU7XG4gICAgICAgICAgcmVzaXplRWxlbWVudHMuc3RhcnRYID0gbWRFdnQuZGF0YS4kLnNjcmVlblg7XG5cdFx0XHRcdCAgcmVzaXplRWxlbWVudHMuc3RhcnRZID0gbWRFdnQuZGF0YS4kLnNjcmVlblk7XG4gICAgICAgICAgcmVzaXplRWxlbWVudHMuc3RhcnRXaWR0aCA9IHJlc2l6ZUltZy4kLmNsaWVudFdpZHRoO1xuICAgICAgICAgIHJlc2l6ZUVsZW1lbnRzLnN0YXJ0SGVpZ2h0ID0gcmVzaXplSW1nLiQuY2xpZW50SGVpZ2h0O1xuICAgICAgICAgIHJlc2l6ZUVsZW1lbnRzLnJhdGlvID0gcmVzaXplRWxlbWVudHMuc3RhcnRXaWR0aCAvIHJlc2l6ZUVsZW1lbnRzLnN0YXJ0SGVpZ2h0O1xuICAgICAgICAgIFxuICAgICAgICB9KTtcbiAgICAgICAgXG4gICAgICAgIHJlc2l6ZUVsZW1lbnRzLmJvdHRvbVJpZ2h0UmVzaXplci5vbignbW91c2V1cCcsIGZ1bmN0aW9uKGV2dCkge1xuICAgICAgICAgIGVkaXRvci5yZXNldFVuZG8oKTtcbiAgICAgICAgICBjb25zb2xlLmxvZygnTW91c2UgVXAnKTtcbiAgICAgICAgICBjb25zb2xlLmxvZyhldnQpO1xuICAgICAgICAgIGlzUmVzaXppbmcgPSBmYWxzZTtcbiAgICAgICAgICB1cGRhdGVJbWdTcmMoKTtcbiAgICAgICAgfSk7XG4gICAgICB9XG4gICAgICBcbiAgICAgIGZ1bmN0aW9uIGNyZWF0ZVJlc2l6ZXJzKHJlY3QsIG92ZXJsYXkpIHtcbiAgICAgICAgXG4gICAgICAgIHZhciBib3R0b21SaWdodFJlc2l6ZXIgPSBDS0VESVRPUi5kb20uZWxlbWVudC5jcmVhdGVGcm9tSHRtbCgnPGRpdiBjbGFzcz1cInJlc2l6ZXIgYm90dG9tLXJpZ2h0XCI+PGRpdj4nKTtcbiAgICAgICAgc2V0VXBSZXNpemVyKGJvdHRvbVJpZ2h0UmVzaXplciwgcmVjdC5ib3R0b20sIHJlY3QucmlnaHQsIHJlc2l6ZXJTaXplKTtcbiAgICAgICAgb3ZlcmxheS5hcHBlbmQoYm90dG9tUmlnaHRSZXNpemVyKTtcbiAgICAgICAgcmVzaXplRWxlbWVudHMuYm90dG9tUmlnaHRSZXNpemVyID0gYm90dG9tUmlnaHRSZXNpemVyO1xuICAgICAgfVxuICAgICAgXG4gICAgICBmdW5jdGlvbiBzZXRVcFJlc2l6ZXIoZWxlbWVudCwgdG9wLCBsZWZ0LCBzaXplKSB7XG4gICAgICAgIGVsZW1lbnQuc2V0U3R5bGUoJ3RvcCcsIHRvcCAtIHNpemUvMiArICdweCcpO1xuICAgICAgICBlbGVtZW50LnNldFN0eWxlKCdsZWZ0JywgbGVmdCAtIHNpemUvMiArICdweCcpO1xuICAgICAgICBlbGVtZW50LnNldFN0eWxlKCd3aWR0aCcsIHNpemUgKyAncHgnKTtcbiAgICAgICAgZWxlbWVudC5zZXRTdHlsZSgnaGVpZ2h0Jywgc2l6ZSArICdweCcpO1xuICAgICAgICBlbGVtZW50Lm9uKCdjbGljaycsIGZ1bmN0aW9uKGV2dCkge1xuICAgICAgICAgIGV2dC5kYXRhLiQuc3RvcFByb3BhZ2F0aW9uKCk7XG4gICAgICAgICAgZXZ0LmRhdGEuJC5wcmV2ZW50RGVmYXVsdCgpO1xuICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgZnVuY3Rpb24gZ2V0UG9zaXRpb24oZWxlbWVudCkge1xuICAgICAgICB2YXIgYm9keSA9IGdldEJvZHkoKTtcbiAgICAgICAgdmFyIHJlc1JlY3QgPSBlbGVtZW50LiQuZ2V0Qm91bmRpbmdDbGllbnRSZWN0KCk7XG4gICAgICAgIFxuICAgICAgICByZXR1cm4ge1xuICAgICAgICAgIHRvcDogcmVzUmVjdC50b3AgKyBib2R5LiQuc2Nyb2xsVG9wLFxuICAgICAgICAgIGJvdHRvbTogcmVzUmVjdC5ib3R0b20gKyBib2R5LiQuc2Nyb2xsVG9wLFxuICAgICAgICAgIGxlZnQ6IHJlc1JlY3QubGVmdCArIGJvZHkuJC5zY3JvbGxMZWZ0LFxuICAgICAgICAgIHJpZ2h0OiByZXNSZWN0LnJpZ2h0ICsgYm9keS4kLnNjcm9sbExlZnQsXG4gICAgICAgICAgd2lkdGg6IHJlc1JlY3Qud2lkdGgsXG4gICAgICAgICAgaGVpZ2h0OiByZXNSZWN0LmhlaWdodFxuICAgICAgICB9O1xuICAgICAgfVxuICAgICAgXG4gICAgICBmdW5jdGlvbiB1cGRhdGVJbWdTcmMoKSB7XG4gICAgICAgIHZhciBpbml0aWFsVXJsID0gcmVzaXplSW1nLmdldEF0dHJpYnV0ZSgnc3JjJyk7XG4gICAgICAgIHZhciBuZXdVcmwgPSBpbml0aWFsVXJsLnN1YnN0cigwLCBpbml0aWFsVXJsLmluZGV4T2YoJy9wcmV2aWV3JykpICsgJy9wcmV2aWV3LycgKyByZXNpemVFbGVtZW50cy5uZXdXaWR0aCArICd4JyArIHJlc2l6ZUVsZW1lbnRzLm5ld0hlaWdodCArICcvJztcbiAgICAgICAgcmVzaXplSW1nLnNldEF0dHJpYnV0ZXMoe1xuICAgICAgICAgICAgICAnZGF0YS1ja2Utc2F2ZWQtc3JjJzogbmV3VXJsLFxuICAgICAgICAgICAgICAnc3JjJzogbmV3VXJsXG4gICAgICAgICAgICB9KTtcbiAgICAgIH1cbiAgICAgIFxuICAgICAgZnVuY3Rpb24gYWRqdXN0VG9YKG1vdmVEaWZmWCkge1xuXHRcdFx0XHRyZXNpemVFbGVtZW50cy5uZXdXaWR0aCA9IHJlc2l6ZUVsZW1lbnRzLnN0YXJ0V2lkdGggKyBtb3ZlRGlmZlg7XG5cdFx0XHRcdHJlc2l6ZUVsZW1lbnRzLm5ld0hlaWdodCA9IE1hdGgucm91bmQoIHJlc2l6ZUVsZW1lbnRzLm5ld1dpZHRoIC8gcmVzaXplRWxlbWVudHMucmF0aW8gKTtcblx0XHRcdH1cblxuXHRcdFx0Ly8gQ2FsY3VsYXRlIGhlaWdodCBmaXJzdCwgYW5kIHRoZW4gYWRqdXN0IHdpZHRoLCBwcmVzZXJ2aW5nIHJhdGlvLlxuXHRcdFx0ZnVuY3Rpb24gYWRqdXN0VG9ZKG1vdmVEaWZmWSkge1xuXHRcdFx0XHRyZXNpemVFbGVtZW50cy5uZXdIZWlnaHQgPSByZXNpemVFbGVtZW50cy5zdGFydEhlaWdodCAtIG1vdmVEaWZmWTtcblx0XHRcdFx0cmVzaXplRWxlbWVudHMubmV3V2lkdGggPSBNYXRoLnJvdW5kKCByZXNpemVFbGVtZW50cy5uZXdIZWlnaHQgKiByZXNpemVFbGVtZW50cy5yYXRpbyApO1xuXHRcdFx0fVxuICAgIH0pOyAgICBcbiAgfVxufSk7XG4iLCIndXNlIHN0cmljdCdcblxudmFyIGdldEJvZHkgPSByZXF1aXJlKCcuL2dldC1ib2R5Jyk7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24oKSB7ICAgICAgICBcbiAgdmFyIGJvZHkgPSBnZXRCb2R5KCk7XG4gIHZhciB0b29scyA9IGJvZHkuZmluZE9uZSgnZGl2LnRvb2xzLWNvbnRhaW5lcicpOyBcbiAgXG4gIGlmKHRvb2xzKSB7XG4gICAgdG9vbHMuaGlkZSgpO1xuICB9IGVsc2Uge1xuICAgIGNvbnNvbGUubG9nKCd0b29scyBub3QgZm91bmQnKTtcbiAgfVxufSIsIid1c2Ugc3RyaWN0J1xuXG52YXIgZWRpdG9yID0gcmVxdWlyZSgnLi4vZ2xvYmFscy9lZGl0b3InKS5lZGl0b3I7XG5cbm1vZHVsZS5leHBvcnRzID0gZnVuY3Rpb24gZ2V0Qm9keSgpIHtcbiAgdmFyIGVkaXRhYmxlID0gZWRpdG9yLmVkaXRhYmxlKCk7XG4gIHJldHVybiBlZGl0YWJsZS5nZXREb2N1bWVudCgpLmdldERvY3VtZW50RWxlbWVudCgpLmZpbmRPbmUoJ2JvZHknKTtcbn0iLCIndXNlIHN0cmljdCdcblxubW9kdWxlLmV4cG9ydHMgPSBmdW5jdGlvbiAoZWRpdG9yLCBuZWVkbGUpIHtcbiAgdmFyIHNlbCA9IGVkaXRvci5nZXRTZWxlY3Rpb24oKTtcbiAgdmFyIGVsZW1lbnQgPSBzZWwuZ2V0U2VsZWN0ZWRFbGVtZW50KCk7XG4gIGlmIChlbGVtZW50ICYmIGVsZW1lbnQuaXMobmVlZGxlKSkge1xuICAgIHJldHVybiBlbGVtZW50O1xuICB9XG5cbiAgdmFyIHdpZGdldDtcbiAgaWYgKGVkaXRvci53aWRnZXRzICYmICh3aWRnZXQgPSBlZGl0b3Iud2lkZ2V0cy5zZWxlY3RlZFswXSkpIHtcbiAgICBpZiAod2lkZ2V0LmVsZW1lbnQuaXMobmVlZGxlKSkge1xuICAgICAgcmV0dXJuIHdpZGdldC5lbGVtZW50O1xuICAgIH1cbiAgfVxuXG4gIHZhciByYW5nZSA9IHNlbC5nZXRSYW5nZXMoKVswXTtcbiAgaWYgKHJhbmdlKSB7XG4gICAgcmFuZ2Uuc2hyaW5rKENLRURJVE9SLlNIUklOS19URVhUKTtcbiAgICByZXR1cm4gZWRpdG9yLmVsZW1lbnRQYXRoKHJhbmdlLmdldENvbW1vbkFuY2VzdG9yKCkpLmNvbnRhaW5zKG5lZWRsZSwgMSk7XG4gIH1cbn0iXX0=
