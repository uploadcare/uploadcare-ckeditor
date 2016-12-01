'use strict'

var getBody = require('./get-body');
var findOne = require('./find-one');

module.exports = function(editor) {        
  var body = getBody(editor);
  
  if(!body) {
    return;
  }
    
  var tools = body.findOne ? body.findOne('div.tools-container') : findOne.bind(body)('div.tools-container'); 
  
  if(tools) {
    tools.hide();
  }
}
