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

let num_users = 0; // the number of active users
let chats = { "default": { "users": ["@everyone", "default"], "messages": {} } };
let accounts = { "default": "12345678", "demo": "password" }; //name / password
let logged_in = [];

io.on("connection", (socket) => {
    let added_user = false;

    socket.on("login", (credentials) => {
        if (Object.keys(accounts).includes(credentials["name"])) { // checks if the user exists
            if (accounts[credentials["name"]] == credentials["password"]) { // checks if the password is correct
                logged_in.push(credentials["name"]); // adds user to the list of online users
                console.log("user " + credentials["name"] + " connected");
                added_user = true;
                num_users += 1;
                socket.emit("authenticated", credentials["name"]);
            } else {
                //socket.emit("wrong_password", null);
            }
        }
    });

    socket.on("register", (credentials) => {
        accounts[credentials["name"]].push(credentials["password"]) // registers new user
    });

    // the given chat must be a json consisting of the name and the users of a conversation
    socket.on("new_chat", (chat) => {
        console.log("chat " + chat["name"] + " created");
        
        const conversation = {};
        conversation["users"] = []; // list of users who can access the chat
        conversation["messages"] = {}; // json of sent messages in the corresponding conversation with timestamp as key
        // value of messages is a json consisting of the sender and the message

        chats[chat["name"]].push(conversation); // json of all the existing conversation with the conversation-name as key
    });
    
    // data must be a json consisting of the message and the conversation where the sender is chatting in
    socket.on("chat_message", (data) => {
        console.log("received chat message by " + data["sender"]);

        if (data["message"] != "") {
            const message = { "sender": data["sender"], "message": data["message"] };
            const time_stamp = Date.now();
            const conversation_name = data["conversation"];
            let conversation = chats[conversation_name];
            
            if (conversation["users"].includes(data["sender"])) {
                if (conversation["messages"][time_stamp] == null) {
                    conversation["messages"][time_stamp] = [];
                }

                conversation["messages"][time_stamp].push(message);

                chats[conversation_name] = conversation;

                io.emit("chat_message", message);
            }
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

    socket.on("disconnect", (sender) => {
        if (added_user) {
            socket.broadcast.emit("user_left", {
                "username": sender,
                "num_users": num_users
            });
        }
    });
});

const port = process.env.PORT || 443;

server.listen(port, () => {
    console.log("server running on port " + port);
});
