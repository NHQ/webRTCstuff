var EventEmitter = require('events').EventEmitter
, uuid = require('node-uuid')
, util = require('util')
;


module.exports = BaseModel;

function BaseModel(data){
  this.data = data;
}

util.inherits(BaseModel,EventEmitter);

var pr = BaseModel.prototype;
pr.getData = function(){
  return this.data;
}

pr.set = function(key,value){
  this.emit('setbefore',{key:key,value:value});
  this.data[key] = value;
  this.emit('set',key,value);
  return key;
}

pr.get = function(key){
  return this.data[key];
}

pr.push = function(key,value){
  var v = this.get(key);
  if(v === undefined) this.set(key,[]);
  if(v.push) {
    this.emit('pushbefore',{key:key,value:value,array:v});
    v.push(value);
    this.emit('push',key,value,v);
    return true;
  }
  return false;
}


pr.save = function(cb){

  this.emit('savebefore',this.data);
  var z = this; 
  z.valid(z,function(err){
    if(err) {
      z.emit('saveinvalid',err);
      return cb(err);
    }
    if(!z.get('id')) {
      z.set('id', z._id());
    }
    z.emit('save',z.data);
    if(cb) cb(null,z.data);
  });
}

pr.valid = function(z,cb){
  process.nextTick(function(){
    cb();
  });
}

pr.delete = function(cb){
  var z = this;
  process.nextTick(function(){
    z.emit('delete',z.data.id,z.data);
    z.data.id = null;
    if(cb) cb();
  });

}

pr._id = function(){
  return uuid.v4();
}

