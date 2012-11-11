var EventEmitter = require('events').EventEmitter
;

var em = new EventEmitter();

em.watch = function(emitter){
  if(!emitter.emit && emitter.data) return;
  var emit = emitter.emit;
  emitter.emit = function(name){
    emit.apply(emitter,arguments);

    if(emitter.data.id) {
      em.emit('change',name,this);
    }

  };
};

module.exports = em;
