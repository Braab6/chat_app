const file_system = require("fs");
const https = require("https");
const express = require("express");
const socketIo = require("socket.io");
const timer = require("node:timers");

// Libaries

const privateKey = file_system.readFileSync("/etc/letsencrypt/live/santo-chat.northeurope.cloudapp.azure.com/privkey.pem", "utf8");
const certificate = file_system.readFileSync("/etc/letsencrypt/live/santo-chat.northeurope.cloudapp.azure.com/cert.pem", "utf8");
const cain = file_system.readFileSync("/etc/letsencrypt/live/santo-chat.northeurope.cloudapp.azure.com/chain.pem", "utf8");

// Constants

const credentials = {
    "key": privateKey,
    "cert": certificate,
    "ca": cain
};

const app = express();
const server = https.createServer(credentials, app);
const io = socketIo(server);

// Globals

app.use(express.static(__dirname + "/public",  { dotfiles: "allow" }));

let num_users = 0; // the number of active users
let logged_in = [];

// Functions

const error_level = 5;

const error_types = {
    "FATAL" : 0,
    "ERROR" : 1,
    "WARNING" : 2,
    "INFO" : 3,
    "DEBUG" : 4
};

function log(message, type = "INFO") {
    if (error_types[type] < error_level) {
        console.log("[" + type + "] " + message);
    }
}

function debug(message) {
    if (error_types["DEBUG"] < error_level) {
        console.log("[DEBUG]" + message);
    }
}

// Auto Save & Load

let raw_accounts_data;
let raw_chats_data;

if (file_system.existsSync("accounts.json")) {
    raw_accounts_data = JSON.parse(file_system.readFileSync("accounts.json"));
} else {
    raw_accounts_data = { "admin": "admin12345678" };
    log("couldn't load accounts databases", type = "FATAL");
}

if (file_system.existsSync("chats.json")) {
    raw_chats_data = JSON.parse(file_system.readFileSync("chats.json"));
} else {
    raw_chats_data = { "default": { "users": ["@everyone", "default"], "messages": {} } };
    log("couldn't load chats databases", type = "FATAL");
}

const accounts = raw_accounts_data;
const chats = raw_chats_data;

raw_accounts_data = null;
raw_chats_data = null;

timer.setInterval(() => {
    file_system.writeFileSync("accounts.json", JSON.stringify(accounts));
    file_system.writeFileSync("chats.json", JSON.stringify(chats));
    console.log("[INFO] auto-saved");
}, 1000 * 60 * 5);

// Socket Communication

io.on("connection", (socket) => {
    let added_user = false;

    socket.on("login", (credentials) => {
        if (Object.keys(accounts).includes(credentials["name"])) {
            if (accounts[credentials["name"]] == credentials["password"]) { // checks if the password is correct
                logged_in.push(credentials["name"]);
                
                added_user = true;
                num_users += 1;

                socket.emit("authenticated", credentials["name"]);

                log("user " + credentials["name"] + " connected");
            } else {
                socket.emit("wrong_password", null);
            }
        }
    });

    socket.on("register", (credentials) => {
        console.log("[INFO] user " + credentials["name"] + " registered")
        if (Object.keys(accounts).includes(credentials["name"])) {
            console.log("user does already exist", type = "WARNING");
        } else {
            accounts[credentials["name"]] = credentials["password"]
            logged_in.push(credentials["name"]); // adds user to the list of online users
            log("[INFO] user " + credentials["name"] + " connected");

            added_user = true;
            num_users += 1;

            socket.emit("authenticated", credentials["name"]);
        }
    });

    // the given chat must be a json consisting of the name and the users of a conversation
    socket.on("new_chat", (chat) => {
        console.log("[INFO] chat " + chat["name"] + " created");
        
        const conversation = {};
        conversation["users"] = []; // list of users who can access the chat
        conversation["messages"] = {}; // json of sent messages in the corresponding conversation with timestamp as key
        // value of messages is a json consisting of the sender and the message

        chats[chat["name"]].push(conversation); // json of all the existing conversations with the conversation-name as key
    });
    
    // data must be a json consisting of the message and the conversation where the sender is chatting in
    socket.on("chat_message", (data) => {
        log("received chat message by " + data["sender"]);

        if (data["message"] != "") {
            const message = { "sender": data["sender"], "message": data["message"] };
            const time_stamp = Date.now();
            const conversation_name = data["conversation"];
            let conversation = chats[conversation_name];
            console.log("debug1: " + conversation["users"] + data["sender"])
            
            if (conversation["users"].includes(data["sender"])) {
                if (conversation["messages"][time_stamp] == null) {
                    conversation["messages"][time_stamp] = [];
                }

                conversation["messages"][time_stamp].push(message);

                chats[conversation_name] = conversation;

                console.log("debug2")
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

    socket.on("request_chats", (data) => {
        const username = data;
        const output = [];

        for (const[key, value] of Object.entries(chats)) {
            if (chats[key]["users"].includes(username)) {
                output.push(key);
            }
        }

        debug(output);

        io.emit("chats", { "chats" : output });
    });

    socket.on("disconnect", (data) => {
        const username = data;

        if (added_user) {
            socket.broadcast.emit("user_left", {
                "username": username,
                "num_users": num_users
            });
        }
    });
});

const port = process.env.PORT || 443;

server.listen(port, () => {
    console.log("server running on port " + port);
});
