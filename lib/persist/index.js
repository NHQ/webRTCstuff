var _db = require('../db')
, model = require('../models')
, _ = require('underscore')
;



module.exports = function(db){
  db = db || _db();
  return {
    // rooms
    getRooms:function(options,cb){
            
    },
    setRoom:function(room,cb){
      var data = room; 
      if(data.getData) data = data.getData(); 

      var doc = _.pick(data,['director','data','title','description','active','videos']);
      
      db.insert(data,'room_'+data.id,function(err,data){
        cb(err,data);
        if(room.emit) room.emit('persisted',err,data,doc);
      });
      
    },
    getRoom:function(id,cb){
      
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
  }
}

