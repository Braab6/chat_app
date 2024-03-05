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
let chats = {};

io.on("connection", (socket) => {
    let added_user = false;
    console.log("user connected");

    socket.on("username", (username) => {
        console.log("user " + username + " connected");
        socket.username = username;
        added_user = true;
    });

    socket.on("new_chat", (chat) => {
        console.log("chat " + chat["name"] + " created");
        // the given chat MUST be a json consisting of the name and the users of a conversation

        let conversation = {};
        conversation["users"] = []; // list of users who can access the chat
        conversation["messages"] = {}; // json of sent messages in the corresponding conversation with timestamp as key
        // value of messages is a json consisting of the sender and the message

        chats[chat["name"]].push(conversation); // json of all the existing conversation with the conversation-name as key
    });
    
    socket.on("chat_message", (data) => {
        // data MUST be a json consisting of the message and the conversation where the sender is chatting in
        console.log("received chat message by " + socket.username);

        const message = { "sender": socket.username, "message": data["message"] };
        const time_stamp = Date.now();

        if (chats[data["conversation"]]["users"].includes(socket.username)) {
            chats[data["conversation"]]["messages"].push({ timestamp: message });
        }
        
        
    });

    socket.on("recent", (data) => { // data must be consisting of number (number of messages) and conversation
        let messages = chats[data["conversation"]]["messages"];
        let output = {};
        let number = data["number"];
        let keys = Object.keys(messages);
        
        keys = keys.reverse();

        for (i = 0; i < number; i++) {
            output[keys[i]].push[messages[keys[i]]];
        }

        io.emit("messages", output);
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
