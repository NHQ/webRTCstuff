var _db = require('../db')
, model = require('../models')
, _ = require('underscore')
, designs = require('./designs')
;

var ranDesigns = false;


module.exports = function(db){
  db = db || _db();
  var o = {
    // rooms
    getRooms:function(options,cb){
            
    },
    setRoom:function(room,cb){
      var data = room; 
      if(data.getData) data = data.getData(); 

      var doc = _.pick(data,['director','data','title','description','active','videos','_rev']);
      
      db.insert(data,'room_'+data.id,function(err,data){
        room.set('_rev',data.rev);
        cb(err,data);
        if(room.emit) room.emit('persisted',err,data,doc);
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
      
    },
    setMember:function(){
      
    },
    getMember:function(id){
      
    },
    // videos
    getVideos:function(options,cb){
      
    },
    setVideo:function(data,cb){
      
    },
    getVideo:function(id,cb){
      
    }
  };

  if(!ranDesigns){
    designs();
  }

  return o;
}



