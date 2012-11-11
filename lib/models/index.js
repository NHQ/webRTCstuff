// model factory
var changes = require('../changesbus')

module.exports = function(name,data){
  var model = require('./'+name)(data);

  // support passing the couchdb rev
  if(data && data._rev) model.data._rev = data._rev;

  changes.watch(model);
  return model;
}
