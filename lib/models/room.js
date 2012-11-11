var BaseModel = require('./base')
;

module.exports = function(data){
  data = data||{};
  var room = new BaseModel({
    id:data.id
    ,name:data.name
    ,description:data.deescription
    ,members:[]
    ,videos:[]
    ,director:false
  });

  // optional field for room metadata
  if(data.data) room.data.data = data.data;

  room.type = 'room';

  return room;
}
