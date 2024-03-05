const file_system = require("fs");
const https = require("https");
const express = require("express");
const socketIo = require("socket.io");

const privateKey = file_system.readFileSync("/etc/letsencrypt/live/santo-chat.northeurope.cloudapp.azure.com/privkey.pem", "utf8");
const certificate = file_system.readFileSync("/etc/letsencrypt/live/santo-chat.northeurope.cloudapp.azure.com/cert.pem", "utf8");
const ca = file_system.readFileSync("/etc/letsencrypt/live/santo-chat.northeurope.cloudapp.azure.com/chain.pem", "utf8");

const credentials = {
    "key": privateKey,
    "cert": certificate,
    "ca": ca
};

const app = express();
const server = https.createServer(credentials, app);
const io = socketIo(server);

app.use(express.static(__dirname + "/public",  { dotfiles: "allow" }));

let num_users = 0;
let history = {};

io.on("connection", (socket) => {
    let added_user = false;

    console.log("user connected");

    socket.on("username", (username) => {
        console.log("user " + username + " connected");
        socket.username = username;
        added_user = true;
    });
    
    socket.on("chat_message", (data) => {
        console.log("received chat message: " + data);

        const message = { "name": socket.username, "message_content": data };
        const time_stamp = Date.now();

        if (history[time_stamp] == null) {
            history[time_stamp] = [];
        }

        history[time_stamp].push(message);
        io.emit("chat_message", message);
    });

    socket.on("disconnect", () => {
        if (added_user) {
            socket.broadcast.emit("user_left", {
                "username": socket.username,
                "num_users": num_users
            });
        }
    });
});

const port = process.env.PORT || 443;

server.listen(port, () => {
    console.log("server running on port " + port);
});
