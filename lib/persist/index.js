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

      var doc = _.pick(room.getData(),['id','director','data','title','description','active','videos','_rev']);
      doc.type = 'room';
      db.insert(doc,'room_'+room.get('id'),function(err,data){

        console.log(data);

        room.set('_rev',data.rev);
        cb(err,data);
        room.emit('persisted',err,data,doc);

      });
      
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
 
      var doc = _.pick(member.getData(),['id','picture','name','data','updated','active','_rev']);

      doc.type = 'member';
 
      db.insert(doc,'member_'+member.get('id'),function(err,data){
 
       if(err) return cb(err);// oh no.

        member.set('_rev',data.rev,true);
        member.dirty = false;

        cb(err,data);

        member.emit('persisted',err,data,doc);

      });
      
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



