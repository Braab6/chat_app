document.addEventListener("DOMContentLoaded", function () {
    console.log("[INFO] initializing register");

    const socket = io();

    const username = document.getElementById("username");
    const password = document.getElementById("password");
    const confirm_password = document.getElementById("confirm_password");
    const click = document.getElementById("click");
    
    login_button.onclick = function(event) {
        if (password == confirm_password) {
            var username = document.getElementById("username").value;
            var password = document.getElementById("password").value;
            var confirm_password = document.getElementById("confirm-password").value;
            var register_button = document.getElementById("register_button").value;

            socket.emit("register", { "name": username, "password": password });
        }
    }
});