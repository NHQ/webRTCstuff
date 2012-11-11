var media = require('./media');
var domready = require('domready');
var socket = require('./socket');
var viewer = require('./viewer');
var player = require('./player');
var log = window.log = console.log;

module.exports = function(){

  domready(init);

  function init(){

    console.log('AHOY');

    //var origin = window.location.host.match('localhost') ? '127.0.0.1' : window.location.host
    
    var socket = window.socket = io.connect('http://'+window.location.host);

    socket.on('connected', connected);

  }

  function connected(){
    log('connected');
  }


}
