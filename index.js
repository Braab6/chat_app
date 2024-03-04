const fs = require("fs");
const https = require("https");
const express = require("express");
const socketIo = require("socket.io");

const privateKey = fs.readFileSync("/etc/letsencrypt/live/santo-chat.northeurope.cloudapp.azure.com/privkey.pem", "utf8");
const certificate = fs.readFileSync("/etc/letsencrypt/live/santo-chat.northeurope.cloudapp.azure.com/cert.pem", "utf8");
const ca = fs.readFileSync("/etc/letsencrypt/live/santo-chat.northeurope.cloudapp.azure.com/chain.pem", "utf8");

const credentials = {
    "key": privateKey,
    "cert": certificate,
    "ca": ca
};

const app = express();
const server = https.createServer(credentials, app);
const io = socketIo(server);

app.use(express.static(__dirname + "/public",  { dotfiles: "allow" }));

let numUsers = 0;
let history = {};

io.on("connection", (socket) => {
    let addedUser = false;
    console.log("user connected");

    socket.on("username", (username) => {
        console.log("User " + username + "connected");
        socket.username = username;
        addedUser = true;
    });
    
    socket.on("chat_message", (data) => {
        console.log("received chat message");
        const message = { "name": socket.username, "messageContent": data };
        history[Date.now()].push(message);
        io.emit("chat_message", message);
    });

    socket.on("disconnect", () => {
        if (addedUser) {
            socket.broadcast.emit("user left", {
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
