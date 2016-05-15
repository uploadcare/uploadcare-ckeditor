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
