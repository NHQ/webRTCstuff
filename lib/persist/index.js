var _db = require('../db')
, model = require('../models')
, _ = require('underscore')
;

var ranDesigns = false;


module.exports = function(db){
  db = db || _db();
  var o = {
    // rooms
    getRooms:function(cb){
      db.view('rooms','getActiveRooms',function(err,data){

        console.log('get active rooms',err,data);
        if(err) return cb(err);

        var rooms = model('rooms');
        (data.rows||[]).forEach(function(room){
          rooms.data.rooms.push(model('room',room));
        });
        cb(err,rooms);

      });
    },
    setRoom:function(room,cb){
      console.log('SET ROOM CALLED ----&&&&&&&&&&&&&&');

      var pick = function(data){
        return _.pick(data,['id','director','data','title','description','active','videos','members','visitors','_rev']);
      }

      room.data.type = 'room';


      queuedInsert(db,room.getData(),'room_'+room.get('id'),function(err,data){
        console.log('SET ROOM CALLED BACK ----&&&&&&&&&&&&&&');

        if(!err) room.set('_rev',data.rev);

        room.dirty = false;
        cb(err,data);
        
        if(!err) room.emit('persisted',err,data,room.data);

      },pick);
      
    },
    getRoom:function(id,cb){
      db.get('room_'+id,function(err,data){
        if(err) return  cb(err);
        var room  = model('room',data);
        cb(null,room);
      });
    },
    // members
    getMembers:function(options,cb){
       db.view('members','getActiveMembers',function(err,data){

        console.log('get active members',err,data);
        if(err) return cb(err);

        // this returns and array for now. not a model like Rooms
        var members = [];
        (data.rows||[]).forEach(function(member){
          members.push(model('member',member));
        });
        cb(err,members);

      }); 
    },
    setMember:function(member,cb){

      var pick = function(data){ 
        return _.pick(data,['id','picture','name','data','updated','active','room','_rev']);
      };

      member.data.type = 'member';
 
      queuedInsert(db,member.getData(),'member_'+member.get('id'),function(err,data){
 
       if(err) return cb(err);// oh no.

        member.set('_rev',data.rev,true);
        member.dirty = false;

        cb(err,data);

        member.emit('persisted',err,data,member.data);

      },pick);
      
    },
    getMember:function(id,cb){

      db.get('member_'+id,function(err,data){
        if(err) return  cb(err);
        var member  = model('member',data);
        cb(null,member);
      });

    },
    cleanMembers:function(time,cb ){

    },
    // videos
    getVideos:function(options,cb){
      
    },
    setVideo:function(data,cb){
      
    },
    getVideo:function(id,cb){
      
    }
  };

  return o;
}

var insertQueue = {};
function queuedInsert(db,doc,id,cb,pick){
  console.log('queued insert!! ',id);

  var i = id.indexOf('_');
  if(i != -1){
    var type = id.substr(0,i);
    if(!insertQueue[type]) insertQueue[type] = {};
    if(!insertQueue[type][id]) insertQueue[type][id] = [];
    insertQueue[type][id].push({doc:doc,id:id,cb:cb,pick:pick});

    console.log('pushing set into the queue ',type,id);
    if(insertQueue[type][id].length != 1) return;

    var work = insertQueue[type][id][0];

    if(pick) doc = pick(doc);

    db.insert(work.doc,work.id,function(err,data){
      if(err) console.log('error persisting ',type,id,err,doc);
      if(work.cb) work.cb(err,data);
      // removed processed row.
      insertQueue[type][id].shift();

      if(insertQueue[type][id].length) {
        // remove next row and requeue it.
        var next = insertQueue[type][id].shift();

        console.log('starting next query for ',type,id);
        console.log('next params! ',next);
        queuedInsert(db,next.doc,next.id,next.cb);

      } else {
        // remove queue for this id
        delete insertQueue[type][id];
      }
    });
    return;
  }
  // i dont understand the id type just save it.
  db.insert(doc,id,cb);
}
