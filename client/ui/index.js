var onair = document.getElementById('onair');
var bigscreen = document.getElementById('bigscreen');
var smallchat = document.getElementById('smallchat');
var largechat = document.getElementById('largechat');
var sidebar = document.getElementById('sidebar');
var midscreen = document.getElementById('midscreen');
var director = document.getElementById('director');
var cast = document.getElementById('cast');
var noop = function(){};
var e = module.exports;

e.addPlayer = function(player, cb, cb2){
  var div = document.createElement('div');
  var vid = document.createElement('video');
  var b1 = document.createElement('button');
  var b2 = document.createElement('button');
  div.classList.add('player');
  vid.classList.add('screen');
  vid.classList.add('tiny');
  b1.type = 'submit';
  b2.type = 'submit';
  b1.onclick = cb || noop;
  b2.onclick = cb || noop;
  b2.textContent = b2.text = 'Switch to ' + player.name || 'player';
  b1.textContent = b1.text = 'Alert';
  cast.appendChild(div);
  div.appendChild(vid);
  div.appendChild(b1);
  div.appendChild(b2);
  return div;
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
