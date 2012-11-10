var BaseModel = require('./base')
;

module.exports = function(data){
  return new BaseModel({
    room:data.room,
    member:data.member,
    socket:data.socket
  });
}
