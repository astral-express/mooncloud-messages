"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
// DOM Selectors
const pillsNavbar = document.querySelectorAll("ul#pills-tab > li.nav-item");
const chatTabContent = document.getElementById("chat_tab_content");
const chatListGroup = document.getElementById("chat_list_group");
const chatInitiationBtn = document.querySelectorAll("div.user-details-action > button");
const pillsMessagesTab = document.getElementById("pills-messages-tab");
const pillsFriendsTab = document.getElementById("pills-friends-tab");
const pillsMessages = document.getElementById("pills-messages");
const pillsFriends = document.getElementById("pills-friends");
const socket = io();
// Variables
const chatIdMap = new Map();
const pillsNavbarMap = new Map();
let selectedChat;
let activePill;
let messageCounter = 0;
let messageNavbarCounter = 0;
let lastKnownScrollPosition = 0;
let mooncloudServiceFirstTimeLoad = false;
let currentURL = window.location.pathname;
let isHomePage = false;
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
});
socket.on("message-sent", ({ content, chatID, messageID }) => {
    appendSentMessage(content, chatID, messageID);
});
socket.on("receive-private-message", ({ content, from, to, chatID, messageID }) => {
    appendReceivedMessage(content, from, chatID, messageID);
    messageNotificationBadgeTrigger(chatID);
});
socket.on("friend-list-rows-load", ({ chatsData }) => {
    chatsListLoad(chatsData);
});
socket.on("loaded-chat", ({ chatData }) => {
    chatMessagesLoad(chatData);
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
    }
    else {
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
    }
    else {
        chatIdMap.set(key, { active: false });
    }
}
// a bug with message calculation might occur for multiple messages received at the same time
function removeMessageNotificationBadgeFromFriendList(chatID) {
    const friendListRowSpan = document.querySelectorAll("span#friend_list_row_message_notification_badge");
    const navMessagesTabSpan = document.getElementById("nav_message_notification_badge");
    for (let i = 0; i < friendListRowSpan.length; i++) {
        let ariaChatID = friendListRowSpan[i].getAttribute("chat");
        if (ariaChatID === chatID) {
            messageCounter = 0;
            messageNavbarCounter = 0;
            friendListRowSpan[i].remove();
            if (navMessagesTabSpan !== null) {
                navMessagesTabSpan.remove();
            }
            else
                return;
        }
    }
}
function appendMessageNotificationBadgeOnNavbar() {
    const navMessagesTabSpan = document.getElementById("nav_message_notification_badge");
    let messagesTabs = document.getElementById("pills-messages-tab");
    if (navMessagesTabSpan !== null) {
        if (messageNavbarCounter === 0) {
            navMessagesTabSpan.style.display = "none";
        }
        else {
            navMessagesTabSpan.style.display = "inline";
            navMessagesTabSpan.textContent = messageNavbarCounter;
        }
    }
    else {
        const navNotificationBadge = document.createElement("span");
        navNotificationBadge.setAttribute("id", "nav_message_notification_badge");
        navNotificationBadge.classList.add("badge", "text-bg-danger", "rounded-pill", "ms-auto");
        messagesTabs.append(navNotificationBadge);
        if (messageNavbarCounter >= 99) {
            messageNavbarCounter = 99 + "+";
            navNotificationBadge.textContent = messageNavbarCounter;
        }
    }
}
function appendMessageNotificationBadgeOnFriendList(chatID, placeholder) {
    const friendListRowSpan = document.querySelectorAll("span#friend_list_row_message_notification_badge");
    if (friendListRowSpan.length === 0) {
        const notificationBadge = document.createElement("span");
        notificationBadge.setAttribute("id", "friend_list_row_message_notification_badge");
        notificationBadge.setAttribute("chat", `${chatID}`);
        notificationBadge.classList.add("badge", "text-bg-danger", "rounded-pill", "ms-auto");
        const placeholderChild = placeholder.querySelector("div.d-flex");
        placeholderChild.append(notificationBadge);
        notificationBadge.textContent = messageCounter;
    }
    else {
        for (let i = 0; i < friendListRowSpan.length; i++) {
            let ariaChatID = friendListRowSpan[i].getAttribute("chat");
            let notificationBadge = friendListRowSpan[i];
            if (ariaChatID === chatID) {
                if (messageCounter >= 99) {
                    messageCounter = 99 + "+";
                    notificationBadge.textContent = messageCounter;
                }
                else {
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
        }
        else {
            lastMessage.textContent = `You: ${message}`;
        }
    }
}
function appendReceivedMessage(message, from, chatID, messageID, dateSent, dateRead) {
    let chats = document.querySelectorAll("div#chat_container > div.chat");
    for (let i = 0; i < chats.length; i++) {
        let friend = chats[i].getAttribute("friend");
        if (friend === from) {
            let chat = chats[i];
            const bubbleContainer = document.createElement("div");
            bubbleContainer.setAttribute("id", `message`);
            bubbleContainer.classList.add("d-flex", "flex-column", "align-items-start", "justify-content-center", "me-auto", "pb-2");
            const sender = document.createElement("span");
            sender.classList.add("ms-1", "small");
            sender.innerText = from;
            const bubbleText = document.createElement("p");
            bubbleText.setAttribute("id", "received_message");
            bubbleText.setAttribute("message_id", `${messageID}`);
            bubbleText.setAttribute("sent_at", `${dateSent}`);
            bubbleText.classList.add("m-0", "text-white", "text-bubble-received", "p-2", "bg-primary", "rounded");
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
            }
            else if (dateSent && !dateRead) {
                let result = unixConversion(dateSent, "sent");
                receivedMessageInfoMark(result);
            }
            else {
                bubbleText.setAttribute("read_at", "false");
            }
        }
    }
    scrollController(chatID, messageID);
    lastMessageUpdate(message, from, chatID);
    checkIfMessageWasRead(chatID);
}
function appendSentMessage(message, chatID, messageID, dateSent, dateRead) {
    let chats = document.querySelectorAll(`div#chat_container > div.chat`);
    for (let i = 0; i < chats.length; i++) {
        let friend = chats[i].getAttribute("friend");
        if (friend === socket.friend) {
            let chat = chats[i];
            const bubbleContainer = document.createElement("div");
            bubbleContainer.setAttribute("id", `message`);
            bubbleContainer.classList.add("d-flex", "flex-column", "align-items-end", "justify-content-center", "ms-auto", "pb-2");
            const sender = document.createElement("span");
            sender.classList.add("text-secondary", "ms-auto", "me-1", "small");
            sender.innerText = "You";
            const bubbleText = document.createElement("p");
            bubbleText.setAttribute("id", "sent_message");
            bubbleText.setAttribute("message_id", `${messageID}`);
            bubbleText.classList.add("text-bubble-sent", "p-2", "bg-secondary", "rounded", "m-0", "text-white");
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
            }
            else if (dateSent && !dateRead) {
                bubbleText.setAttribute("sent_at", `${dateSent}`);
                bubbleText.setAttribute("read_at", "false");
                let result = unixConversion(dateSent, "sent");
                sentMessageInfoMark(result);
            }
            else {
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
    let isChatLoaded = document.querySelectorAll("div#friend_list_row.list-group-item");
    for (let i = 0; i < isChatLoaded.length; i++) {
        let friend = isChatLoaded[i].getAttribute("friend");
        let loaded = isChatLoaded[i].getAttribute("loaded");
        if (socket.friend === friend) {
            if (loaded === "0") {
                for (let i = 0; i < chatData.messages.length; i++) {
                    if (chatData.messages[i].user === socket.username) {
                        appendSentMessage(chatData.messages[i].message, chatData.chatID, chatData.messages[i].message_id, chatData.messages[i].dateSent, chatData.messages[i].dateRead);
                    }
                    else {
                        socket.friend = chatData.messages[i].user;
                        appendReceivedMessage(chatData.messages[i].message, chatData.messages[i].user, chatData.chatID, chatData.messages[i].message_id, chatData.messages[i].dateSent, chatData.messages[i].dateRead);
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
        }
        else {
            if (chatsData[i].last_message.user === socket.username) {
                lastMsgObj = {
                    sender: "You:",
                    lastMessage: chatsData[i].last_message.message,
                };
            }
            else {
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
            return `<div id="friend_list_row" class="list-group-item list-group-item-action" data-bs-toggle="list" href="#tab-chat-with-${user.name}" role="tab" chat="${user.chatID}" friend="${user.name}" loaded="0">
          <div class="d-flex justify-content-left align-items-center">
            <div class="user-avatar">
              <img id="friend_list_row_avatar" class="me-1" src="assets/users/uploads/${user.avatar}" alt="user-row-avatar" />
            </div>
            <div class="user-chat px-2 ms-1 my-3 py-md-0">
              <p id="friend_list_row_username" class="m-0 mb-1 fs-5">${user.name}</p>
              <p id="last_message_${user.chatID}" class="m-0 mb-1 fs-6" chat="${user.chatID}"></p>
            </div>
          </div>
        </div>`;
        }
        else {
            return `<div id="friend_list_row" class="list-group-item list-group-item-action" data-bs-toggle="list" href="#tab-chat-with-${user.name}" role="tab" chat="${user.chatID}" friend="${user.name}" loaded="0">
          <div class="d-flex justify-content-left align-items-center">
            <div class="user-avatar">
              <img id="friend_list_row_avatar" class="me-1" src="assets/users/uploads/${user.avatar}" alt="user-row-avatar" />
            </div>
            <div class="user-chat px-2 ms-1 my-1 py-md-0">
              <p id="friend_list_row_username" class="m-0 mb-1 fs-5">${user.name}</p>
              <p id="last_message_${user.chatID}" class="m-0 mb-1 fs-6" chat="${user.chatID}">${user.sender} ${user.lastMessage}</p>
            </div>
          </div>
        </div>`;
        }
    })
        .join(" ");
    chatTabContent.innerHTML = userDetails
        .map((user) => {
        return `<div class="tab-pane" id="tab-chat-with-${user.name}" role="tabpanel">
        <div id="chat_container" class="d-flex flex-column justify-content-between ms-3 p-2">
            <div id="chat_with_${user.name}" class="chat d-flex flex-column justify-content-between p-2 scrollable" friend="${user.name}" chat="${user.chatID}"></div>
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
    })
        .join(" ");
    messagesTabActive();
}
function unixConversion(date, type) {
    if (date) {
        let sentDateNum = Number(date);
        let unixTimestamp = new Date(sentDateNum * 1000);
        let hours = unixTimestamp.getHours();
        let minutes = unixTimestamp.getMinutes();
        if (minutes < 10)
            minutes = `0${minutes}`;
        if (type == "sent") {
            let string = `Sent • ${hours}:${minutes}`;
            return string;
        }
        else if (type == "seen") {
            let string = `Seen • ${hours}:${minutes}`;
            return string;
        }
        else {
            new Error("Error: Incorrect type value");
        }
    }
    else {
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
                        }
                        else {
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
                    }
                    else {
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
    let sentMessageSeenMark = document.querySelectorAll("div#message > span#sent_message_info_mark");
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
    let receivedMessageSeenMark = document.querySelectorAll("div#message > span#received_message_info_mark");
    if (receivedMessageSeenMark) {
        for (let i = 0; i < receivedMessageSeenMark.length; i++) {
            receivedMessageSeenMark[i].style.display = "none";
        }
        let messageMark = receivedMessageSeenMark[receivedMessageSeenMark.length - 1];
        if (messageMark) {
            messageMark.textContent = result;
        }
    }
}
function scrollController(chatID, messageID) {
    let container = document.querySelectorAll("div#chat_container > div.chat");
    for (let i = 0; i < container.length; i++) {
        if (container[i].scrollTop <= container[i].scrollHeight - 633) {
            container[i].scrollTo(0, container[i].scrollHeight);
        }
    }
}
// EVENT LISTENERS
const messagesTabActive = () => {
    const messageInputForm = chatTabContent.querySelectorAll("div.chat-input > form");
    messageInputForm.forEach((submit) => {
        submit.addEventListener("submit", (e) => {
            e.preventDefault();
            const message = e.target[0].value;
            const to = e.target[1].id.split("_").pop();
            const chatID = e.target[1].getAttribute("chat");
            if (message === "" || null || undefined)
                return;
            socket.emit("send-private-message", message, to, chatID);
            e.target[0].value = "";
        });
    });
    const friendListRows = chatListGroup.querySelectorAll("#friend_list_row");
    friendListRows.forEach((row) => {
        row.addEventListener("click", (e) => {
            let chatID = e.currentTarget.getAttribute("chat");
            socket.emit("load-chat", chatID);
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
exports.default = socket;
//# sourceMappingURL=client.socket.html.js.map