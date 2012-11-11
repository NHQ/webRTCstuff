var BaseModel = require('./base')
;


module.exports = function(data){
  var rooms = new BaseModel({
    rooms:[]
  });

  rooms.type = 'rooms';

  return rooms;

}
