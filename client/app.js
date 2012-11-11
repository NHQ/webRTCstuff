var media = require('./media');
var domready = require('domready');
var ui = require('./ui');

module.exports = function(config){

  domready(init);

  function init(){
    
    var socket = window.socket = io.connect('http://'+window.location.host);

    socket.on('connected', connected);

  }

  function connected(){
    log('connected');
  }

  };

}
