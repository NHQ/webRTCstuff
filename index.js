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
, _ = require('underscore')
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
      var out = bundle('app.js','client/app.js');
      res.setHeader('Content-Type','text/javascript'); 
      res.setHeader('Expires',(new Date(0)).toString());

      var oppress = oppressor(req);
      oppress.pipe(res);
      oppress.end(out);
    });

    app.route('/media.js',function(req,res){
      var out = bundle('media.js','media.js'); 
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

      var memberid;
      if(data.headers.cookie){
        var cookies = cookie.parse(data.headers.cookie);
        memberid = cookies['clever-sid'];
      }

      persist.getMember(memberid,function(err,member){
        if(err && err.status_code != 404) console.log('PERSIST error getMemberById ',err);
        if(member) {
          // can check if another socket is still this person
          data.member = member;
          member.set('updated',Date.now());
          return cb(null,true);
        }

        member = model('member');
        member.save(function(err,model){
          if(err) return cb('sorry we had an issue generating a new membership',false)

          console.log(member,model);
          data.member = member;
          cb(null,true);

        });

      });
    }; 

    z.app.sockets.on('connection', function(socket) {

		socket.on('laffs', function(){
			socket.broadcast.emit('laffs')
		});
		socket.on('horn', function(){
			socket.broadcast.emit('horn')
		});
		socket.on('applause', function(){
			socket.broadcast.emit('applause')
		});

      z._sockets[socket.id] = model('socket',{socket:socket});
      z._sockets[socket.id].set('member', socket.handshake.member);
      // set the inital room to be the last room this member was in
      z._sockets[socket.id].set('room',socket.handshake.member.get('room'));

      z._sockets[socket.id].save(function(err,data) {
        var socketStateData = z.getSocketsData();
        var roomStateData = modelData(z._rooms.get('rooms'));

        console.log('67646535555555555%%%%%%%%%%%%%%%%% ',roomStateData.length,roomStateData);

        if(roomStateData.length > 50) {
          roomStateData = roomStateData.slice(roomStateData.length-50);
        }
        socket.emit('connected', {rooms:roomStateData,sockets:socketStateData,id:socket.handshake.member.get('id'),member:socket.handshake.member.getData()});

        // Prompt them to join a room / rejoin the last room they were in.
        var oldRoom = z._sockets[socket.id].get('room')||false;
        socket.emit('choose_room',{room:oldRoom});

      });

      socket.on('disconnect', function() {
        z.emit('disconnect', socket.id);

        var socketRoomId = z._sockets[socket.id].get('room');
        if(socketRoomId) {

          var room = z._rooms.findRoom(socketRoomId);
          if(room) {

            var memberModel = z._sockets[socket.id].get('member') 
            , memberIdToRemove = memberModel.get('id')
            , previousServerMemberId = room.get('server')
            , newServerMemberId
            ;

            room.removeMember(memberIdToRemove);
            newServerMemberId = room.get('server');

            // The member removed was the server. Let the new server member know to start streaming for everyone else.
            if(newServerMemberId && newServerMemberId != previousServerMemberId) {
              z.changeFeedSource(newServerMemberId);
            }

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

      socket.on('choose_feed_source', function(data, cb) {
        z.changeFeedSource(data.connectionId);
      });

      // a client wants to refetch rooms.
      socket.on('get_rooms',function(cb){
        if(!cb || !cb.call) return;
        cb(null,modelData(z._rooms.get('rooms')));
      });

      
      socket.on('create_room', function(data, cb) {


        z.createRoom(socket, data, function(err,data){
          if(err) return cb(err+' failed to create room.');
          var soc = em._socketData(z._sockets[socket.id]);
          socket.emit('add_member', {id:soc.member.id,socket:soc});
        });
      });

      socket.on('join_room', function(data, cb) {

        var room = z._rooms.findRoom(data.id)
        , newMemberId = z._sockets[socket.id].get('member').get('id')
        ;


        var gotRoom = function(room){
          console.log('gotRoom called with ',room);
          // Tell the current video server user about the new user, if that isn't the new user.
          var currentRoomServer = room.get('server');

          console.log('CURRENT ROOOM SERVER ',currentRoomServer,newMemberId);

          if(currentRoomServer != newMemberId) {
            var roomServerSocket = z.getSocketBySocketMemberId(currentRoomServer);
            if(roomServerSocket !== null) {
              roomServerSocket.get('socket').emit('start_server', {connectionIds: [newMemberId]});
            }
          }

          // Let the new user know about everyone.
          console.log('GET MEMBERS!!! ',room.get('members'));

          room.get('members').forEach(function(memberId) {
            var s = z.getSocketBySocketMemberId(memberId);
            var soc = em._socketData(s);
            console.log('add_member',soc.member.id);
            socket.emit('add_member', {id:soc.member.id,socket:soc});
          });

          // Let the existing users each know about the new user.
          var mySocInfo = em._socketData(z._sockets[socket.id]);

          for(var socketId in z._sockets) {
            if(z._sockets[socketId].get('room') == room.get('id')) {

              z._sockets[socketId].get('socket').emit('add_member', {id:mySocInfo.member.id,socket:mySocInfo});

            }
          }

          if(cb) cb(null,room);
        };
        if(room) {

          room.push('members', newMemberId);
          if(!room.get('director')) {
            room.set('director', newMemberId);
          }

          if(!room.get('server')) {
            room.set('server', newMemberId);
          }

          // Update the user's room.
          z._sockets[socket.id].set('room', room.get('id'));
          z._sockets[socket.id].get('member').set('room', room.get('id'));

          console.log('Added user to existing room: ', room);

          gotRoom(room);

        } else {
          console.log('im going ot create a room')
          z.createRoom(socket, {director:newMemberId,server:newMemberId,title:data.title||data.name,description:data.description}, function(err,room){

            console.log('Added user to new room: ', room);
            if(err) cb(err+' failed to create room to join.');
            gotRoom(room);

          });
        }
        
      });

      socket.on('server_ready', function(data, cb) {
        console.log('server_ready', data);

        // This means a video server client has prepared the PeerConnections for the rest of the room users.
        if(data.connectionIds) {
          var socketRoom = z._rooms.findRoom(z._sockets[socket.id].get('room'));
          if(socketRoom) {

            var serverMemberId = z._sockets[socket.id].get('member').get('id');
            socketRoom.get('members').forEach(function(memberId) {
              if(memberId != serverMemberId) {
                var inReadyConnections = false;
                for(var i = 0; i < data.connectionIds.length; i++) {
                  if(data.connectionIds[i] == memberId) {
                    inReadyConnections = true;
                    break;
                  }
                }
                if(inReadyConnections) {
                  var memberSocket = z.getSocketBySocketMemberId(memberId);
                  if(memberSocket !== null) {
                    memberSocket.get('socket').emit('switch_to_server', {id: serverMemberId});
                  }
                }
              }
            });
          }
        }
      });

      socket.on('offer', function(data, cb) {
        console.log('offer', data);

        // Forward an offer from this client to the current server user for this client's room.
        var socketRoom = z._rooms.findRoom(z._sockets[socket.id].get('room'));
        if(socketRoom) {
          var memberId = z._sockets[socket.id].get('member').get('id'),
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
            var socketMemberId = z._sockets[socket.id].get('member').get('id');

            console.log(serverMemberId,'< server member id: socket member id>',socketMemberId,'connection id',data.connectionId);
          
            if(serverMemberId == socketMemberId) {
              var clientSocket = z.getSocketBySocketMemberId(data.connectionId);
              console.log('have client socket? ',clientSocket);
              if(clientSocket !== null) {
                delete data.connectionId;
                clientSocket.get('socket').emit('candidate', data);
              }
            } else if(serverMemberId != socketMemberId) {
              var serverSocket = z.getSocketBySocketMemberId(serverMemberId);

              console.log('have server!!! socket? ',serverSocket);

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
      if(socketMemberId == em._sockets[socketId].get('member').get('id')) {
        socket = em._sockets[socketId];
      }
    }

    console.log('found socket ',socket,'for member id ',socketMemberId);

    return socket;
  };

  em.getSocketsData = function(){
    var data = [];
    for(var socketId in em._sockets) { 
      data.push(em._socketData(em._sockets[socketId]));
    } 
    return data; 
  }

  em._socketData = function(socket){
    var soc = _.extend({},socket.getData());
    soc.member = _.extend({},soc.member.getData());
    delete soc.socket;

    return soc;
  }

  em.createRoom = function(socket, data, cb) {
    // IF ID IS provided look it up. dont just let anyone insert crazy ids.
    //if(data.id && data.id.indexOf('room_') !== 0) {
    //  delete data.id;
    //}

    var room = model('room', data)
    , socketModel = em._sockets[socket.id]
    , memberModel = socketModel.get('member')
    ;

    room.set('director', memberModel.get('id'));
    room.set('server', memberModel.get('id'));
    room.set('members', [memberModel.get('id')]);

    console.log('ABOUT TO ROOM SAVE!!!');

    room.save(function(err, data) {

      //console.log('ROOM AVE CALLED BACK!! ',err,data);

      if(cb) {
        cb(err,room);
      }
      if(err) return;

      em._rooms.push('rooms', room);

      em._rooms.get('rooms').forEach(function(otherRoom) {

        if(room.get('id') === otherRoom.get('id')) {
          return;
        }

        // Remove director from any current rooms.
        if(room.get('director') === otherRoom.get('director')) {
          otherRoom.removeMember(otherRoom.get('director'));
        }

      });
      
      // Update the socket's current room.
      socketModel.set('room', room.get('id'));
      memberModel.set('room',room.get('id'));
    });

  };

  em.changeFeedSource = function(newServerMemberId) {
    var newServerMemberSocket = em.getSocketBySocketMemberId(newServerMemberId);
    if(newServerMemberSocket !== null) {
      var roomId = newServerMemberSocket.get('member').get('room'),
          room = em._rooms.findRoom(roomId);
      if(room) {
        room.set('server', newServerMemberId);

        var roomMembers = room.get('members'),
            membersExceptNewServer = [];
        for(var i = 0; i < roomMembers.length; i++) {
          if(roomMembers[i] != newServerMemberId) {
            membersExceptNewServer.push(roomMembers[i]);
          }
        }
        console.log("Changing feed source for " + room.get('id') + " to " + newServerMemberId);
        newServerMemberSocket.get('socket').emit('start_server', {connectionIds: membersExceptNewServer});
      }
    }
  };

//TODO -----------
  em.visitRoom = function(socket,data,cb){
    var socketModel = em._sockets[socket.id]
    , memberModel = socketModel.get('member')
    , currentRoomId = socketModel.get('room')||memberModel.get('room')
    , roomId = data.id
    ;

    z._rooms.forEach(function(r){

    });
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
  var updating = {};
  changesbus.on('change',function(ev,model){
    var id = model.get('id');
    var type = model.type;

    //console.log("P: ",ev,' on ',type,id);
    if(!model.dirty) {
        //console.log('the model is not dirty!');
        return;
    }
    if(!model.get('id')) {

      //console.log('the model has no id!');
      console.log("P: ",model.type,' has no object id yet.');
      return;
    }

    if(type == 'member') {
      if(ev == 'set') {
        persist.setMember(model,function(err,data){
          // member was updated?
          if(err) console.log('P: MEMBER persisted ',id,err);//,data);
        });
      }
    } else if(type == 'room'){

      //console.log('stype is room!!');
      if(ev == 'push' || ev == 'set' || ev == 'save') {
        
        persist.setRoom(model,function(err,data){
          // member was updated?
          if(err) console.log('P: room persisted ',id,err,data);
        });
      }     
    }
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

// dump an array of model's data objects
function modelData(models){
  return models.map(function(model){
    return model.getData();
  });
}
