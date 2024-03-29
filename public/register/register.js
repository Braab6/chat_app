document.addEventListener("DOMContentLoaded", function () {
    console.log("[INFO] initializing register");

    const socket = io();

    const username = document.getElementById("username");
    const password = document.getElementById("password");
    const confirm_password = document.getElementById("confirm_password");
    const register_button = document.getElementById("register_button");

    socket.on("authenticated", (p) => {
        localStorage.setItem("username", p);
        localStorage.setItem("conversation", "default");
        console.log("Authenticated with username " + p);
        window.location.href = "https://santo-chat.northeurope.cloudapp.azure.com/chat/chat.html";
    });

    socket.on("exist", () => {
        alert("The user already exists");
    });
    
    register_button.onclick = function(event) {
        console.log("pressed");
        if (password.value == confirm_password.value && password.value != "") {
            console.log("Passwort: " + password.value);
            socket.emit("register", { "name": username.value, "password": password.value });
        } else {
            alert("the passwords are not matching");
        }
    }

    document.onkeydown = function(event) {
        if (event.key === "Enter") {
            if (password.value == confirm_password.value && password.value != "") {
                socket.emit("register", { "name": username.value, "password": password.value });
            } else {
                alert("the passwords are not matching");
            }
        }
    }
});
