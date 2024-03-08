document.addEventListener("DOMContentLoaded", function () {
    console.log("[INFO] initializing login");

    const socket = io();

    const username = document.getElementById("username");
    const password = document.getElementById("password");
    const login_button = document.getElementById("login_button");

    socket.on("authenticated", (p) => {
        if (p === "success") {
            localStorage.setItem("username", username.value);
            localStorage.setItem("conversation", "default");
            console.log("Authenticated with username " + username.value);
            window.location.href = "https://santo-chat.northeurope.cloudapp.azure.com/chat/chat.html";
        } else {
            console.log("Login failed");
            alert("username and password combination is wrong!");
        }
    });
    
    login_button.onclick = function(event) {
        console.log(username.value);
        console.log(password.value);
        socket.emit("login", { "name": username.value, "password": password.value });
    }

    document.onkeydown = function(event) {
        if (event.key === "Enter") {
            console.log(username.value);
            console.log(password.value);
            socket.emit("login", { "name": username.value, "password": password.value });
        }
    }
});
