var serverPeerConnections = {},
ui = require('./ui'),
clientPeerConnection = null,
members = {},
localStream = null,
currentRoom = 'chris';

module.exports = function(socket){


  socket.on('connected',function(data){
    console.log('CONNECTED DATA',data);
    currentRoom = (data.rooms[0]||{}).id
  });

  /*
   * Members list.
   */

  function updateMembersList() {
      var membersListHtml = '<ul>';
      for(var memberId in members) {
          membersListHtml += '<li>' + memberId + '</li>';
      }
      membersListHtml += '</ul>';

//      document.getElementById('members-list').innerHTML = membersListHtml;
  }

  socket.on('add_member', function handleAddUser(data) {
		console.log(data)
      if(!members[data.id]) {
          members[data.id] = true;
          ui.addPlayer(data)
      }
  });

  socket.on('remove_member', function removeUser(data) {
      if(serverPeerConnections[data.id]) {
          delete serverPeerConnections[data.id];
      }
      if(members[data.id]) {
          delete members[data.id];
          updateMembersList();
      }
  });

  socket.on('choose_room', function handleChooseRoom(data) {
      members = [];
      updateMembersList();

      
      //if(currentRoom) {
          socket.emit('join_room', {id: currentRoom});
      //}
  });

  /*
   * Video streaming.
   */

  socket.on('start_server', function handleBecomeServer(data) {
      console.log('Got start_server.');

      if(clientPeerConnection) {
          serverPeerConnections = {};
          clientPeerConnection = null;
      }

      if(data && data.connectionIds) {
          for(var i = 0; i < data.connectionIds.length; i++) {
              var connectionId = data.connectionIds[i];
              serverPeerConnections[connectionId] = createPeerConnection(connectionId);
              if(localStream) {
                  serverPeerConnections[connectionId].addStream(localStream);
              }
          }
      }

      document.getElementById('midscreen').src = webkitURL.createObjectURL(localStream);
      document.getElementById('bigscreen').src = webkitURL.createObjectURL(localStream);

      socket.emit('server_ready', {
          'connectionIds': data.connectionIds
      });
  });

	socket.on('add_stream', function handleSwitchToServer(data) {
//	  var user = _CAST.map(data.id)
      clientPeerConnection = createPeerConnection();
      clientPeerConnection.onaddstream = function(event) {
          document.getElementById('midscreen').src = webkitURL.createObjectURL(event.stream);
          document.getElementById('bigscreen').src = webkitURL.createObjectURL(event.stream);
      };

      clientPeerConnection.createOffer(function onCreateOffer(sessionDescription) {
          clientPeerConnection.setLocalDescription(sessionDescription);
          socket.emit('offer', sessionDescription);
      }, null, {"has_video": true, "has_audio": true});
  });

  socket.on('switch_to_server', function handleSwitchToServer(data) {
      data = data;

      serverPeerConnections = {};
      clientPeerConnection = createPeerConnection(data.id);
      clientPeerConnection.onaddstream = function(event) {
          console.log('Got onaddstream.');
          document.getElementById('midscreen').src = webkitURL.createObjectURL(event.stream);
          document.getElementById('bigscreen').src = webkitURL.createObjectURL(event.stream);
      };

      clientPeerConnection.createOffer(function onCreateOffer(sessionDescription) {
          clientPeerConnection.setLocalDescription(sessionDescription);
          socket.emit('offer', sessionDescription);
      }, null, {"has_video": true, "has_audio": true});
  });

  socket.on('offer', function handleOffer(data) {
      if(data.connectionId && serverPeerConnections[data.connectionId]) {
          serverPeerConnections[data.connectionId].setRemoteDescription(new RTCSessionDescription(data));
          serverPeerConnections[data.connectionId].createAnswer(function onCreateAnswer(sessionDescription) {
              serverPeerConnections[data.connectionId].setLocalDescription(sessionDescription);
              sessionDescription.connectionId = data.connectionId;
              socket.emit('answer', sessionDescription);
          });
      }
  });

  socket.on('answer', function handleAnswer(data) {
      console.log('Got answer.');

      clientPeerConnection.setRemoteDescription(new RTCSessionDescription(data));
  });

  socket.on('candidate', function onCandidate(data) {
      console.log('Got candidate.', data);

      var iceCandidate = new RTCIceCandidate({
          sdpMLineIndex: data.label,
          candidate: data.candidate
      });

      if(clientPeerConnection) {
          clientPeerConnection.addIceCandidate(iceCandidate);
      } else if(data.connectionId && serverPeerConnections[data.connectionId]) {
          serverPeerConnections[data.connectionId].addIceCandidate(iceCandidate);
      }
  });

  function createPeerConnection(connectionId) {
      var peerConnection = new webkitRTCPeerConnection({
          "iceServers": [{"url": "stun:stun.l.google.com:19302"}]
      });
      peerConnection.onicecandidate = function onIceCandidate(event) {
          if(event.candidate) {
              var candidateData = {
                  type: 'candidate',
                  label: event.candidate.sdpMLineIndex,
                  id: event.candidate.sdpMid,
                  candidate: event.candidate.candidate
              };
              if(connectionId) {
                  candidateData.connectionId = connectionId;
              }

              console.log('Emitting candidate.', candidateData);
              socket.emit('candidate', candidateData);
          }
      };
      return peerConnection;
  }

  function userMediaSuccess(stream) {
      document.getElementById('bigscreen').src = webkitURL.createObjectURL(stream);
      localStream = stream;
  }

  function userMediaError(error) {
      console.log("Failed calling getUserMedia: " + error.code + ".");
  }

  navigator.webkitGetUserMedia({"video": true, "audio": true}, userMediaSuccess, userMediaError);

};

