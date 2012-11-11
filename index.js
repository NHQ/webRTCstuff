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
    z.app.sockets.on('connection', function(socket) {

      z._sockets[socket.id] = model('socket',{socket:socket});
      z._sockets[socket.id].set('member', model('member'));
      z._sockets[socket.id].save(function(err,data) {
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

      socket.on('join_room', function(data, cb) {
        var room = z._rooms.findRoom(data.id),
            newMemberId = z._sockets[socket.id].get('id');
        if(room) {
          room.push('members', newMemberId);
          if(!room.get('director')) {
            room.set('director', newMemberId);
          }
          if(!room.get('server')) {
            room.set('server', newMemberId);
          }
          room.save();

          // Update the user's room.
          z._sockets[socket.id].set('room', room.get('id'));

          console.log('Added user to existing room: ', room);
        } else {
          room = z.createRoom(socket, data, cb);

          console.log('Added user to new room: ', room);
        }

        // Tell the current video server user about the new user, if that isn't the new user.
        var currentRoomServer = room.get('server');
        if(currentRoomServer != newMemberId) {
          var roomServerSocket = z.getSocketBySocketMemberId(currentRoomServer);
          if(roomServerSocket !== null) {
            roomServerSocket.get('socket').emit('start_server', {connectionIds: [newMemberId]});
          }
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

      socket.on('server_ready', function(data, cb) {
        console.log('server_ready', data);

        // This means a video server client has prepared the PeerConnections for the rest of the room users.
        var socketRoom = z._rooms.findRoom(z._sockets[socket.id].get('room'));
        if(socketRoom) {
          var serverMemberId = z._sockets[socket.id].get('id');
          socketRoom.get('members').forEach(function(memberId) {
            if(memberId != serverMemberId) {
              var memberSocket = z.getSocketBySocketMemberId(memberId);
              if(memberSocket !== null) {
                memberSocket.get('socket').emit('switch_to_server', {id: serverMemberId});
              }
            }
          });
        }
      });

      socket.on('offer', function(data, cb) {
        console.log('offer', data);

        // Forward an offer from this client to the current server user for this client's room.
        var socketRoom = z._rooms.findRoom(z._sockets[socket.id].get('room'));
        if(socketRoom) {
          var memberId = z._sockets[socket.id].get('id'),
              serverMemberId = socketRoom.get('server'),
              serverMemberSocket = z.getSocketBySocketMemberId(serverMemberId);
          if(memberId != serverMemberId && serverMemberSocket !== null) {
            // Augment the data with the id of the member the offer came from, 
            // so the server can associate it with a connection.
            data.connectionId = memberId;
            serverMemberSocket.get('socket').emit('offer', data);
          }
        }
      });

      socket.on('answer', function(data, cb) {
        console.log('answer', data);

        // Forward an answer from this server to the designated recipient.
        if(data.connectionId) {
          var clientSocket = z.getSocketBySocketMemberId(data.connectionId);
          if(clientSocket !== null) {
            delete data.connectionId;
            clientSocket.get('socket').emit('answer', data);
          }
        }
      });

      socket.on('candidate', function(data, cb) {
        console.log('candidate', data);

        // Forward candidate messages to the appropriate recipient.
        var socketRoom = z._rooms.findRoom(z._sockets[socket.id].get('room'));
        if(socketRoom) {
          var serverMemberId = socketRoom.get('server');
          if(serverMemberId) {
            var socketMemberId = z._sockets[socket.id].get('id');
            if(serverMemberId == socketMemberId) {
              var clientSocket = z.getSocketBySocketMemberId(data.connectionId);
              if(clientSocket !== null) {
                delete data.connectionId;
                clientSocket.get('socket').emit('candidate', data);
              }
            } else if(serverMemberId != socketMemberId) {
              var serverSocket = z.getSocketBySocketMemberId(serverMemberId);
              if(serverSocket !== null) {
                data.connectionId = socketMemberId;
                serverSocket.get('socket').emit('candidate', data);
              }
            }
          }
        }
      });

      z.emit('connection', z._sockets[socket.id]);
    });
  };

  em.getSocketBySocketMemberId = function(socketMemberId) {
    var socket = null;
    for(var socketId in em._sockets) {
      if(socketMemberId == em._sockets[socketId].get('id')) {
        socket = em._sockets[socketId];
      }
    }
    return socket;
  };

  em.createRoom = function(socket, data, cb) {
    var room = model('room', data),
        socketModel = em._sockets[socket.id];

    room.set('director', socketModel.get('id'));
    room.set('server', socketModel.get('id'));
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

  changesbus.on('change',function(ev,model){
    //console.log(ev,' on ',model.type,model.get('id'));
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
