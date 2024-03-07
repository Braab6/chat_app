// HTML exposed functions

function text_input_focus(event) {
    const text_input = document.getElementById("text_input");

    if (text_input.innerText === "message group...") {
        text_input.innerText = "";
    }
}

function text_input_unfocus(event) {
    const text_input = document.getElementById("text_input");

    if (text_input.innerText == null || text_input.innerText.trim() === "") {
        text_input.innerText = "message group...";
    }
}

// on HTML loaded

document.addEventListener("DOMContentLoaded", function () {
    console.log("[INFO] initializing app...");

    // Constants

    const text_input = document.getElementById("text_input");

    const expand_toggle = document.getElementById("expand_toggle");
    const dark_mode_toggle = document.getElementById("dark_mode_toggle");

    const navigation = document.getElementById("navigation");
    const chat_area = document.getElementById("chat_area");

    const root = document.querySelector(":root");
    const root_variables = getComputedStyle(root);

    const socket = io();

    const message_cooldown_ms = 500;

    // Globals

    let time_last_message = 0;
    let last_message_username = null;

    const username = localStorage.getItem("username");
    const conversation = localStorage.getItem("conversation");

    // Functions

    function send_message() {
        const time_ms = Date.now();

        if (time_ms - time_last_message > message_cooldown_ms) {
            const message = text_input.innerText.trim();

            if (message !== "") {
                console.log("[INFO] sending_message");
                socket.emit("chat_message", { "conversation": localStorage.getItem("conversation"), "message": message, "sender": username });

                text_input.innerText = "";
                time_last_message = time_ms;
            }
        } else {
            console.log("[INFO] please wait before sending another message");
        }
    }

    function show_message(username, text_message) {
        const item = document.createElement("div");
        item.className = "user_message";
        item.innerHTML = "<div class=\"message\"><span>" + username + "</span><span>:</span><span>" + text_message + "</span></span></div>";
        chat_area.appendChild(item);
    }

    // Event Handlers

    document.onkeydown = function(event) {
        if ((document.activeElement.id === text_input.id || document.activeElement.tagName === "BODY") && event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            send_message();
        }
    };

    dark_mode_toggle.onchange = function(event) {
        if (this.checked) {
            root.style.setProperty("--color_text", root_variables.getPropertyValue("--light_mode_color_text"));
            root.style.setProperty("--color_background", root_variables.getPropertyValue("--light_mode_color_background"));
            root.style.setProperty("--color_primary", root_variables.getPropertyValue("--light_mode_color_primary"));
            root.style.setProperty("--color_secondary", root_variables.getPropertyValue("--light_mode_color_secondary"));
            root.style.setProperty("--color_accent", root_variables.getPropertyValue("--light_mode_color_accent"));

            root.style.setProperty("--color_shadow", root_variables.getPropertyValue("--light_mode_color_shadow"));
        } else {
            root.style.setProperty("--color_text", root_variables.getPropertyValue("--dark_mode_color_text"));
            root.style.setProperty("--color_background", root_variables.getPropertyValue("--dark_mode_color_background"));
            root.style.setProperty("--color_primary", root_variables.getPropertyValue("--dark_mode_color_primary"));
            root.style.setProperty("--color_secondary", root_variables.getPropertyValue("--dark_mode_color_secondary"));
            root.style.setProperty("--color_accent", root_variables.getPropertyValue("--dark_mode_color_accent"));

            root.style.setProperty("--color_shadow", root_variables.getPropertyValue("--dark_mode_color_shadow"));
        }
    };

    // Connection Error

    socket.on("connect_error", (error) => {
        console.log(error.message);
        console.log(error.description);
        console.log(error.context);
    });

    // Request Chats

    socket.emit("request_chats", username);

    socket.on("chats", (data) => {
        
    });

    // Request Chat History

    socket.emit("request_recent", { "conversation": conversation, "number": 10 });

    socket.on("messages", (data) => {
        for (const[key, value] of Object.entries(data)) {
            console.log(value)
            show_message(value["sender"], value["message"]);
        }
    });

    // Chat Message

    socket.on("chat_message", (message) => {
        console.log("[INFO] received message:" + message);

        const username = message["sender"];
        const text_message = message["message"].replaceAll('\n', "<br/>");

        show_message(username, text_message);
    });

    console.log("[INFO] done initializing app");
});
