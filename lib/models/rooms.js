var BaseModel = require('./base')
;


module.exports = function(data){
  var rooms = new BaseModel({
    rooms:[]
  });

  rooms.type = 'rooms';
  rooms.findRoom = function(id) {
    var roomsArray = rooms.get('rooms'),
        room = null;
    for(var i = 0; i < roomsArray.length; i++) {
        if(roomsArray[i].get('id') == id) {
            room = roomsArray[i];
            break;
        }
    }
    return room;
  }

  return rooms;
}
