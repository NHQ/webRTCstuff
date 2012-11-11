var BaseModel = require('./base')
;

module.exports = function(data){
  data = data||{};
  var member = new BaseModel({
    id:data.id
    ,name:data.name
    ,picture:data.picture
    ,status:data.status
  });

  member.type = 'member';

  return member;
};
