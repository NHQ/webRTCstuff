var media = require('./media');
var domready = require('domready');
var ui = require('./ui');
var helper = require('./helper');

module.exports = function(config){

  domready(init);

  function init(){
    
    var socket = window.socket = io.connect('http://'+window.location.host+'/socket.io/socker.io.js');

    socket.on('id',function(id){
      var orig = helper.cookie('clever-sid');
      console.log('got id ',id,' had id ',orig);
      helper.cookie('clever-sid',id);

      try{
        ui.init(socket);
      } catch (e){
        console.log('oh no couldnt init the ui! ',e);
      }

    });

  }

};


