setTimeout( async () => {
  const listTab = document.getElementById("list-tab");
  const chatTab = document.getElementById("chat_friend_list");
  const friendListTab = document.getElementById("friend_list_tab");
  const friendListLayout = document.getElementById("friend_list_layout");
  const notificationsTab = document.getElementById("notifications_tab");
  friendListLayout.classList.add(
    "d-flex",
    "flex-column",
    "justify-content-start",
    "align-items-center",
    friendListTab.children.length <= 1
  );
  if (friendListTab.children.length <= 0) {
    friendListLayout.classList.remove("justify-content-start");
    friendListLayout.classList.add("justify-content-center");
    let p = document.createElement("p");
    p.setAttribute("id", "friend_list_info");
    p.classList.add("text-center", "mx-5", "mt-3", "pb-3", "fs-6");
    p.textContent =
      "Your friend list is currently empty, add a friend by clicking on the button below";
    listTab.append(p);
  }

  chatTab.classList.add(
    "d-flex",
    "flex-column",
    "justify-content-center",
    chatTab.children.length <= 1
  );
  if (chatTab.children.length <= 2) {
    let p = document.createElement("p");
    p.setAttribute("id", "chat_list_info");
    p.classList.add("text-center", "mx-5", "mt-3", "pb-3", "fs-6");
    p.textContent =
      "There are currently no messages in your inbox, if you want to start a chat, go to Friends tab and select a friend to start chatting";
    chatTab.append(p);
  }

  notificationsTab.classList.add(
    "d-flex",
    "flex-column",
    "justify-content-center",
    "px-5",
    notificationsTab.children.length <= 1
  );
  if (notificationsTab.children.length <= 0) {
    let p = document.createElement("p");
    p.setAttribute("id", "notification_info");
    p.classList.add("text-center", "mx-5", "mt-3", "pb-3", "fs-6");
    p.innerText =
      "There are no notifications at the moment, you will be notified if anything arrives here!";
    notificationsTab.append(p);
  }
}, 800);
