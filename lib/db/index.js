var nano = require('nano')
, crypto = require('crypto')
, config = require('../config.js')
, hash = crypto.createHash('md5')
;

// hash so dev can use a different db on live server.
hash.update(__dirname);
hash = hash.digest('hex');

var created = {};

module.exports = function(opts){

  var cnf = config.env;
  if(!cnf.couch) {
    cnf = config.production.couch;
    cnf.db = hash+'_'+(cnf.db||'somethingclever');
  } else {
    cnf = cnf.couch;
  }

  opts = opts||cnf

  var server = nano(opts.url)
  , db = server.use(opts.db)
  ;
  // just in case
  if(!created[opts.db]){
    server.db.create(opts.db);
    created[opts.db] = true;
  }

  return db;
}


