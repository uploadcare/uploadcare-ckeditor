'use strict'

var getBody = require('./get-body');
var findOne = require('./find-one');

module.exports = function() {        
  var body = getBody();
  var tools = body.findOne ? body.findOne('div.tools-container') : findOne.bind(body)('div.tools-container'); 
  
  if(tools) {
    tools.hide();
  } else {
    console.log('tools not found');
  }
}