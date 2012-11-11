var e = module.exports;
var PLAYER;
var CAST = window._CAST = [];
var onair = document.getElementById('onair');
var bigscreen = document.getElementById('bigscreen');
var smallchat = document.getElementById('smallchat');
var largechat = document.getElementById('largechat');
var sidebar = document.getElementById('sidebar');
var midscreen = document.getElementById('midscreen');
var director = document.getElementById('director');
var cast = document.getElementById('cast');
var noop = function(){};
var submitLink  = document.getElementById('submitLink');
var tube  = document.getElementById('tube');
var playMusic = document.getElementById('playMusic');
var pauseMusic = document.getElementById('pauseMusic');
var micOn = document.getElementById('micOn');
var micOn = document.getElementById('micOff');
var which = document.getElementById('which');
var browse = document.getElementById('browse');
var joinGame = document.getElementById('joinGame');
var createRoom = document.getElementById('createRoom');
var newRoomName = document.getElementById('newRoomName');
var sockInit = false;

e.updateBrowse = function(list){
  browse.options.length = 1;
  list = list || window._STATE.rooms;
  list.forEach(function(e, i){
    var option = document.createElement('option');
    option.val = e.id || 12345;
    option.text = e.name;
    browse.add(option, null);
  });
};

e.init = function(socket, data){

    if(!sockInit){
      sockInit = true;
      socket.on('laffs', function(){
        $('#laffs')[0].play()
      });

      socket.on('horn', function(){
        $('#horn')[0].play()
      });

      socket.on('applause', function(){
        $('#applause')[0].play()
      })
    };

    var socket = socket, data = data;

    $('*').unbind();

    window._STATE = data;
    PLAYER = window._PLAYER = {id: data.id};
    PLAYER.name = 'URSELF!';

    data.rooms = data.rooms.length ? data.rooms : [].concat({name: 'one room'}, {name: 'two room'}, {name: 'three room'});

    var self = e;

    $(createRoom).bind('click', function(){
      socket.emit('join_room', newRoomName.value || 'NO NAME DUH', function(data){
	  midscreen.src = bigscreen.src;
	  if(CAST.length){
  	    window._CAST.forEach(function(p){
  	      var el = e.removePlayer(p.el);
	    });
	    CAST = [];
	  };
	  e.showMidScreen();
	  e.showSidebar();
	  e.addPlayer(PLAYER, bigscreen.src);
	  alert('YOUR ARE THE DIRECTOR OF THIS ROOM');
      }); 
    });

    $(joinGame).bind('click', function(){
      if(!window.currentRoom){
	alert('this is not a room, try creating one, or browse rooms');
	return
      }
      else socket.emit('join_room', {id: window.currentRoom}, function(data){
	
      }); 
    });

    // when the browse select is clicked, call the server with a 'browse' ping, get a 'browseResults' back
    $(browse).bind('mousedown', function(e){
	self.updateBrowse();
//      socket.once('browseResults', self.updateBrowse);
//      socket.emit('browse');
    });

    $(browse).bind('change', function(e){
	var target = e.target.selectedOptions[0].val;
	socket.emit('join_room', target, function(data){
          	
        });	
//      socket.once('browseResults', self.updateBrowse);
//      socket.emit('browse');
    });


    $(which).bind('click', function(e){
      if(which.value == 'view'){
	window._SELF = 'view';
	self.showBigScreen();
	self.hideSideBar();
//	self.hideDirector();
//	self.showComment();
      }
      else{
	window._SELF = 'play';
	self.showMidScreen();
	self.showSidebar();
      }
    });

    $('#playLaffs').bind('click', function(){
      socket.emit('laff');
//      $('#laffs')[0].play()
    });

    $('#playApplause').bind('click', function(){
      socket.emit('applause');
//      $('#applause')[0].play()
    });

    $('#playHorn').bind('click', function(){
      socket.emit('horn');
//      $('#horn')[0].play()
    });

    micOn.addEventListener('click', function(e){
	socket.emit('micOn', {});
    });

    micOff.addEventListener('click', function(e){
	socket.emit('micOff', {});
    });

    submitLink.addEventListener('click', function(e){
	socket.emit('submitLink', tube.value);
	console.log(tube.value);
    })

    playMusic.addEventListener('click', function(e){
	socket.emit('playMusic');
    })

    pauseMusic.addEventListener('click', function(e){
	socket.emit('pauseMusic');
    })

};

e.addPlayer = function(player, src, cb, cb2){
  var div = document.createElement('div');
  var vid = document.createElement('video');
  var b1 = document.createElement('button');
  var b2 = document.createElement('button');
  div.classList.add('player');
  vid.classList.add('screen');
  vid.classList.add('tiny');
  vid.setAttribute('autoplay', 'autoplay');
  vid.src = src;
  b1.type = 'submit';
  b2.type = 'submit';
  $(b1).bind('click', function(){
    socket.emit('alertPlayer', player.id);
  });
  
  $(b2).bind('click', function(){
    socket.emit('chose_feed_source', {"connectionId" : player.id});
  });  
  
  b2.textContent = b2.text = 'Switch to ' + player.name || 'player';
  b1.textContent = b1.text = 'Alert';
  cast.appendChild(div);
  div.appendChild(vid);
  div.appendChild(b1);
  div.appendChild(b2);
  div.id = player.id;
  player.el = div;
  CAST.push(player);
  return vid;
};

e.removePlayer = function(el){
  cast.removeChild(el);
}

e.showCast = function(){
    cast.classList.remove('hide');
};

e.hideCast = function(){
    cast.classList.add('hide');
};

e.hideDirector = function(){
    director.classList.add('hide');
};

e.showDirector = function(){
    director.classList.remove('hide');
};

e.showBigScreen = function(){
    bigscreen.classList.remove('hide');
    midscreen.classList.add('hide');
};

e.showMidScreen = function(){
    bigscreen.classList.add('hide');
    midscreen.classList.remove('hide');
};

e.showSidebar = function(){
    sidebar.classList.remove('hide');
};

e.hideSidebar = function(){
    sidebar.classList.add('hide');
};

e.hideLargeChat = function(){
    largechat.classList.add('hide');
};

e.showLargeChat = function(){
    largechat.classList.remove('hide');
};

e.offair = function(){
    var c = onair.classList;
    c.add('hide');
};
