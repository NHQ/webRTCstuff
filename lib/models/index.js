// model factory
var changes = require('../changesbus')

module.exports = function(name,data){
  var model = require('./'+name)(data);
  changes.watch(model);
  return model;
}
