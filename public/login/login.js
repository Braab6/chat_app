document.addEventListener("DOMContentLoaded", function () {
    console.log("[INFO] initializing login");

    const socket = io();

    const username = document.getElementById("username");
    const password = document.getElementById("password");
    const login_button = document.getElementById("login_button");
    
    login_button.onclick = function(event) {
        console.log(username.value);
        console.log(password.value);
        socket.emit("login", { "name": username.value, "password": password.value });
        window.location.href = "https://santo-chat.northeurope.cloudapp.azure.com/chat/chat.html";
    }
});
