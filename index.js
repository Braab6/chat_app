const fs = require('fs');
const https = require("https");
const express = require("express");
const socketIo = require("socket.io");

//Certificate
const privateKey = fs.readFileSync('/etc/letsencrypt/live/santo-chat.northeurope.cloudapp.azure.com/privkey.pem', 'utf8');
const certificate = fs.readFileSync('/etc/letsencrypt/live/santo-chat.northeurope.cloudapp.azure.com/cert.pem', 'utf8');
const ca = fs.readFileSync('/etc/letsencrypt/live/santo-chat.northeurope.cloudapp.azure.com/chain.pem', 'utf8');
const credentials = {
  key: privateKey,
  cert: certificate,
  ca: ca

};

const app = express();
const server = https.createServer(credentials, app);
const io = socketIo(server);

app.use(express.static(__dirname + "/public",  { dotfiles: 'allow'  }));

let numUsers = 0;

io.on('connection', (socket) => {
  let addedUser = false;
  console.log("User connected")

  socket.on('chat message', (data) => {
    console.log("Got chat message")
    // we tell the client to execute 'chat message'
    io.emit('chat message', data);
  });
     socket.on('disconnect', () => {
         if (addedUser) {
  
           // echo globally that this client has left
           socket.broadcast.emit('user left', {
             username: socket.username,
             numUsers: numUsers
           });
         }
     });
});

const port = process.env.PORT || 443;

server.listen(port, () => {
    console.log("server running on port " + port);
});
