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