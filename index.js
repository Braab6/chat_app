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
    raw_accounts_data = { admin_name : admin_password };
    log("couldn't load accounts databases", type = "FATAL");
}

if (file_system.existsSync("chats.json")) {
    raw_chats_data = JSON.parse(file_system.readFileSync("chats.json"));
} else {
    raw_chats_data = { "default": { "users": ["@everyone", "default", "admin"], "messages": {} } };
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
        log("user " + credentials["name"] + " registered");

        if (Object.keys(accounts).includes(credentials["name"])) {
            log("user already exists", type = "WARNING");
        } else {
            accounts[credentials["name"]] = credentials["password"]
            logged_in.push(credentials["name"]);
            
            log("user " + credentials["name"] + " registered");

            added_user = true;
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
            const message = { "sender": data["sender"], "message": data["message"] };
            const time_stamp = Date.now();
            const conversation_name = data["conversation"];
            const conversation = chats[conversation_name];
            if (conversation["users"].includes(data["sender"]) || conversation["users"].includes("@everyone")) {
                if (conversation["messages"][time_stamp] == null) {
                    conversation["messages"][time_stamp] = [];
                }

                conversation["messages"][time_stamp].push(message);

                chats[conversation_name] = conversation;

                debug("chat message");

                io.emit("chat_message", message);
            }
        }
    });

    socket.on("request_recent", (data) => { // data must be consisting of amount (amount of messages) and conversation
        const conversations = data["conversation"];
        const amount = data["amount"];

        if (conversations != null && amount != null) {
            const messages = chats[conversations]["messages"];
            const output = {};

            const keys = Object.keys(messages).reverse();

            for (i = amount; i >= 0; i--) {
                output[keys[i]] = messages[keys[i]];
            }

            socket.emit("messages",  output);
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
