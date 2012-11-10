var  tako = require('tako')
, browserify = require('browserify')
, packagejson = require('./package.json')
, oppressor = require('oppressor')
, path = require('path')
;



module.exports = function(config){
  config = config||{};

  // 
  // create tako
  //
  var app = tako()

  //
  // static content
  //
  app.route('/static/*').files(path.join(__dirname, 'static'));

  //
  // shim fake index
  //
  app.route('/',function(req,res){
    res.end('yo yo homies');
  });

  //
  // add the bundle 
  //
  app.route('/client.js',function(req,res){
    var b = browserify()
    b.require(__dirname+'/client/app.js');
    out = b.bundle();
    out += ";require('./app.js')("+JSON.stringify(config.client||{})+");";
    
    var oppress = oppressor(req);
    oppress.pipe(res);
    oppress.end(out);
  });  

  app.route('/package').json(JSON.stringify(packagejson)+"\n");

  //
  //return unbound app
  //
  return app;
}
