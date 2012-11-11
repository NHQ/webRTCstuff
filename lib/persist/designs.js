var db = require('../db')()
,_ = require('underscore')
;

module.exports = function(cb){

  cb = cb || function(){};

  var o = {
    designRooms:function(cb){
      var design = {
        language:"javascript"
        ,views:{
          getRooms:{
            map:"function(doc) { if (doc._id.indexOf('room_') === 0)  emit(null, doc) }"
          }
          ,getActiveRooms:{
            map:"function(doc) { if (doc._id.indexOf('room_') === 0 && doc.active)  emit(null, doc) }"
          }
        }
      };

      upsertDesign('rooms',design,cb);
    },
    designMembers:function(cb){
      var design = {
        language:"javascript"
        ,views:{
          getMembers:{
            map:"function(doc) { if (doc._id.indexOf('member_') === 0)  emit(null, doc) }"
          }
          ,getActiveMembers:{
            map:"function(doc) { if (doc._id.indexOf('members_') === 0 && doc.active)  emit(null, doc) }"
          }
        }
      };

      upsertDesign('members',design,cb);
    },
    designVideos:function(cb){
      var design = {
        language:"javascript"
        ,views:{
          getVideos:{
            map:"function(doc) { if (doc._id.indexOf('videos_') === 0)  emit(null, doc) }"
          }
          ,getCompleteVideos:{
            map:"function(doc) { if (doc._id.indexOf('videos_') === 0 && doc.active)  emit(null, doc) }"
          }
        }
      };

      upsertDesign('videos',design,cb);
    }
  };

  var c = 0;
  Object.keys(o).forEach(function(m){
    c++;
    o[m](function(err,data){
      if(err) {
        cb(err);
        cb = function(){};
      }
      c--;
      if(!c) cb();
    });
  });

  function upsertDesign(id,design,cb) {
    id = '_design/'+id;
    db.get(id,function(err,des){


      if(des){
        var cpy = _.extend({},des);
        delete cpy._id;
        delete cpy._rev;
        var current =JSON.stringify(cpy);
        var local = JSON.stringify(design);
        if(current === local) {
          console.log('design doc ',id,'up to date')
          return cb(null,des);
        }
      }

      if(des) design._rev = des._rev;

      db.insert(design,id,function(err,data){
        if(!err) console.log('design doc ',id,des?'created':'updated');
        if(cb) cb(err,data);
      });
    });
  }

};
