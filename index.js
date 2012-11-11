var  tako = require('tako')
, browserify = require('browserify')
, packagejson = require('./package.json')
, oppressor = require('oppressor')
, path = require('path')
, fs = require('fs')
, EventEmitter = require('events').EventEmitter
, persist = require('./lib/persist')()
, model = require('./lib/models')
, changesbus = require('./lib/changesbus')
, cookie = require('cookie')
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
    z.app.sockets.manager.settings['authorization'] = function(data,cb){
      console.log('handshake data ',data);
      cb(null,true);
    }; 

    z.app.sockets.on('connection', function(socket) {

      z._sockets[socket.id] = model('socket',{socket:socket});
      z._sockets[socket.id].set('member', model('member'));
      z._sockets[socket.id].save(function(err,data) {
        console.log('emitting the ')

        socket.emit('id', data.id);
        // Prompt them to join a room.
        if(!z._sockets[socket.id].get('room')) {
          socket.emit('choose_room');
        }
      });

      socket.on('disconnect', function() {
        z.emit('disconnect', socket.id);

        var socketRoomId = z._sockets[socket.id].get('room');
        if(socketRoomId) {
          var room = z._rooms.findRoom(socketRoomId);
          if(room) {
            var memberIdToRemove = z._sockets[socket.id].get('id');
            room.removeMember(memberIdToRemove);

            // Let everyone else in the room know to remove this member.
            for(var socketId in z._sockets) {
              if(z._sockets[socketId].get('room') == room.get('id')) {
                z._sockets[socketId].get('socket').emit('remove_member', {id: memberIdToRemove});
              }
            }
          }
        }

        delete z._sockets[socket.id];
      });

      socket.on('get_rooms',function(cb){
        if(!cb || !cb.call) return;
        
      });

      socket.on('create_room', function(data, cb) {
        var room = z.createRoom(socket, data, cb);
        socket.emit('add_member', {id: z._sockets[socket.id].get('id')});
      });

      socket.on('join_room', function(data, cb) {
        var room = z._rooms.findRoom(data.id),
            newMemberId = z._sockets[socket.id].get('id');
        if(room) {
          room.push('members', newMemberId);
          if(room.get('director') === undefined) {
            room.set('director', z._sockets[socket.id].get('id'));
          }
          room.save();

          // Update the user's room.
          z._sockets[socket.id].set('room', room.get('id'));

          console.log('Added user to existing room: ', room);
        } else {
          room = z.createRoom(socket, data, cb);

          console.log('Added user to new room: ', room);
        }

        // Let the new user know about everyone.
        room.get('members').forEach(function(memberId) {
          socket.emit('add_member', {id: memberId});
        });
        // Let the existing users each know about the new user.
        for(var socketId in z._sockets) {
          if(z._sockets[socketId].get('room') == room.get('id')) {
            z._sockets[socketId].get('socket').emit('add_member', {id: newMemberId});
          }
        }
      });

      z.emit('connection', z._sockets[socket.id]);
    });
  };

  em.createRoom = function(socket, data, cb) {
    var room = model('room', data),
        socketModel = em._sockets[socket.id];

    room.set('director', socketModel.get('id'));
    room.set('members', [socketModel.get('id')]);

    room.save(function(err, data) {
      if(cb) {
        cb(err,data);
      }
      if(!err) {
        em._rooms.push('rooms', room);

        // Remove director from any current rooms.
        em._rooms.get('rooms').forEach(function(otherRoom) {
          if(room.get('id') === otherRoom.get('id')) {
            return;
          }

          if(room.get('director') === otherRoom.get('director')) {
            otherRoom.removeMember(otherRoom.get('director'));
          }
        });
      }
    });

    // Update the socket's current room.
    socketModel.set('room', room.get('id'));

    return room;
  };

  em.observeSelf = function(){
    var z = this;
    z.on('disconnect', function() {
      console.log('socket disconnected');
    });
  };

  em.loadRooms = function(cb){
    persist.getRooms(function(err,data){
      em._rooms = data?data:model('rooms');
      cb(err,data);
    });
  }

  //
  // listen. 
  //
  em.listen = function(port,cb){
    app.httpServer.listen(port,cb);
  };

  em.app = app;
  em.observeSelf();
  em.routes();

  em.loadRooms(function(){
    console.log('loaded rooms.');
    em.sockets();
  });


  // room inactive
  // member left
  // room changed
  //
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
