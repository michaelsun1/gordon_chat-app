const socket = io();

// elements
const $messageForm = document.querySelector("#message-form");
const $messageFormInput = $messageForm.querySelector('input[name="message"]');
const $messageFormButton = $messageForm.querySelector("button");
const $sendLocationButton = document.querySelector("#send-location");
const $messages = document.querySelector("#messages");
const $sidebar = document.querySelector("#sidebar");

// templates
const messageTemplate = document.querySelector("#message-template").innerHTML;
const locationMessageTemplate = document.querySelector(
    "#location-message-template"
).innerHTML;
const sidebarTemplate = document.querySelector("#sidebar-template").innerHTML;

// Options
const { username, room } = Qs.parse(location.search, {
    ignoreQueryPrefix: true
});

socket.on("message", message => {
    console.log(message);
    const html = Mustache.render(messageTemplate, {
        username: message.username,
        message: message.text,
        createAt: moment(message.createAt).format("h:mm a")
    });
    $messages.insertAdjacentHTML("beforeend", html);
    autoscroll();
});

socket.on("locationMessage", locationMessage => {
    console.log(locationMessage);
    const html = Mustache.render(locationMessageTemplate, {
        username: locationMessage.username,
        url: locationMessage.url,
        createAt: moment(locationMessage.createAt).format("h:mm a")
    });
    $messages.insertAdjacentHTML("beforeend", html);
    autoscroll();
});

socket.on("roomData", ({ room, users }) => {
    const html = Mustache.render(sidebarTemplate, {
        room,
        users
    });
    $sidebar.innerHTML = html;
});

$messageForm.addEventListener("submit", e => {
    e.preventDefault();

    // disable button
    $messageFormButton.setAttribute("disabled", "disabled");

    const message = e.target.elements.message.value;
    // const message = $messageFormInput.value;

    socket.emit("sendMessage", message, error => {
        // enable button
        $messageFormButton.removeAttribute("disabled");
        $messageFormInput.value = "";
        $messageFormInput.focus();

        if (error) {
            return alert(error);
        }

        console.log("The message has been delivered.");
    });
});

$sendLocationButton.addEventListener("click", () => {
    if (!navigator.geolocation) {
        return alert("Geolocation is not supported by your browser.");
    }

    $sendLocationButton.setAttribute("disabled", "disabled");

    navigator.geolocation.getCurrentPosition(position => {
        socket.emit(
            "sendLocation",
            {
                latitude: position.coords.latitude,
                longitude: position.coords.longitude
            },
            () => {
                $sendLocationButton.removeAttribute("disabled");
                console.log("Location shared.");
                $messageFormInput.focus();
            }
        );
    });
});

socket.emit("join", { username, room }, error => {
    if (error) {
        alert(error);
        location.href = "/";
    }
});
