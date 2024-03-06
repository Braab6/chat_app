async function sleep(ms) {
    return new Promise((resolve) => {
        setTimeout(resolve, ms);
    });
}

document.addEventListener("DOMContentLoaded", function () {
    console.log("[INFO] initializing login");

    const socket = io();

    const username = document.getElementById("username");
    const password = document.getElementById("password");
    const login_button = document.getElementById("login_button");
    
    login_button.onclick = async function(event) {
        console.log(username);
        console.log(password);
        socket.emit("login", { "name": username, "password": password });

        await sleep(500);

        window.location.href = "https://santo-chat.northeurope.cloudapp.azure.com/chat/chat.html";
    }
});