var  tako = require('tako')
, browserify = require('browserify')
, packagejson = require('./package.json')
, oppressor = require('oppressor')
, path = require('path')
, fs = require('fs')
, EventEmitter = require('events').EventEmitter
, model = require('./lib/models')
, changesbus = require('./lib/changesbus')
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
      var out = bundle('app.js','client/app.js') 
      var oppress = oppressor(req);
      oppress.pipe(res);
      oppress.end(out);
    });

    app.route('/media.js',function(req,res){
      var out = bundle('media.js','media.js') 
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

      socket.on('createroom',function(data,cb){
        var room = model('room',data);
        room.set('director',z._sockets[socket.id].id);
        room.set('members',[z._sockets[socket.id].id]);
        room.save(function(err,data){
          // generates id. not really persisted yet.
          if(cb) cb(err,data);
          if(!err) z._rooms.push('rooms',room);

        });
      });

      z.emit('connection',z._sockets[socket.id]);
    });
  };

  em.observeRooms = function(){
    var z = this;
    z._rooms.on('push',function(key,data,values){
      if(key == 'rooms') {
        
        // remove director from any current rooms.
        // emit data to
        values.forEach(function(room){
          if(room.get('id') === data.get('id')) return;
          if(room.get('director') === data.get('director')) {
            // if my director has joined another room i have to make another member the director or deactivate the room.
            var members = room.get('members');
            var director;
            members.forEach(function(id,i){
              if(id === data.get('id')) director = i
            });

            if(director !== undefined) {
              members.splice(i,1);
              //EMIT MEMBERS
              room.set('members',members);
            }
            //EMIT DIRECTOR
            room.set('director',members[0]);
            room.save();//
          }
        });

        // EMIT THE NEW ROOM
        z.sockets.emit('room',room.getData());
        
      }
      
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
  em.observeRooms();
  em.routes();
  em.sockets();

  changesbus.on('change',function(ev,model){
    console.log(ev,' on ',model.type,model.get('id'));
  });

  return em;
}


function bundle(js,module,config){
  config = config||{};
  if(!bundle.bundles) bundle.bundles = {};
  var out = bundle.bundles[js];
  if(!out){
    out = '';
    var b = browserify()
    b.require(__dirname+'/client/'+js);
    out = b.bundle();
    out += ";require('./"+module+"')("+JSON.stringify(config.client||{})+");";
    bundle.bundles[js] = out;
  }
  return out; 
}
