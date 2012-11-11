var BaseModel = require('./base')
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
  });

  room.removeMember = function removeMember(memberIdToRemove) {
    var memberIndex;
    this.get('members').forEach(function(memberId, i) {
      if(memberId === memberIdToRemove) {
        memberIndex = i;
      }
    });

    if(memberIndex !== undefined) {
      var members = this.get('members');
      members.splice(memberIndex, 1);
      this.set('members', members);
    }

    if(this.get('director') == memberIdToRemove) {
      this.set('director', null);

      if(members) {
        room.set('director', members[0]);
      }
    }

    if(this.get('server') == memberIdToRemove) {
      this.set('server', null);

      if(members) {
        room.set('server', members[0]);
      }
    }

    this.save();
  }

  // optional field for room metadata
  if(data.data) room.data.data = data.data;

  room.type = 'room';

  return room;
}
