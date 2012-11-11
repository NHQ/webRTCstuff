var EventEmitter = require('events').EventEmitter
;

var em = new EventEmitter();

em.watch = function(emitter){
  if(!emitter.emit && emitter.data) return;
  var emit = emitter.emit;
  emitter.emit = function(name){
    emit.apply(emitter,arguments);

    if(emitter.data.id) {
      var model = this;
      // give the code a chance to clear the dirty flag. for set in a save.
      process.nextTick(function(){
        em.emit('change',name,model);
      });
    }
  };
};

module.exports = em;
