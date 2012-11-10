var  tako = require('tako')
, browserify = require('browserify')
, packagejson = require('./package.json')
, oppressor = require('oppressor')
, path = require('path')
, fs = require('fs')
, EventEmitter = require('events').EventEmitter
, model = require('./lib/models')
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
      var out = bundle('media.js') 
      var oppress = oppressor(req);
      oppress.pipe(res);
      oppress.end(out);
    });

    app.route('/package').json(JSON.stringify(packagejson)+"\n");
  };

  em._sockets = {};
  em._rooms = model('rooms');

  em.sockets = function(){
    var z = this;
    z.app.sockets.manager.settings['log level'] = 2; 
    z.app.sockets.on('connection',function(socket){
      console.log('client connected! ',socket.id);

      // new socket object.
      z._sockets[socket.id] = model('socket',{socket:socket});
      // new member object.
      z._sockets[socket.id].set('member',model('member'));
      z._sockets[socket.id].save(function(err,data){
        // who am i.
        socket.emit('id',data.id);
      });

      socket.on('disconnect',function(){
        z.emit('disconnect',socket.id);
        delete z.sockets[socket.id];
      });

      z.emit('connection',z._sockets[socket.id]);
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
    out += ";require('./client/"+js+"')("+JSON.stringify(config.client||{})+");";
    bundle.bundles[js] = out;
  }
  return out; 
}
