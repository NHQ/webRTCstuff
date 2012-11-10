var BaseModel = require('./base')
;

module.exports = function(data){
  data = data||{};
  return new BaseModel({
    id:data.id
    ,name:data.name
    ,picture:data.picture
    ,status:data.status
  });
}
