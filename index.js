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

const admin_name = "admin";
const admin_password = "123";

// Globals

app.use(express.static(__dirname + "/public",  { dotfiles: "allow" }));

let num_users = 0; // the number of active users
let logged_in = {};

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

function user_disconnected(data) {
    num_users -= 1;
    delete logged_in[data];
}

// Auto Save & Load

let raw_accounts_data;
let raw_chats_data;

if (file_system.existsSync("accounts.json")) {
    raw_accounts_data = JSON.parse(file_system.readFileSync("accounts.json"));
} else {
    raw_accounts_data = { admin_name : admin_password };
    file_system.writeFileSync("accounts.json", JSON.stringify(raw_accounts_data));
    log("couldn't load accounts databases", type = "FATAL");
}

if (file_system.existsSync("chats.json")) {
    raw_chats_data = JSON.parse(file_system.readFileSync("chats.json"));
} else {
    raw_chats_data = { "default": { "users": ["@everyone", "default", "admin"], "messages": {} } };
    file_system.writeFileSync("chats.json", JSON.stringify(raw_chats_data));
    log("couldn't load chats databases", type = "FATAL");
}

const accounts = raw_accounts_data;
const chats = raw_chats_data;

raw_accounts_data = null;
raw_chats_data = null;

timer.setInterval(() => {
    file_system.writeFileSync("accounts.json", JSON.stringify(accounts));
    file_system.writeFileSync("chats.json", JSON.stringify(chats));

    log("[INFO] auto-saved");
}, 1000 * 60 * 1);

// Default Users

if (!Object.keys(accounts).includes(admin_name)) {
    accounts[admin_name] = admin_password;
}

// Socket Communication

io.on("connection", (socket) => {
    socket.on("login", (credentials) => {
        if (Object.keys(accounts).includes(credentials["name"])) {
            if (accounts[credentials["name"]] == credentials["password"]) { // checks if the password is correct
                logged_in[credentials["name"]] = Date.now();
                
                num_users += 1;

                socket.emit("authenticated", credentials["name"]);

                log("user " + credentials["name"] + " connected");
            } else {
                socket.emit("wrong_password", null);
            }
        }
    });

    socket.on("register", (credentials) => {
        log("user " + credentials["name"] + " registered");

        if (Object.keys(accounts).includes(credentials["name"])) {
            log("user already exists", type = "WARNING");
        } else {
            accounts[credentials["name"]] = credentials["password"]
            logged_in[credentials["name"]] = Date.now();
            
            log("user " + credentials["name"] + " registered");

            num_users += 1;

            socket.emit("authenticated", credentials["name"]);
        }
    });

    // the given chat must be a json consisting of the name and the users of a conversation
    socket.on("new_chat", (chat) => {
        log("chat " + chat["name"] + " created");
        
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
            const timestamp = Date.now();

            const message = { "timestamp": timestamp, "sender": data["sender"], "message": data["message"] };
            const server_message = { "sender": data["sender"], "message": data["message"] };

            const conversation_name = data["conversation"];
            const conversation = chats[conversation_name];
            
            if (data["sender"] != null && conversation != null) {
                if (conversation["users"].includes(data["sender"]) || conversation["users"].includes("@everyone")) {
                    if (conversation["messages"][timestamp] == null) {
                        conversation["messages"][timestamp] = [];
                    }

                    conversation["messages"][timestamp].push(server_message);

                    chats[conversation_name] = conversation;

                    io.emit("chat_message", message);
                }
            }
        }
    });

    socket.on("request_recent", (data) => { // data must be consisting of amount (amount of messages) and conversation
        const conversations = data["conversation"];
        const amount = data["amount"];
        const time = parseInt(data["time"]);

        if (conversations != null && amount != null) {
            const messages = chats[conversations]["messages"];
            const output = {};

            let keys = null;

            if (time == 0) {
                keys = Object.keys(messages).slice(0, amount);
            } else {
                keys = Object.keys(messages).filter((timestamp) => parseInt(timestamp) < time).slice(0, amount);
            }

            for (const key of keys) {
                output[key] = messages[key];
            }
            
            console.log(messages)
            console.log(keys)
            console.log(output)
            console.log("time" + time);

            socket.emit("messages", output);
        }
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

    socket.on("ping", (data) => {
        const username = data;

        if (logged_in[username] != null && Date.now() - logged_in[username] >= 1000 * 60 * 2) {
            user_disconnected(data);
            socket.emit("logout", username);
            log(username + " timed out");
        }
        
        logged_in[username] = Date.now();
    });

    socket.on("logout", (data) => {
        user_disconnected(data);
        log(data + " disconnected");
    });

    socket.on("add_conversation", (data) => {
        chats[data["name"]] = { "users": data["members"], "messages": {} }
        socket.emit("move_to", data["name"]);
    });
});

const port = process.env.PORT || 443;

server.listen(port, () => {
    console.log("server running on port " + port);
});
