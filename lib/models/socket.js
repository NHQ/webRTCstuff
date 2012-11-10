var BaseModel = require('./base')
;

module.exports = function(data){
  data = data||{};
  return new BaseModel({
    room:data.room,
    member:data.member,
    socket:data.socket
  });
}
