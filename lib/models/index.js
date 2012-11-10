// model factoiry

module.exports = function(name,data){
  return require('./'+name)(data);
}
