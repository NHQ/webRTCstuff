var BaseModel = require('./base')
;

module.exports = function(data){
  data = data||{};
  var socket = new BaseModel({
    room:data.room,
    member:data.member,
    socket:data.socket
  });

  socket.type = 'socket';
  return socket;
}
