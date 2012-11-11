var BaseModel = require('./base')
, _ = require('underscore')
;

module.exports = function(data){
  data = data||{};
  var room = new BaseModel({
    id:data.id
    ,name:data.name
    ,description:data.deescription
    ,visitors:[]
    ,members:[]
    ,videos:[]
    ,director:false
    ,server:false
    ,active:true
  });

  room.removeMember = function removeMember(memberIdToRemove) {

    this.spliceFromSet('members',memberIdToRemove);
    this.spliceFromSet('visitors',memberIdToRemove);

    if(this.get('director') == memberIdToRemove) {
      this.set('director', null);
      var members = this.get('members');
      var director;
      if(members) director = members[0];

      // director may be empty.
      room.set('director', director);
      
    }

    if(this.get('server') == memberIdToRemove) {
      this.set('server', null);

      if(members) {
        room.set('server', members[0]);
      } else {
        room.set('active',false);
      }
    }

    this.save();
  }

  room.valid = function(model,cb){
    process.nextTick(function(){
      model.data.visitors = _.uniq(model.data.visitors||[]);
      model.data.members = _.uniq(model.data.members||[]);
      cb();
    });
  }

  // optional field for room metadata
  if(data.data) room.data.data = data.data;

  room.type = 'room';

  return room;
}
