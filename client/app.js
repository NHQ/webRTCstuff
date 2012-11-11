var media = require('./media');
var domready = require('domready');
var ui = require('./ui');
var helper = require('./helper');

module.exports = function(config){

  domready(init);

  function init(){
    console.log('INIT CALLED!!!');
     
    var socket = window.socket = io.connect('http://'+window.location.host);

    
    socket.on('connected',function(id){

      console.log('id EVENT ',id);

      var orig = helper.cookie('clever-sid');

      console.log('getting cleveer sid cookie ',orig);

      console.log('got id ',id,' had id ',orig);
      
      var res = helper.cookie('clever-sid',id,1000*60*60*24);
      console.log('called set cookie ',res);

      try{
        ui.init(socket);
      } catch (e){
        console.log('oh no couldnt init the ui! ',e);
      }

    });

    socket.emit('hi');

  }

};


