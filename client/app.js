var media = require('./media');
var domready = require('domready');
var ui = require('./ui');
var helper = require('./helper');

module.exports = function(config){

  domready(init);

  function init(){
    console.log('INIT CALLED!!!');
     
    var socket = window.socket = io.connect('http://'+window.location.host);

    media(socket);
    
    socket.on('connected',function(data){

      var id = data.id;

      console.log('id EVENT ',id);

      var orig = helper.cookie('clever-sid');

      console.log('member: ',id);
      
      var res = helper.cookie('clever-sid',id,1000*60*60*24);

      try{

        ui.init(socket,data);

      } catch (e){

        console.log('oh no couldnt init the ui! ',e);

      }

    });

  }

};


