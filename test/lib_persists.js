var test = require('tap').test
, persist = require('../lib/persist')()
, model = require('../lib/models')
;

test("persist can update room",function(t){
  var room = model('room',{id:'test',title:'a title',description:'yay',director:Date.now()});
  persist.getRoom(room.get('id'),function (err,_room) {
    if(_room) room = _room;

    room.data.director = Date.now();
    room.data.active = 0;

    persist.setRoom(room,function (err,data){

      t.ok(!err,'should not get error update/inserting');
      t.end();

    });
  });
});


