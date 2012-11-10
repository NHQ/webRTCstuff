var  tako = require('tako')
, browserify = require('browserify')
, packagejson = require('./package.json')
, oppressor = require('oppressor')
, path = require('path')
, EventEmitter = require('events').EventEmitter
;



module.exports = function(config){

  var em = new EventEmitter();
  
  config = config||{};

  em.routes = function(){
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
      var out = bundle('app.js') 
      var oppress = oppressor(req);
      oppress.pipe(res);
      oppress.end(out);

    });

    app.route('/media.js',function(req,res){
      var out = bundle('media') 
      var oppress = oppressor(req);
      oppress.pipe(res);
      oppress.end(out);
    });

    app.route('/package').json(JSON.stringify(packagejson)+"\n");
  };

  em.listen = function(port,cb){
    app.httpServer.listen(port,cb);
  };

  em.app = app;
  em.routes();

  return em;
}


function bundle(js,config){
  config = config||{};
  if(!bundle.bundles) bundle.bundles = {};
  var out = bundle.bundles[js];
  if(!out){
    out = '';
    var b = browserify()
    b.require(__dirname+'/client/'+js);
    out = b.bundle();
    out += ";require('./"+js+"')("+JSON.stringify(config.client||{})+");";
    bundle.bundles[js] = out;
  }
  return out; 
}
