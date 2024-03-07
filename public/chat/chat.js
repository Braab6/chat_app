function is_whitespace(character) {
    return " \f\n\r\t\v\u00A0\u2028\u2029".includes(character);
}

// HTML exposed functions

function text_input_focus(event) {
    const text_input = document.getElementById("text_input");
    const placeholder = document.getElementById("placeholder");

    if (text_input.innerText === "" || is_whitespace(text_input.innerText)) {
        placeholder.style.display = "none";
    }
}

function text_input_unfocus(event) {
    const text_input = document.getElementById("text_input");
    const placeholder = document.getElementById("placeholder");

    console.log(text_input.innerText);

    if (text_input.innerText === "" || is_whitespace(text_input.innerText)) {
        placeholder.style.display = "inline-block";
    }
}

// on HTML loaded

document.addEventListener("DOMContentLoaded", function () {
    console.log("[INFO] initializing app...");

    // Constants

    const text_input = document.getElementById("text_input");
    const placeholder = document.getElementById("placeholder");

    const expand_toggle = document.getElementById("expand_toggle");
    const dark_mode_toggle = document.getElementById("dark_mode_toggle");
    const logout_button = document.getElementById("logout_button");

    const navigation = document.getElementById("navigation");
    const chat_area = document.getElementById("chat_area");

    const root = document.querySelector(":root");
    const root_variables = getComputedStyle(root);

    const socket = io();

    const message_cooldown_ms = 500;

    // Globals

    let time_last_message = 0;

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
                placeholder.style.display = "none";

                time_last_message = time_ms;
            }
        } else {
            console.log("[INFO] please wait before sending another message");
        }
    }

    function show_message(username, text_message) {
        const item = document.createElement("div");
        item.className = "message";
        item.innerHTML = "<span>" + username + "</span><span>:</span><span>" + text_message + "</span>";
        chat_area.appendChild(item);
    }

    // Logout Ping

    setInterval(() => {
        socket.emit("ping", username);
    }, 1000 * 60 * 1);

    // Event Handlers

    document.onkeydown = function(event) {
        if ((document.activeElement.id === text_input.id || document.activeElement.tagName === "BODY")) {
            if (event.key === "Enter" && !event.shiftKey) {
                event.preventDefault();
                send_message();
            } else {
                text_input.focus();

                let range;
                let selection;

                if (document.createRange) {
                    range = document.createRange();
                    range.selectNodeContents(text_input);
                    range.collapse(false);

                    selection = window.getSelection();
                    selection.removeAllRanges();
                    selection.addRange(range);
                } else if (document.selection) {
                    range = document.body.createTextRange();
                    range.moveToElementText(text_input);

                    range.collapse(false);
                    range.select();
                }
            }
        }
    };

    // Dark Mode Toggle

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

    // Logout Button

    logout_button.onclick = function(event) {
        localStorage.removeItem("conversation");
        localStorage.removeItem("username");
        
        socket.emit("logout", username);

        window.location.href = "https://santo-chat.northeurope.cloudapp.azure.com";
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

    socket.emit("request_recent", { "conversation": conversation, "amount": 10, "time": Date.now() });

    socket.on("messages", (data) => {
        for (const[key, value] of Object.entries(data)) {
            for (const message of value) {
                show_message(message["sender"], message["message"]);
            }
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
