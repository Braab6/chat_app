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

    const message_cooldown_ms = 1000;

    // Globals

    let time_last_message = 0;
    let last_message_username = null;

    // Functions

    function send_message() {
        const time_ms = Date.now();

        if (time_ms - time_last_message > message_cooldown_ms) {
            const message = text_input.innerText.trim();
            const username = localStorage.getItem("username");

            if (message !== "") {
                console.log("[INFO] sending_message");
                socket.emit("chat_message", { "conversation": "default", "message": message, "sender": username });

                text_input.innerText = "";
                time_last_message = time_ms;
            }
        } else {
            console.log("[INFO] please wait before sending another message");
        }
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
            root.style.setProperty("--background_color", "#FFFFFF");
        } else {
            root.style.setProperty("--background_color", "#000000");
        }
    };

    socket.on("connect_error", (error) => {
        console.log(error.message);
        console.log(error.description);
        console.log(error.context);
    });

    socket.on("chat_message", (message) => {
        console.log("[INFO] received message:" + message);

        const username = message["sender"];
        const text_message = message["message"].replaceAll('\n', "<br/>");

        const last_child = chat_area.lastElementChild;
        let last_child_tag_closed = false;
        let html_message;

        if (last_child != null && last_child.outerHTML.includes("<div class=\"user_message\">") && last_child.outerHTML.includes("</div>")) {
            last_child_tag_closed = true;
        }

        if (username === last_message_username && last_child_tag_closed) {
            html_message = last_child.innerHTML + "<div class=\"message\"><span>" + text_message + "</span></div>"
            chat_area.removeChild(last_child);
        } else {
            html_message = "<div class=\"message\"><span>" + username + "</span><span>:</span><span>" + text_message + "</span></span></div>"
        }

        const item = document.createElement("div");
        item.className = "user_message";
        item.innerHTML = html_message;

        chat_area.appendChild(item);

        text_input.innerText = "";

        last_message_username = username;
    });

    console.log("[INFO] done initializing app");
});
