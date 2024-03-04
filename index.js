const http = require("http");
const express = require("express");
const socketio = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketio(server);

const port = process.env.PORT || 80;

server.listen(port, function () {
    console.log("webserver running on port %d", port);
});

app.use(express.static(__dirname + "/public"));

io.on("connection", function (socket) {
    var addedUser = false;

    socket.on("add user", function (username) {
        socket.username = username;
        addedUser = true;

        socket.emit("login");

        socket.broadcast.emit("user joined", socket.username);
    });

    socket.on("new message", function (data) {
        socket.broadcast.emit("new message", {
            username: socket.username,
            message: data
        });
    });

    socket.on("disconnect", function () {
        if (addedUser) {
            socket.broadcast.emit("user left", socket.username);
        }
    });
});
