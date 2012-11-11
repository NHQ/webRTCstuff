var media = require('./media');
var domready = require('domready');
var ui = require('./ui');

module.exports = function(config){

  domready(init);

  function init(){

    var origin = window.location.host.match('localhost') ? '127.0.0.1' : window.location.host
    
    var socket = window.socket = io.connect('http://'+origin + ':8000');

  };

}
