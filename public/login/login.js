document.addEventListener("DOMContentLoaded", function () {
    console.log("[INFO] initializing login");

    const socket = io();

    const username = document.getElementById("username");
    const password = document.getElementById("password");
    const login_button = document.getElementById("login_button");

    socket.on("authenticated", (p) => {
        localStorage.setItem("username", p);
        console.log("Authenticated with username " + p);
        window.location.href = "https://santo-chat.northeurope.cloudapp.azure.com/chat/chat.html";
    });
    
    login_button.onclick = function(event) {
        console.log(username.value);
        console.log(password.value);
        socket.emit("login", { "name": username.value, "password": password.value });
    }
});
