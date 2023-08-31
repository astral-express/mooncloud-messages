const messagesContainer = document.getElementById("messages_container");
const messageInputForm = document.getElementById("message_form");
const messageInput = document.getElementById("message_input");
const messagesSection = document.getElementById("messages_section");

const sendMessageBtn = document.getElementById("send_message_btn");
const chatInitiationBtn = document.querySelectorAll(
  "div.user-details-action > button"
);
const pillsMessagesTab = document.getElementById("pills-messages-tab");
const pillsFriendsTab = document.getElementById("pills-friends-tab");

const pillsMessages = document.getElementById("pills-messages");
const pillsFriends = document.getElementById("pills-friends");
const socket = io();

// FUNCTIONS
function created() {
  const sessionID = localStorage.getItem("sessionID");
  if (sessionID) {
    socket.auth = { sessionID };
    socket.connect();
  }
}

created();

function destroyed() {
  socket.off("connect_error");
}

function appendMessage(message) {
  const messageElement = document.createElement("p");
  messageElement.innerText = message;
  messagesContainer.append(messageElement);
}

//

// SOCKETS
socket.on("connect_error", (err) => {
  if (err.message === "Invalid user") {
    new Error("Unauthorized access");
  }
});

socket.on("session", ({ sessionID, userID, username }) => {
  socket.auth = { sessionID };
  localStorage.setItem("sessionID", sessionID);
  socket.userID = userID;
  socket.username = username;
});

socket.on("receive-private-message", ({ content, from, to }) => {
  console.log(content, from, to);
  appendMessage(content);
});

socket.on("initiate-chat", (initiated) => {
    console.log(initiated)
    if(initiated !== true) {
        throw new Error("There was an error initiating the chat, please try again")
    }


})

// socket.on("loaded-chat", data);

// EVENT LISTENERS
messageInputForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const message = messageInput.value;
  const to = socket.receiverUsername;
  if (message === "" || null) return;
  socket.emit("send-private-message", message, to);
  messageInput.value = "";
});

chatInitiationBtn.forEach((button) => {
  button.addEventListener("click", (e) => {
    e.preventDefault();

    let receiverUsername = button.id.split("_").pop();
    socket.receiverUsername = receiverUsername;
    socket.emit("selected-user", receiverUsername);

    if ((pillsFriends.className = "tab-pane fade active show")) {
      pillsFriends.className = "tab-pane fade";
      pillsFriendsTab.className = "nav-link";
      pillsFriendsTab.ariaSelected = "false";
      pillsFriendsTab.setAttribute("tabindex", "-1");

      pillsMessages.className = "tab-pane fade active show";
      pillsMessagesTab.className = "nav-link active";
      pillsMessages.ariaSelected = "true";
      pillsMessagesTab.removeAttribute("tabindex");
    }
  });
});
