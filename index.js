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

  //
  //return unbound app
  //
  return app;
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
    out += ";require('./'"+js+")("+JSON.stringify(config.client||{})+");";
    bundle.bundles[js] = out;
  }
  return out; 
}
