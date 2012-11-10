var  tako = require('tako')
, browserify = require('browserify')
, packagejson = require('./package.json')
, oppressor = require('oppressor')
, path = require('path')
, fs = require('fs')
, EventEmitter = require('events').EventEmitter
;



module.exports = function(config){

  var em = new EventEmitter();
  
  config = config||{};

  // 
  // create tako
  //
  var app = tako()

  em.routes = function(){

    //
    // static content
    //
    app.route('/static/*').files(path.join(__dirname, 'static'));

    //
    // shim fake index
    //
    var index = fs.readFileSync('./static/index.html');
    app.route('/').html(index);

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

  em.sockets = {};
  
  em.sockets = function(){
    var z = this;
    z.app.sockets.manager.settings['log level'] = 2; 
    z.app.sockets.on('connection',function(socket){
      console.log('client connected! ',socket.id);

      z.sockets[socket.id] = socket;
      
      socket.on('disconnect',function(){
        z.emit('disconnect',socket.id);
        delete z.sockets[socket.id];
      });

      // who am i.
      socket.emit('id',id);

      z.emit('connection',socket);
    });
  };

  em.observeSelf = function(){
    var z = this;
    z.on('disconnect',function(){
      //z.app.socketsbroadcast('logout')
      console.log('socket disconnected');
    });
  };

  //
  // listen. 
  //
  em.listen = function(port,cb){
    app.httpServer.listen(port,cb);
  };

  em.app = app;
  em.observeSelf();
  em.routes();
  em.sockets();

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
