// HTML exposed functions

function text_input_focus(event) {
    const text_input = document.getElementById("text_input");

    if (text_input.innerText === "message group...") {
        text_input.innerText = "";
    }
}

function text_input_unfocus(event) {
    const text_input = document.getElementById("text_input");

    console.log(text_input.innerText);

    if (text_input.innerText == null || text_input.innerText.trim() === "") {
        text_input.innerText = "message group...";
    }
}

// on HTML loaded

document.addEventListener("DOMContentLoaded", function () {
    console.log("[INFO] initializing app...");

    // Constants

    const text_input = document.getElementById("text_input");
    const send_button = document.getElementById("send_button");

    const expand_toggle = document.getElementById("expand_toggle");
    const dark_mode_toggle = document.getElementById("dark_mode_toggle");

    const navigation = document.getElementById("navigation");
    const chat_area = document.getElementById("chat_area");

    const socket = io();

    const message_cooldown_ms = 1000;

    // Globals

    let time_last_message = 0;
    let username;

    // Functions

    function send_message() {
        const time_ms = Date.now();

        if (time_ms - time_last_message > message_cooldown_ms) {
            const message = text_input.innerText.trim();

            if (message !== "") {
                console.log("[INFO] sending_message by " + username);
                socket.emit("chat_message", { "conversation": "default", "message": message, "sender": username });

                text_input.innerText = "";
                time_last_message = time_ms;
            }
        } else {
            console.log("[INFO] please wait before sending another message");
        }
    }

    // Event Handlers

    send_button.onclick = function(event) {
        if (text_input.innerText == null || text_input.innerText.trim() === "") {
            console.log("[INFO] sending_message");
            socket.emit("chat_message", text_input.innerText);
            text_input.innerText = "";
        }
    };

    document.onkeydown = function(event) {
        if (document.activeElement.id === text_input.id && event.key === "Enter" && event.shiftKey){
            event.preventDefault();
            send_message();
        }
    };

    socket.on("connect_error", (error) => {
        console.log(error.message);
        console.log(error.description);
        console.log(error.context);
    });

    socket.on("chat_message", (message) => {
        console.log("[INFO] received message:" + message);

        const sender = message["sender"];
        const text_message = message["message"];

        const new_child = "<test>" + sender + "</test><test>:</test><test>" + text_message + "</test>"

        const item = document.createElement("message");
        item.innerHTML = new_child;
        chat_area.appendChild(item);
    });

    socket.on("user_joined", (name) => {
        username = name;
    });

    console.log("[INFO] done initializing app");
});
