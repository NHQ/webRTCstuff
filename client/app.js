var media = require('./media');
var domready = require('domready');
var ui = require('./ui');

module.exports = function(config){

  domready(init);

  function init(){
    
    var socket = window.socket = io.connect('http://'+window.location.host+'/socket.io/socker.io.js');

    socket.on('connected', connected);

    ui.init(socket);


  }

  function connected(){
    log('connected');
  }

};


