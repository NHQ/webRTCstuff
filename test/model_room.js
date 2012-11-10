var test = require('tap').test
, roomer = require('../lib/models/room.js')
;

test('can make room',function(t){
  t.plan(4);
  var room = roomer();
  room.on('set',function(key){
    // this gets called twice. once for the id on save and once for the title set.
    t.ok(key,'set was called on '+key);
  });

  room.set('title','a room');
  t.equals(room.get('title'),'a room','set title should be correct');
  room.save(function(){
    t.ok(room.get('id'),'saved object should have id');
    t.end();
  })
})
