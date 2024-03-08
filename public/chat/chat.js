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

    const add_conversation_button = document.getElementById("add_conversation");

    const navigation = document.getElementById("navigation");
    const chat_area = document.getElementById("chat_area");

    const root = document.querySelector(":root");
    const root_variables = getComputedStyle(root);

    const socket = io();

    const message_cooldown_ms = 500;
    const initial_request_message_amount = 50;
    const request_message_amount = 25;

    // Globals

    let time_last_message = 0;

    const username = localStorage.getItem("username");
    const conversation = localStorage.getItem("conversation");

    const messages = {};

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

                chat_area.scrollTo(0, chat_area.scrollHeight);
            }
        } else {
            console.log("[INFO] please wait before sending another message");
        }
    }

    function add_message(timestamp, username, text_message) {
        if (messages[timestamp] == null || messages[timestamp] === undefined) {
            const json = {};
            json[username] = text_message;
            messages[timestamp] = [ json ];
        } else {
            messages[timestamp].push({
                "username": text_message
            });
        }
    }

    function show_message(username, text_message, bottom = true) {
        let scrolled_down = false;

        if (Math.abs(chat_area.scrollHeight - chat_area.scrollTop - chat_area.clientHeight) <= 15) {
            scrolled_down = true;
        }

        const message_split = text_message.split('\n');

        const item = document.createElement("div");

        const span_username = document.createElement("div");
        const span_separator = document.createElement("div");
        const span_message = document.createElement("div");

        span_username.innerText = username;
        span_separator.innerText = ":";

        span_message.innerHTML = "";

        for (const string of message_split) {
            span_message.innerHTML += "<div>" + string + "</div>";
            span_message.innerHTML += "<br/>";
        }

        span_message.innerHTML = span_message.innerHTML.substring(0, span_message.innerHTML.length - "<br/>".length);

        item.className = "message";
        item.appendChild(span_username);
        item.appendChild(span_separator);
        item.appendChild(span_message);

        if (bottom) {
            chat_area.append(item);
        } else {
            chat_area.prepend(item);
        }

        if (scrolled_down) {
            chat_area.scrollTo(0, chat_area.scrollHeight);
        }
    }

    function remove_connection() {
        localStorage.removeItem("conversation");
        localStorage.removeItem("username");

        window.location.href = "https://santo-chat.northeurope.cloudapp.azure.com";
    }

    // Logout Ping

    setInterval(() => {
        socket.emit("ping", username);
    }, 1000 * 60 * 1);

    // Request Recent

    setInterval(() => {
        if (chat_area.scrollTop <= 0) {
            const time_last_message = messages.length === 0 ? 0 : Object.keys(messages).reverse()[0];
            socket.emit("request_recent", { "conversation" : conversation, "amount" : request_message_amount, "time" : time_last_message });
        }
    }, 1000);

    // Event Handlers

    document.onkeydown = function(event) {
        if ((document.activeElement.id === text_input.id || document.activeElement.tagName === "BODY") && event.key === "Enter" && !event.shiftKey) {
            event.preventDefault();
            send_message();
        } else if (document.activeElement.id !== text_input.id) {
            if (event.key !== "ArrowLeft" && event.key !== "Shift" && event.key !== "Control" && event.key !== "CapsLock" && event.key !== "Alt" && event.key !== "AltGraph" && event.key !== "Escape" && event.key !== "NumLock" && event.key !== "Meta") {
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
        socket.emit("logout", username);

        remove_connection();
    };

    // Add Conversation Button

    add_conversation_button.onclick = function(event) {
        socket.emit("new_chat", "template");
    };

    // Server Logout / Time Out

    socket.on("logout", () => {
        remove_connection();
    })

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

    socket.emit("request_recent", { "conversation": conversation, "amount": initial_request_message_amount, "time": 0 });

    socket.on("messages", (data) => {
        for (const key of Object.keys(data)) {
            const timestamp = key;

            messages[timestamp] = [];

            for (const message of data[key]) {
                const username = message["sender"];
                const text_message = message["message"];

                const json = {};
                json[username] = text_message;

                messages[timestamp].push(json);
            }
        }

        chat_area.innerHTML = "";

        for (const timestamp_message of Object.keys(messages)) {
            for (const message of messages[timestamp_message]) {
                show_message(Object.keys(message), message[Object.keys(message)], false);
            }
        }

        chat_area.scrollTop = 0;
    });

    // Chat Message

    socket.on("chat_message", (message) => {
        console.log("[INFO] received message:" + message);

        const timestamp = message["timestamp"];
        const username = message["sender"];
        const text_message = message["message"];

        console.log("timestamp" + timestamp);

        add_message(timestamp, username, text_message);
        show_message(username, text_message, true);
    });

    // Done Info

    console.log("[INFO] done initializing app");
});
