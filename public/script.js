document.addEventListener("DOMContentLoaded", function () {
    console.log("[INFO] initializing app");

    const socket = io();

    const text_input = document.getElementById("text_input");
    const send_button = document.getElementById("send_button");
    const chat_content = document.getElementById("chat_content");
    const extra = [ "sagt", "schreit" , "ruft", "flüstert", "schreibt", "betont", "kommentiert", "erwiedert", "verbreitet", "haucht" ];

    socket.emit("login", { "name": "default", "password": "12345678" });

    send_button.onclick = function(event) {
        if (text_input.value != null) {
            console.log("[INFO] sending_message");
            socket.emit("chat_message", { "message": text_input.value, "conversation": "default"});
            text_input.value = "";
        }
    };

    text_input.addEventListener("keydown", function(event){
        if (event.key === "Enter" && event.shiftKey){
            event.preventDefault();
            send_button.click();
        }
    });

    socket.on("connect_error", (error) => {
        console.log(error.message);
        console.log(error.description);
        console.log(error.context);
    });

    socket.on("chat_message", (message) => {
        console.log("[INFO] received message by " + message["sender"] + " content: " + message["message"]);
        const item = document.createElement("li");

        const count_extra = 10;
        const random_extra = Math.floor(Math.random() * count_extra);

        item.textContent = message["sender"] + " " + extra[random_extra] + ": " + message["message"];
        chat_content.appendChild(item);
    });
});
