document.addEventListener("DOMContentLoaded", function () {
    console.log("[INFO] initializing app");

    const socket = io();

    const text_input = document.getElementById("text_input");
    const send_button = document.getElementById("send_button");
    const chat_content = document.getElementById("chat_content");

    socket.emit("login", "username");

    send_button.onclick = function(event) {
        if (text_input.value != null) {
            console.log("[INFO] sending_message");
            socket.emit("chat_message", { "message": text_input.value, "conversation": "default"});
            text_input.value = "";
        }
    };

    socket.on("connect_error", (error) => {
        console.log(error.message);
        console.log(error.description);
        console.log(error.context);
    });

    socket.on("chat_message", (message) => {
        console.log("[INFO] recieved message by " + message["sender"] + " content: " + message["message"]);
        const item = document.createElement("li");
        item.textContent = message["message"];
        chat_content.appendChild(item);
    });
});
