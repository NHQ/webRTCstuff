var db = require('../db')()
, package = require("../../package.json")
, semver = require('semver')
;

module.exports = function(cb){

  cb = cb || function(){};

  var o = {
    designRooms:function(cb){
      var json = require('../../package.json');
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

      console.log('DESIGN DOC ',des);

      if(des) design._rev = des._rev;

      db.insert(design,id,function(err,data){
        if(cb) cb(err,data);
      });
    });
  }

};
