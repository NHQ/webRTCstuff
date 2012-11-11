var BaseModel = require('./base')
;

module.exports = function(data){
  data = data||{};
  var member = new BaseModel({
    id:data.id
    ,name:data.name
    ,picture:data.picture
    ,active:data.active||data.status
    ,data:{}
    ,updated:data.updated||Date.now()
    ,room:data.room
  });

  member.type = 'member';

  return member;
};
