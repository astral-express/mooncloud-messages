// DOM Selectors
const pillsNavbar = document.querySelectorAll("ul#pills-tab > li.nav-item");

const chatTabContent = document.getElementById("chat_tab_content");
const chatListGroup = document.getElementById("chat_list_group");

const socket = io();

// Variables
const chatIdMap = new Map();
const pillsNavbarMap = new Map();
let selectedChat;
let activePill;
let messageCounter = 0;
let messageNavbarCounter = 0;
let currentURL = window.location.pathname;

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

// Sockets
socket.on("connect_error", (err) => {
  if (err.message === "Invalid user") {
    new Error("Unauthorized access");
  }
});

socket.on("session", ({ sessionID, userID, username }) => {
  socket.auth = sessionID;
  localStorage.setItem("sessionID", sessionID);
  socket.userID = userID;
  socket.username = username;
  checkIfItsHomePage(username);
  socket.emit("friend-list-refresh", username);
  socket.emit("update-chat-list", username);
  socket.emit("check-friend-requests", username);
});

socket.on("message-sent", ({ content, chatID, messageID }) => {
  appendSentMessage(content, chatID, messageID);
});

socket.on(
  "receive-private-message",
  ({ content, from, to, chatID, messageID }) => {
    appendReceivedMessage(content, from, chatID, messageID);
    messageNotificationBadgeTrigger(chatID);
  }
);

socket.on("friend-chats-load", ({ chatsData }) => {
  chatsListLoad(chatsData);
});

socket.on("friend-list-update", ({ friends }) => {
  updateFriendList(friends);
});

socket.on("single-chat-loaded-response", ({ chatData }) => {
  chatMessagesLoad(chatData);
});

socket.on("new-friend-request", ({ from, to }) => {
  socket.emit("check-friend-requests", to);
});

socket.on("pending-friend-requests", ({ pendingFriendRequests }) => {
  notificationsController(pendingFriendRequests);
});

socket.on("is-friend-declined", ({ result }) => {
  removeNotification(result);
});

socket.on("is-friend-accepted", ({ result }) => {
  socket.emit("friend-list-refresh", socket.username);
  removeNotification(result);
});

socket.on("open-initiated-chat", ({ requesterUsername, receiverUsername }) => {
  updateChatList(requesterUsername, receiverUsername);
});

/**
 *
 * @param {String} username
 *
 * Gets username from URL and checks if it's /user/username or home page
 */
function checkIfItsHomePage(username) {
  if (currentURL === `/user/${username}`) {
    for (let i = 0; i < pillsNavbar.length; i++) {
      pillsNavbarMap.set(pillsNavbar[i].childNodes[1].id, { active: false });
      pillsNavbar[i].addEventListener("click", (e) => {
        activePill = e.target.id;
        pillsNavbarMap.forEach(currentActivePill);
      });
    }
  }
}

/**
 *
 * @param {Object} value
 * @param {String} key
 *
 * Checks which navbar pill is currently active by setting its value to true and the rest is false
 */
function currentActivePill(value, key) {
  if (activePill === key) {
    if (value.active === false) {
      pillsNavbarMap.set(key, { active: true });
    }
  } else {
    pillsNavbarMap.set(key, { active: false });
  }
}

/**
 *
 * @param {Object} value
 * @param {String} key
 *
 * Checks if current chat is active (if user has focus on it)
 */
function isChatActive(value, key) {
  if (selectedChat === key) {
    if (value.active === false) {
      chatIdMap.set(key, { active: true });
    }
  } else {
    chatIdMap.set(key, { active: false });
  }
}

// a bug with message calculation might occur for multiple messages received at the same time
function removeMessageNotificationBadgeFromFriendList(chatID) {
  const friendListRowSpan = document.querySelectorAll(
    "span#friend_list_row_message_notification_badge"
  );
  const navMessagesTabSpan = document.getElementById(
    "nav_message_notification_badge"
  );
  for (let i = 0; i < friendListRowSpan.length; i++) {
    let ariaChatID = friendListRowSpan[i].getAttribute("chat");
    if (ariaChatID === chatID) {
      messageCounter = 0;
      messageNavbarCounter = 0;
      friendListRowSpan[i].remove();
      if (navMessagesTabSpan !== null) {
        navMessagesTabSpan.remove();
      } else return;
    }
  }
}

function appendMessageNotificationBadgeOnNavbar() {
  const navMessagesTabSpan = document.getElementById(
    "nav_message_notification_badge"
  );
  let messagesTabs = document.getElementById("pills-messages-tab");
  if (navMessagesTabSpan !== null) {
    if (messageNavbarCounter === 0) {
      navMessagesTabSpan.style.display = "none";
    } else {
      navMessagesTabSpan.style.display = "inline";
      navMessagesTabSpan.textContent = messageNavbarCounter;
    }
  } else {
    const navNotificationBadge = document.createElement("span");
    navNotificationBadge.setAttribute("id", "nav_message_notification_badge");
    navNotificationBadge.classList.add(
      "badge",
      "text-bg-danger",
      "rounded-pill",
      "ms-auto"
    );
    messagesTabs.append(navNotificationBadge);
    if (messageNavbarCounter >= 99) {
      messageNavbarCounter = 99 + "+";
      navNotificationBadge.textContent = messageNavbarCounter;
    }
  }
}

function appendMessageNotificationBadgeOnFriendList(chatID, placeholder) {
  const friendListRowSpan = document.querySelectorAll(
    "span#friend_list_row_message_notification_badge"
  );
  if (friendListRowSpan.length === 0) {
    const notificationBadge = document.createElement("span");
    notificationBadge.setAttribute(
      "id",
      "friend_list_row_message_notification_badge"
    );
    notificationBadge.setAttribute("chat", `${chatID}`);
    notificationBadge.classList.add(
      "badge",
      "text-bg-danger",
      "rounded-pill",
      "ms-auto"
    );
    const placeholderChild = placeholder.querySelector("div.d-flex");
    placeholderChild.append(notificationBadge);
    notificationBadge.textContent = messageCounter;
  } else {
    for (let i = 0; i < friendListRowSpan.length; i++) {
      let ariaChatID = friendListRowSpan[i].getAttribute("chat");
      let notificationBadge = friendListRowSpan[i];
      if (ariaChatID === chatID) {
        if (messageCounter >= 99) {
          messageCounter = 99 + "+";
          notificationBadge.textContent = messageCounter;
        } else {
          notificationBadge.textContent = messageCounter;
        }
      }
    }
  }
}

function messageNotificationBadgeTrigger(chatID) {
  let chats = document.querySelectorAll("div#friend_list_row.list-group-item");
  for (let i = 0; i < chats.length; i++) {
    let ariaChatID = chats[i].getAttribute("chat");
    let selected = chatIdMap.get(chatID);
    if (selected.active === false) {
      if (ariaChatID === chatID) {
        let placeholder = chats[i];
        messageCounter++;
        appendMessageNotificationBadgeOnFriendList(chatID, placeholder);
      }
    }
  }
  if (activePill !== "pills-message-tab") {
    messageNavbarCounter = messageCounter;
    appendMessageNotificationBadgeOnNavbar();
  }
}

/**
 *
 * @param {String} message
 * @param {String} sender
 * @param {String} chatID
 *
 * Updates last message sent from the chat in the friend list column respectively
 */
function lastMessageUpdate(message, sender, chatID) {
  let lastMessage = document.getElementById(`last_message_${chatID}`);
  if (lastMessage !== null) {
    if (sender !== null) {
      lastMessage.textContent = `${message}`;
    } else {
      lastMessage.textContent = `You: ${message}`;
    }
  }
}

function appendReceivedMessage(
  message,
  from,
  chatID,
  messageID,
  dateSent,
  dateRead
) {
  let chats = document.querySelectorAll("[chat-container]");
  for (let i = 0; i < chats.length; i++) {
    let friend = chats[i].getAttribute("friend");
    if (friend === from) {
      let chat = chats[i];
      const bubbleContainer = document.createElement("div");
      bubbleContainer.setAttribute("id", `message`);
      bubbleContainer.classList.add(
        "d-flex",
        "flex-column",
        "align-items-start",
        "justify-content-center",
        "me-auto",
        "pb-2"
      );

      const sender = document.createElement("span");
      sender.classList.add("ms-1", "small");
      sender.innerText = from;

      const bubbleText = document.createElement("p");
      bubbleText.setAttribute("id", "received_message");
      bubbleText.setAttribute("message_id", `${messageID}`);
      bubbleText.setAttribute("sent_at", `${dateSent}`);
      bubbleText.classList.add(
        "m-0",
        "text-white",
        "text-bubble-received",
        "p-2",
        "bg-primary",
        "rounded"
      );

      const seenMark = document.createElement("span");
      seenMark.setAttribute("id", "received_message_info_mark");
      seenMark.classList.add("text-primary", "ms-auto", "me-1", "small");

      bubbleText.innerText = message;
      bubbleContainer.append(sender, bubbleText, seenMark);
      chat.append(bubbleContainer);

      if (dateSent && dateRead) {
        bubbleText.setAttribute("read_at", `${dateRead}`);
        let result = unixConversion(dateSent, "sent");
        receivedMessageInfoMark(result);
      } else if (dateSent && !dateRead) {
        let result = unixConversion(dateSent, "sent");
        receivedMessageInfoMark(result);
      } else {
        bubbleText.setAttribute("read_at", "false");
      }
    }
  }
  scrollController(chatID, messageID);
  lastMessageUpdate(message, from, chatID);
  checkIfMessageWasRead(chatID);
}

function appendSentMessage(message, chatID, messageID, dateSent, dateRead) {
  let chats = document.querySelectorAll("[chat-container]");
  for (let i = 0; i < chats.length; i++) {
    let friend = chats[i].getAttribute("friend");
    if (friend === socket.friend) {
      let chat = chats[i];
      const bubbleContainer = document.createElement("div");
      bubbleContainer.setAttribute("id", `message`);
      bubbleContainer.classList.add(
        "d-flex",
        "flex-column",
        "align-items-end",
        "justify-content-center",
        "ms-auto",
        "pb-2"
      );

      const sender = document.createElement("span");
      sender.classList.add("text-secondary", "ms-auto", "me-1", "small");
      sender.innerText = "You";

      const bubbleText = document.createElement("p");
      bubbleText.setAttribute("id", "sent_message");
      bubbleText.setAttribute("message_id", `${messageID}`);
      bubbleText.classList.add(
        "text-bubble-sent",
        "p-2",
        "bg-secondary",
        "rounded",
        "m-0",
        "text-white"
      );
      bubbleText.innerText = message;

      const seenMark = document.createElement("span");
      seenMark.setAttribute("id", "sent_message_info_mark");
      seenMark.classList.add("text-secondary", "ms-auto", "me-1", "small");

      bubbleContainer.append(sender, bubbleText, seenMark);
      chat.append(bubbleContainer);

      if (dateSent && dateRead) {
        bubbleText.setAttribute("read_at", `${dateRead}`);
        let result = unixConversion(dateRead, "seen");
        sentMessageInfoMark(result);
      } else if (dateSent && !dateRead) {
        bubbleText.setAttribute("sent_at", `${dateSent}`);
        bubbleText.setAttribute("read_at", "false");
        let result = unixConversion(dateSent, "sent");
        sentMessageInfoMark(result);
      } else {
        let date = Math.floor(new Date().getTime() / 1000);
        bubbleText.setAttribute("sent_at", `${date}`);
        bubbleText.setAttribute("read_at", "false");
        let result = unixConversion(date, "sent");
        sentMessageInfoMark(result);
      }
    }
  }
  scrollController(chatID, messageID);
  lastMessageUpdate(message, null, chatID);
  //   checkIfMessageWasRead(chatID);
}

function chatMessagesLoad(chatData) {
  for (let i = 0; i < chatData.members.length; i++) {
    if (chatData.members[i].user !== socket.username) {
      socket.friend = chatData.members[i].user;
    }
  }
  let isChatLoaded = document.querySelectorAll(
    "div#friend_list_row.list-group-item"
  );
  for (let i = 0; i < isChatLoaded.length; i++) {
    let friend = isChatLoaded[i].getAttribute("friend");
    let loaded = isChatLoaded[i].getAttribute("loaded");
    if (socket.friend === friend) {
      if (loaded === "0") {
        for (let i = 0; i < chatData.messages.length; i++) {
          if (chatData.messages[i].user === socket.username) {
            appendSentMessage(
              chatData.messages[i].message,
              chatData.chatID,
              chatData.messages[i].message_id,
              chatData.messages[i].dateSent,
              chatData.messages[i].dateRead
            );
          } else {
            socket.friend = chatData.messages[i].user;
            appendReceivedMessage(
              chatData.messages[i].message,
              chatData.messages[i].user,
              chatData.chatID,
              chatData.messages[i].message_id,
              chatData.messages[i].dateSent,
              chatData.messages[i].dateRead
            );
          }
        }
        isChatLoaded[i].setAttribute("loaded", "1");
      }
    }
  }
}

function chatsListLoad(chatsData) {
  let userDetails = [];
  let lastMsgObj = {};
  for (let i = 0; i < chatsData.length; i++) {
    let userObj = {};
    for (let x = 0; x < chatsData[i].members.length; x++) {
      if (chatsData[i].members[x].user !== socket.username) {
        userObj = {
          chatID: chatsData[i].chatID,
          name: chatsData[i].members[x].user,
          avatar: chatsData[i].members[x].avatar,
        };
      }
    }
    if (!chatsData[i].last_message) {
      lastMsgObj = {
        sender: "",
        lastMessage: "",
      };
    } else {
      if (chatsData[i].last_message.user === socket.username) {
        lastMsgObj = {
          sender: "You:",
          lastMessage: chatsData[i].last_message.message,
        };
      } else {
        lastMsgObj = {
          sender: "",
          lastMessage: chatsData[i].last_message.message,
        };
      }
      Object.assign(userObj, lastMsgObj);
    }
    userDetails.push(userObj);
    chatIdMap.set(chatsData[i].chatID, { loaded: false, active: false });
  }

  chatListGroup.innerHTML = userDetails
    .map((user) => {
      if (!user.lastMessage) {
        if (user.avatar) {
          return `<div id="friend_list_row" class="list-group-item list-group-item-action" data-bs-toggle="list" href="#tab-chat-with-${user.name}" role="tab" chat="${user.chatID}" friend="${user.name}" loaded="0" aria-selected="false" tabindex="-1">
            <div class="d-flex justify-content-center align-items-center">
              <div class="user-avatar">
                <img id="friend_list_row_avatar" class="me-1" src="assets/users/uploads/${user.avatar}" alt="user-row-avatar" />
              </div>
              <div class="user-chat px-2 ms-1 my-3 py-md-0">
                <p id="friend_list_row_username" class="m-0 mb-1 fs-5">${user.name}</p>
                <p id="last_message_${user.chatID}" class="m-0 mb-1 fs-6" chat="${user.chatID}"></p>
              </div>
            </div>
          </div>`;
        } else {
          return `<div id="friend_list_row" class="list-group-item list-group-item-action" data-bs-toggle="list" href="#tab-chat-with-${user.name}" role="tab" chat="${user.chatID}" friend="${user.name}" loaded="0" aria-selected="false" tabindex="-1">
            <div class="d-flex justify-content-center align-items-center">
              <div class="user-avatar">
                <img id="friend_list_row_avatar" class="me-1" src="assets/users/default/default_user_avatar.jpg" alt="default-user-row-avatar" />
              </div>
              <div class="user-chat px-2 ms-1 my-3 py-md-0">
                <p id="friend_list_row_username" class="m-0 mb-1 fs-5">${user.name}</p>
                <p id="last_message_${user.chatID}" class="m-0 mb-1 fs-6" chat="${user.chatID}"></p>
              </div>
            </div>
          </div>`;
        }
      } else {
        if (user.avatar) {
          return `<div id="friend_list_row" class="list-group-item list-group-item-action" data-bs-toggle="list" href="#tab-chat-with-${user.name}" role="tab" chat="${user.chatID}" friend="${user.name}" loaded="0" aria-selected="false" tabindex="-1">
          <div class="d-flex justify-content-center align-items-center">
            <div class="user-avatar">
              <img id="friend_list_row_avatar" class="me-1" src="assets/users/uploads/${user.avatar}" alt="user-row-avatar" />
            </div>
            <div class="user-chat px-2 ms-1 my-1 py-md-0">
              <p id="friend_list_row_username" class="m-0 mb-1 fs-5">${user.name}</p>
              <p id="last_message_${user.chatID}" class="m-0 mb-1 fs-6" chat="${user.chatID}">${user.sender} ${user.lastMessage}</p>
            </div>
          </div>
        </div>`;
        } else {
          return `<div id="friend_list_row" class="list-group-item list-group-item-action" data-bs-toggle="list" href="#tab-chat-with-${user.name}" role="tab" chat="${user.chatID}" friend="${user.name}" loaded="0" aria-selected="false" tabindex="-1">
          <div class="d-flex justify-content-center align-items-center">
            <div class="user-avatar">
              <img id="friend_list_row_avatar" class="me-1" src="assets/users/default/default_user_avatar.jpg" alt="default-user-row-avatar" />
            </div>
            <div class="user-chat px-2 ms-1 my-1 py-md-0">
              <p id="friend_list_row_username" class="m-0 mb-1 fs-5">${user.name}</p>
              <p id="last_message_${user.chatID}" class="m-0 mb-1 fs-6" chat="${user.chatID}">${user.sender} ${user.lastMessage}</p>
            </div>
          </div>
        </div>`;
        }
      }
    })
    .join(" ");

  chatTabContent.innerHTML = userDetails
    .map((user) => {
      if (!user.avatar) {
        return `<div class="tab-pane" id="tab-chat-with-${user.name}" role="tabpanel">
        <div id="chat_container" class="d-flex flex-column justify-content-between ms-3 p-2">
            <div class="separator">
                <div id="chat_header" class="d-flex align-items-center p-2 px-4 z-3">
                    <div id="header_avatar">
                        <img id="friend_list_row_avatar" class="me-1" src="assets/users/default/default_user_avatar.jpg" alt="default-user-row-avatar" />
                    </div>
                    <p id="header_username" class="m-0 ms-2 fs-5">${user.name}</p>
                </div>
                <div chat-container="${user.name}" id="chat_with_${user.name}" class="d-flex flex-column justify-content-between p-2 scrollable" friend="${user.name}" chat="${user.chatID}"></div>
            </div>
            <div class="chat-input">
                <form id="message_form" class="mb-1">
                    <div class="input-group">
                        <input id="message_input" type="text" class="form-control text-white" placeholder="Type a message..." aria-label="Recipient's username" aria-describedby="button-addon2">
                        <button id="send_message_to_${user.name}" class="btn btn-secondary" type="submit" chat="${user.chatID}">Send <i class="fa-solid fa-chevron-right"></i></button>
                    </div>
                </form>
            </div>
        </div>
    </div>`;
      } else {
        return `<div class="tab-pane" id="tab-chat-with-${user.name}" role="tabpanel">
        <div id="chat_container" class="d-flex flex-column justify-content-between ms-3 p-2">
            <div class="separator">
                <div id="chat_header" class="d-flex align-items-center p-2 px-4 z-3">
                    <div id="header_avatar">
                        <img id="friend_list_row_avatar" class="me-1" src="assets/users/uploads/${user.avatar}" alt="user-row-avatar" />
                    </div>
                    <p id="header_username" class="m-0 ms-2 fs-5">${user.name}</p>
                </div>
                <div chat-container="${user.name}" id="chat_with_${user.name}" class="d-flex flex-column justify-content-between p-2 scrollable" friend="${user.name}" chat="${user.chatID}"></div>
            </div>
            <div class="chat-input">
                <form id="message_form" class="mb-1">
                    <div class="input-group">
                        <input id="message_input" type="text" class="form-control text-white" placeholder="Type a message..." aria-label="Recipient's username" aria-describedby="button-addon2">
                        <button id="send_message_to_${user.name}" class="btn btn-secondary" type="submit" chat="${user.chatID}">Send <i class="fa-solid fa-chevron-right"></i></button>
                    </div>
                </form>
            </div>
        </div>
    </div>`;
      }
    })
    .join(" ");

  const triggerTabList = document.querySelectorAll(
    "#chat_list_group div#friend_list_row"
  );
  triggerTabList.forEach((triggerEl) => {
    const tabTrigger = new bootstrap.Tab(triggerEl);

    triggerEl.addEventListener("click", (event) => {
      event.preventDefault();
      tabTrigger.show();
    });
  });
  messagesTabActive();
}

function unixConversion(date, type) {
  if (date) {
    let sentDateNum = Number(date);
    let unixTimestamp = new Date(sentDateNum * 1000);
    let hours = unixTimestamp.getHours();
    let minutes = unixTimestamp.getMinutes();
    if (minutes < 10) minutes = `0${minutes}`;
    if (type == "sent") {
      let string = `Sent • ${hours}:${minutes}`;
      return string;
    } else if (type == "seen") {
      let string = `Seen • ${hours}:${minutes}`;
      return string;
    } else {
      new Error("Error: Incorrect type value");
    }
  } else {
    new Error("Error: Undefined date argument");
  }
}

function onClickMessageDetail(chatID) {
  let selected = chatIdMap.get(chatID);
  if (selected.active === true) {
    const messages = document.querySelectorAll("div#message");
    if (messages.length !== 0) {
      for (let i = 0; i < messages.length; i++) {
        messages[i].addEventListener("click", (e) => {
          let seenMark = messages[i].childNodes[2];
          if (seenMark) {
            if (seenMark.style.display === "block") {
              seenMark.style.display = "none";
            } else {
              seenMark.style.display = "block";
            }
          }
        });
      }
    }
  }
}

function checkIfMessageWasRead(chatID) {
  let selected = chatIdMap.get(chatID);
  if (selected.active === true) {
    let messages = document.querySelectorAll("div#message");
    if (messages.length !== 0) {
      for (let i = 0; i < messages.length; i++) {
        let messageText = messages[i].childNodes[1];
        // let messageSeenMark = messages[i].childNodes[2].textContent;
        let messageTextID = messageText.getAttribute("id");
        if (messageTextID === "received_message") {
          let isMessageRead = messageText.getAttribute("read_at");
          if (isMessageRead !== "false") {
            let result = unixConversion(isMessageRead, "seen");
            sentMessageInfoMark(result);
          } else {
            let messageID = messageText.getAttribute("message_id");
            let date = Math.floor(new Date().getTime() / 1000);
            let result = unixConversion(date, "seen");
            sentMessageInfoMark(result);
            socket.emit("seen", chatID, messageID);
          }
        }
      }
    }
  }
}

function sentMessageInfoMark(result) {
  let sentMessageSeenMark = document.querySelectorAll(
    "div#message > span#sent_message_info_mark"
  );
  if (sentMessageSeenMark) {
    for (let i = 0; i < sentMessageSeenMark.length; i++) {
      if (sentMessageSeenMark[i].textContent.trim() !== "") {
        sentMessageSeenMark[i].style.display = "none";
      }
    }
    let lastMessageMark = sentMessageSeenMark[sentMessageSeenMark.length - 1];
    if (lastMessageMark) {
      lastMessageMark.textContent = result;
      lastMessageMark.style.display = "inline-block";
    }
  }
}

function receivedMessageInfoMark(result) {
  let receivedMessageSeenMark = document.querySelectorAll(
    "div#message > span#received_message_info_mark"
  );
  if (receivedMessageSeenMark) {
    for (let i = 0; i < receivedMessageSeenMark.length; i++) {
      receivedMessageSeenMark[i].style.display = "none";
    }
    let messageMark =
      receivedMessageSeenMark[receivedMessageSeenMark.length - 1];
    if (messageMark) {
      messageMark.textContent = result;
    }
  }
}

function scrollController() {
  let container = document.querySelectorAll("div#chat_container > div.chat");
  for (let i = 0; i < container.length; i++) {
    if (container[i].scrollTop <= container[i].scrollHeight - 633) {
      container[i].scrollTo(0, container[i].scrollHeight);
    }
  }
}

function notificationsController(data) {
  if (data) {
    let notificationsTab = document.getElementById("notifications_tab");
    let notificationsCounter = document.getElementById("notifications-count");
    notificationsCounter.textContent = data.length;
    notificationsTab.innerHTML = data
      .map((user) => {
        if (user.avatar !== "") {
          return `<div id="notification_row" class="p-3 pt-1 mb-4">
                      <div class="d-flex flex-column justify-content-center align-items-center">
                          <div class="d-flex align-items-center">
                              <div class="user-avatar">
                                  <img id="friend_list_row_avatar" class="me-1" src="assets/users/uploads/${user.avatar}" alt="user-row-avatar" />
                              </div>
                              <div class="user-username ms-2 py-2 py-md-0">
                                  <p id="friend_list_row_username" class="m-0 fs-6"><span class="text-secondary fs-5"><strong>${user.username}</strong></span>  has sent you a friend request</p>
                              </div>
                          </div>
                          <div class="d-flex align-items-center py-2">
                              <button
                                  decline-btn="${user.username}"
                                  type="button"
                                  class="btn btn-danger me-1"
                              >
                              Decline
                              <i class="fa-solid fa-xmark"></i>
                              </button>
                              <button
                                  accept-btn="${user.username}"
                                  type="button"
                                  class="btn btn-success ms-1"
                              >
                              Accept
                              <i class="fa-solid fa-check"></i>
                              </button>
                          </div>
                      </div>
                  </div>`;
        } else {
          return `<div id="notification_row" class="p-3 pt-1 mb-4">
                      <div class="d-flex flex-column justify-content-center align-items-center">
                          <div class="d-flex align-items-center">
                              <div class="user-avatar">
                                  <img id="friend_list_row_avatar" class="me-1" src="assets/users/default/${user.defaultAvatar}" alt="user-row-avatar" />
                              </div>
                              <div class="user-username ms-2 py-2 py-md-0">
                                  <p id="friend_list_row_username" class="m-0 fs-6"><span class="text-secondary fs-5"><strong>${user.username}</strong></span>  has sent you a friend request</p>
                              </div>
                          </div>
                          <div class="d-flex align-items-center py-2">
                              <button
                                  decline-btn="${user.username}"
                                  type="button"
                                  class="btn btn-danger me-1"
                              >
                              Decline
                              <i class="fa-solid fa-xmark"></i>
                              </button>
                              <button
                                  accept-btn="${user.username}"
                                  type="button"
                                  class="btn btn-success ms-1"
                              >
                              Accept
                              <i class="fa-solid fa-check"></i>
                              </button>
                          </div>
                      </div>
                  </div>`;
        }
      })
      .join(" ");
    notificationsButtonsController();
  }
}

function notificationsButtonsController() {
  let acceptBtn = document.querySelectorAll("[accept-btn]");
  let declineBtn = document.querySelectorAll("[decline-btn]");

  for (let i = 0; i < acceptBtn.length; i++) {
    acceptBtn[i].addEventListener("click", (e) => {
      let requester = acceptBtn[i].getAttribute("accept-btn");
      socket.emit("accept-friend-request", requester, socket.username);
    });
  }

  for (let i = 0; i < declineBtn.length; i++) {
    declineBtn[i].addEventListener("click", (e) => {
      let requester = declineBtn[i].getAttribute("decline-btn");
      socket.emit("decline-friend-request", requester, socket.username);
    });
  }
}

function removeNotification(result) {
  let notificationsTab = document.getElementById("notifications_tab");
  let friendListRow = notificationsTab.querySelectorAll("#notification_row");
  for (let i = 0; i < friendListRow.length; i++) {
    let username =
      friendListRow[i].childNodes[1].childNodes[1].childNodes[3].childNodes[1]
        .childNodes[0].textContent;
    if (result === username) {
      friendListRow[i].remove();
      checkIfNotificationsAreEmpty();
    }
  }
}

function checkIfNotificationsAreEmpty() {
  const notificationsTab = document.getElementById("notifications_tab");
  const notificationCount = document.getElementById("notifications-count");
  notificationsTab.classList.add(
    "d-flex",
    "flex-column",
    "justify-content-center",
    "px-5",
    notificationsTab.children.length <= 1
  );
  if (notificationsTab.children.length <= 1) {
    let p = document.createElement("p");
    p.setAttribute("id", "notification_info");
    p.classList.add("text-center", "mx-5", "mt-3", "pb-3", "fs-6");
    p.innerText =
      "There are no notifications at the moment, you will be notified if anything arrives here!";
    notificationsTab.append(p);
    notificationCount.remove();
  }
}

function updateFriendList(friends) {
  if (friends) {
    let friendListTab = document.getElementById("friend_list_tab");
    let friendListTabDetails = document.getElementById("v-pills-tabContent");
    friendListTab.innerHTML = friends
      .map((friend) => {
        if (friend.avatar !== "") {
          return `<div id="friend_list_row" class="p-3">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="user-avatar">
                        <img id="friend_list_row_avatar" class="me-1" src="assets/users/uploads/${friend.avatar}" alt="user-row-avatar" />
                    </div>
                    <div class="user-username px-2 me-2 py-2 py-md-0">
                        <p id="friend_list_row_username" class="m-0 fs-5">${friend.username}</p>
                    </div>
                    <button
                        type="button"
                        class="btn btn-secondary ms-md-2 ms-auto"
                        id="v-pills-profile-tab"
                        data-bs-toggle="pill"
                        data-bs-target="#v-pills-profile-${friend.username}"
                        role="tab"
                        aria-controls="v-pills-profile"
                        aria-selected="false"
                    >
                    Profile
                    <i class="fa-solid fa-chevron-right"></i>
                    </button>
                </div>
            </div>`;
        } else {
          return `<div id="friend_list_row" class="p-3">
                <div class="d-flex justify-content-between align-items-center">
                    <div class="user-avatar">
                        <img id="friend_list_row_avatar" class="me-1" src="assets/users/default/default_user_avatar.jpg" alt="default-user-row-avatar" />
                    </div>
                    <div class="user-username px-2 me-2 py-2 py-md-0">
                        <p id="friend_list_row_username" class="m-0 fs-5">${friend.username}</p>
                    </div>
                    <button
                        type="button"
                        class="btn btn-secondary ms-md-2 ms-auto"
                        id="v-pills-profile-tab"
                        data-bs-toggle="pill"
                        data-bs-target="#v-pills-profile-${friend.username}"
                        role="tab"
                        aria-controls="v-pills-profile"
                        aria-selected="false"
                    >
                    Profile
                    <i class="fa-solid fa-chevron-right"></i>
                    </button>
                </div>
            </div>`;
        }
      })
      .join(" ");

    friendListTabDetails.innerHTML = friends
      .map((friend) => {
        if (friend.avatar !== "") {
          return `<div
            class="tab-pane fade"
            id="v-pills-profile-${friend.username}"
            role="tabpanel"
            aria-labelledby="v-pills-profile-tab"
            tabindex="0"
            >
                <div id="user_details" class="d-flex flex-column align-items-center bg-dark p-4">
                    <div class="user-details-avatar">
                        <img id="user_details_avatar" class="me-1" src="assets/users/uploads/${friend.avatar}" alt="user-details-avatar" />
                    </div>
                    <div id="user_details_username" class="user-details-username pt-2 pb-1">
                        <p class="m-0">${friend.username}</p>
                    </div>
                    <div class="user-details-description w-85 pb-3">
                        <p class="m-0 small text-break text-center">Lorem ipsum dolor sit amet.</p>
                    </div>
                    <div class="user-details-action">
                        <button
                            friend="${friend.username}"
                            id="initiate_chat"
                            type="button"
                            class="btn btn-secondary"
                            >
                            <i class="fa-solid fa-message me-1"></i>
                            Message
                        </button>
                    </div>
                </div>
            </div>`;
        } else {
          return `<div
            class="tab-pane fade"
            id="v-pills-profile-${friend.username}"
            role="tabpanel"
            aria-labelledby="v-pills-profile-tab"
            tabindex="0"
            >
                <div id="user_details" class="d-flex flex-column align-items-center bg-dark p-4">
                    <div class="user-details-avatar">
                        <img id="user_details_avatar" class="me-1" src="assets/users/default/default_user_avatar.jpg" alt="default-user-details-avatar" />
                    </div>
                    <div id="user_details_username" class="user-details-username pt-2 pb-1">
                        <p class="m-0">${friend.username}</p>
                    </div>
                    <div class="user-details-description w-85 pb-3">
                        <p class="m-0 small text-break text-center">Lorem ipsum dolor sit amet.</p>
                    </div>
                    <div class="user-details-action">
                        <button
                            friend="${friend.username}"
                            id="initiate_chat"
                            type="button"
                            class="btn btn-secondary"
                            >
                            <i class="fa-solid fa-message me-1"></i>
                            Message
                        </button>
                    </div>
                </div>
            </div>`;
        }
      })
      .join(" ");
    messageButtonsController();
  }
}

function messageButtonsController() {
  let initiateButtons = document.querySelectorAll("#initiate_chat");
  for (let i = 0; i < initiateButtons.length; i++) {
    initiateButtons[i].addEventListener("click", (e) => {
      let friend = initiateButtons[i].getAttribute("friend");
      socket.emit("initiate-chat", socket.username, friend);
    });
  }
}

function updateChatList(user, friend) {
  socket.emit("update-chat-list", user);
  openChatTab(user, friend);
}

function openChatTab(user, friend) {
  if (user && friend) {
    const friendsTab = document.getElementById("pills-friends");
    const friendsTabButton = document.getElementById("pills-friends-tab");

    const messagesTab = document.getElementById("pills-messages");
    const messagesTabButton = document.getElementById("pills-messages-tab");

    friendsTab.classList.remove("active");
    setTimeout(() => {
      friendsTab.classList.remove("show");
    }, 200);

    messagesTab.classList.add("active");
    setTimeout(() => {
      messagesTab.classList.add("show");
    }, 200);

    friendsTabButton.classList.remove("active");
    friendsTabButton.setAttribute("aria-selected", "false");
    friendsTabButton.setAttribute("tabindex", "-1");

    messagesTabButton.classList.add("active");
    messagesTabButton.setAttribute("aria-selected", "true");
    messagesTabButton.removeAttribute("tabindex", "-1");
    openSelectedChat(friend);
  }
}

function openSelectedChat(friend) {
    const friendListRow = document.querySelector(`#chat_list_group div[href="#tab-chat-with-${friend}"]`);
    friendListRow.click();
    console.log(friendListRow);
}

// EVENT LISTENERS
const messagesTabActive = () => {
  const messageInputForm = chatTabContent.querySelectorAll(
    "div.chat-input > form"
  );
  messageInputForm.forEach((submit) => {
    submit.addEventListener("submit", (e) => {
      e.preventDefault();
      const message = e.target[0].value;
      const to = e.target[1].id.split("_").pop();
      const chatID = e.target[1].getAttribute("chat");
      if (message === "" || null || undefined) return;
      socket.emit("send-private-message", message, to, chatID);
      e.target[0].value = "";
    });
  });

  const friendListRows = chatListGroup.querySelectorAll("#friend_list_row");
  friendListRows.forEach((row) => {
    row.addEventListener("click", (e) => {
      let chatID = e.currentTarget.getAttribute("chat");
      socket.emit("request-single-chat-load", chatID);
      selectedChat = chatID;
      chatIdMap.forEach(isChatActive);
      let selected = chatIdMap.get(chatID);
      if (selected.active === true) {
        setTimeout(() => {
          onClickMessageDetail(chatID);
          checkIfMessageWasRead(chatID);
        }, 10);
      }
      removeMessageNotificationBadgeFromFriendList(chatID);
    });
  });
};

export default socket;
