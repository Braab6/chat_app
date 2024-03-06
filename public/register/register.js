document.addEventListener("DOMContentLoaded", function () {
    console.log("[INFO] initializing register");

    const socket = io();

    const username = document.getElementById("username");
    const password = document.getElementById("password");
    const confirm_password = document.getElementById("confirm_password");
    const register_button = document.getElementById("register_button");

    socket.on("authenticated", (p) => {
    localStorage.setItem("username", p);
    console.log("Authenticated with username " + p);
    window.location.href = "https://santo-chat.northeurope.cloudapp.azure.com/chat/chat.html";

  })
    
    register_button.onclick = function(event) {
        if (password == confirm_password) {
            socket.emit("register", { "name": username.value, "password": password.value });
            socket.emit("login", { "name": username.value, "password": password.value });
        }
    }
});
