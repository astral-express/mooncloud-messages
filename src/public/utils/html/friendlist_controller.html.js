const listTab = document.getElementById("list-tab");
const chatTab = document.getElementById("chat_friend_list");
const friendListLayout = document.getElementById("friend_list_layout");

friendListLayout.classList.add(
  "d-flex",
  "flex-column",
  "justify-content-center",
  listTab.children.length <= 1
);
chatTab.classList.add(
  "d-flex",
  "flex-column",
  "justify-content-center",
  chatTab.children.length <= 1
);

if (listTab.children.length <= 1) {
  let p = document.createElement("p");
  p.setAttribute("id", "friend_list_info");
  p.classList.add("text-center", "mx-5", "mt-3", "pb-3", "fs-6");
  p.textContent =
    "Your friend list is currently empty, add a friend by clicking on the button below";
  listTab.append(p);
}

if (chatTab.children.length <= 1) {
  let p = document.createElement("p");
  p.setAttribute("id", "chat_list_info");
  p.classList.add("text-center", "mx-5", "mt-3", "pb-3", "fs-6");
  p.textContent =
    "There are currently no messages in your inbox, if you want to start a chat, go to Friends tab and select a friend to start chatting";
  chatTab.append(p);
}
