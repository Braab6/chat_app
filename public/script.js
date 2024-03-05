document.addEventListener("DOMContentLoaded", function () {
    console.log("[INFO] initializing app");

    const socket = io();

    const text_input = document.getElementById("text_input");
    const send_button = document.getElementById("send_button");
    const chat_content = document.getElementById("chat_content");

    send_button.onclick = function(event) {
        if (text_input.value != null) {
            console.log("[INFO] sending_message");
            socket.emit("chat_message", text_input.value);
            text_input.value = "";

        }
    };

    socket.on("connect_error", (err) => {
        console.log(err.message);
        console.log(err.description);
        console.log(err.context);
    });

    socket.on("chat_message", (msg) => {
        console.log("[INFO] message:" + msg);
        const item = document.createElement("li");
        item.textContent = msg;
        chat_content.appendChild(item);
    });
});
