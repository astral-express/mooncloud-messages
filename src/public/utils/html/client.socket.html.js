// DOM Selectors
const tabContent = document.getElementById("chat_tab_content");
const chatListGroup = document.getElementById("chat_list_group");

const messagesContainer = document.getElementById("messages_container");
const messageInputForm = document.getElementById("message_form");
const messageInput = document.getElementById("message_input");
const messagesSection = document.getElementById("messages_section");
const messagesSender = document.getElementById("sender");
const messageReceived = document.getElementById("received_message");
const chatBubbles = document.getElementById("chat-bubbles");

const receivedMessagesColumn = document.getElementById(
  "received_messages_column"
);
const sentMessagesColumn = document.getElementById("sent_messages_column");

const sendMessageBtn = document.getElementById("send_message_btn");
const chatInitiationBtn = document.querySelectorAll(
  "div.user-details-action > button"
);
const pillsMessagesTab = document.getElementById("pills-messages-tab");
const pillsFriendsTab = document.getElementById("pills-friends-tab");

const pillsMessages = document.getElementById("pills-messages");
const pillsFriends = document.getElementById("pills-friends");
const socket = io();

// Variables
let is_chat_pre_loaded = false;

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

function appendReceivedMessage(message, from) {
  const bubbleContainer = document.createElement("div");
  bubbleContainer.setAttribute("id", "received_messages_column");
  bubbleContainer.classList.add("d-flex", "flex-column", "me-auto", "pb-2");

  const sender = document.createElement("span");
  sender.setAttribute("id", "sender");
  sender.classList.add("ms-1", "small");
  sender.innerText = from;

  const bubbleTextWrapper = document.createElement("div");
  bubbleTextWrapper.classList.add(
    "text-bubble-received",
    "p-2",
    "bg-primary",
    "rounded"
  );

  const bubbleText = document.createElement("p");
  bubbleText.setAttribute("id", "received_message");
  bubbleText.classList.add("message-element", "m-0", "text-white");
  bubbleText.innerText = message;

  bubbleContainer.append(sender, bubbleTextWrapper);
  bubbleTextWrapper.append(bubbleText);
  messagesContainer.append(bubbleContainer);
  scrollController();
}

function appendSentMessage(message) {
  const bubbleContainer = document.createElement("div");
  bubbleContainer.setAttribute("id", "sent_messages_column");
  bubbleContainer.classList.add("d-flex", "flex-column", "ms-auto", "pb-2");

  const sender = document.createElement("span");
  sender.setAttribute("id", "you");
  sender.classList.add("text-secondary", "ms-auto", "me-1", "small");
  sender.innerText = "You";

  const bubbleTextWrapper = document.createElement("div");
  bubbleTextWrapper.classList.add(
    "text-bubble-sent",
    "p-2",
    "bg-secondary",
    "rounded"
  );

  const bubbleText = document.createElement("p");
  bubbleText.setAttribute("id", "sent_message");
  bubbleText.classList.add("message-element", "m-0", "text-white");
  bubbleText.innerText = message;

  bubbleContainer.append(sender, bubbleTextWrapper);
  bubbleTextWrapper.append(bubbleText);
  messagesContainer.append(bubbleContainer);
  scrollController();
}

function chatMessagesLoad(chatData) {
  for (let i = 0; i < chatData.length; i++) {
    for (let x = 0; x < chatData[i].messages.length; x++) {
      if (chatData[i].messages[x].user === socket.username) {
        appendSentMessage(chatData[i].messages[x].message);
      } else {
        appendReceivedMessage(
          chatData[i].messages[x].message,
          chatData[i].messages[x].user
        );
      }
    }
  }
}

function chatsListLoad(chatsData) {
  var userDetails = [];
  var userLastMessage;
  var sender;
  for (let i = 0; i < chatsData.length; i++) {
    for (let x = 0; x < chatsData[i].members.length; x++) {
      if (chatsData[i].members[x].user !== socket.username) {
        userDetails.push({
          name: chatsData[i].members[x].user,
          avatar: chatsData[i].members[x].avatar,
        });
      }
      for (let y = 0; y < chatsData[i].messages.length; y++) {
        sender = chatsData[i].messages[y].user;
        userLastMessage = chatsData[i].messages[y].message;
      }
    }
  }
  console.log(userDetails);
  console.log(userLastMessage);

  chatListGroup.innerHTML = userDetails
    .map(
      (user) =>
        `<div class="list-group-item list-group-item-action ${user.name}-chat" data-bs-toggle="list" href="${user.name}-chat" role="tab">
          <div class="d-flex justify-content-between align-items-center">
              <div class="user-avatar">
                  <img id="friend_list_avatar" class="me-1" src="assets/users/uploads/${user.avatar}" alt="user-row-avatar" />
              </div>
              <div class="user-chat px-2 me-2 py-2 py-md-0">
                  <p id="friend_list_username" class="m-0 mb-1">${user.name}</p>
                  <p id="last_message" class="small m-0">${sender}: ${userLastMessage}</p>
              </div>
          </div>
      </div>`
    )
    .join(" ");
}

function scrollController() {
  //   if (messagesContainer.scrollTop <= messagesContainer.scrollHeight - 633) {
  messagesContainer.scrollTo(0, messagesContainer.scrollHeight);
  //   }
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
  appendReceivedMessage(content, from);
  scrollController();
});

socket.on("initiate-chat", ({ initiated }) => {
  console.log(initiated);
  if (initiated !== true) {
    throw new Error("There was an error initiating the chat, please try again");
  }
});

socket.on("pre-loaded-chats", ({ chatsData }) => {
  if (is_chat_pre_loaded === false) {
    chatsListLoad(chatsData);
    scrollController();
  } else return;
});

// socket.on("loaded-chat", ({ chatData }) => {
//   if (chatData.messages.length <= 0) {
//     console.log("empty chat");
//   } else {
//     for (let i = 0; i < chatData.messages.length; i++) {
//       if (chatData.messages[i].user === socket.username) {
//         appendSentMessage(chatData.messages[i].message);
//       } else {
//         appendReceivedMessage(
//           chatData.messages[i].message,
//           chatData.messages[i].user
//         );
//       }
//     }
//     scrollController();
//   }
// });

// EVENT LISTENERS
messageInputForm.addEventListener("submit", (e) => {
  e.preventDefault();
  const message = messageInput.value;
  const to = socket.receiverUsername;
  if (message === "" || null) return;
  socket.emit("send-private-message", message, to);
  messageInput.value = "";
  appendSentMessage(message);
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
      pillsMessagesTab.removeAttribute("tabindex");
    }
  });
});

pillsMessagesTab.addEventListener("click", (e) => {
  if ((pillsMessages.className = "tab-pane fade active show")) {
    socket.emit("messages-tab");
  }
});
