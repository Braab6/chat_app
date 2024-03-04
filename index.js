const http = require("http");
const express = require("express");
const socketIo = require("socket.io");

const app = express();
const server = http.createServer(app);
const io = socketIo(server);

app.use(express.static(__dirname + "public"));

io.on("connection", (socket) => {
    console.log("user connected");

    socket.on("disconnect", () => {
        console.log("user disconnected");
    });

    socket.on("chat_message", (msg) => {
        io.emit("chat message", msg);
    });
});

const port = process.env.PORT || 80;

server.listen(port, () => {
    console.log("server running on port " + port);
});