import socket from "./client.socket.html.js";
const searchInput = document.getElementById("search_input");
const userCardsContainer = document.querySelector("[user-cards-container]");
const userCardTemplate = document.querySelector("[user-card-template]");
const searchButton = document.querySelector("[search-button]");
const addUserButton = document.getElementById("add_user_btn");
const searchInfo = document.querySelector("[search-info]");
const loggedUser =
  document.querySelector("[logged-user]").childNodes[3].textContent;

addUserButton.onclick = () => {
  searchInput.value = "";
  searchInfo.textContent = "";
  while (userCardsContainer.firstChild) {
    userCardsContainer.removeChild(userCardsContainer.lastChild);
  }
};

searchInput.addEventListener("change", async (e) => {
  if (e.target.value) {
    let searchInput = e.target.value.trim().toLowerCase();
    socket.emit("search-input", loggedUser, searchInput);
  } else {
    searchInfo.textContent = "Type a letter or username to search";
  }
});

socket.on("search-result", ({ usersResult, friendshipsResult }) => {
  searchedUsers(usersResult, friendshipsResult);
  searchInput.disabled = true;
  searchButton.disabled = true;
  inputCoolDown();
});

function inputCoolDown() {
  setTimeout(() => {
    searchInput.disabled = false;
    searchButton.disabled = false;
  }, 1000);
}

function searchedUsers(users, friendships) {
  searchInfo.textContent = users.length <= 0 ? "No users found" : "";
  let foundUsers = document.querySelectorAll(".search-user-username");
  if (foundUsers) {
    for (let i = 0; i < foundUsers.length; i++) {
      if (foundUsers[i].textContent) {
        let parentNode = foundUsers[i].parentNode;
        parentNode.parentNode.remove();
      }
    }
  }
  for (let i = 0; i < users.length; i++) {
    if (users[i].username !== loggedUser) {
      let searchedUser = users[i].username;
      const card = userCardTemplate.content.cloneNode(true).children[0];
      const cardUsername = card.querySelector("[username]");
      const cardAvatar = card.querySelector("[avatar]");
      const cardButton = card.querySelector("[action]");
      const cardDesc = card.querySelector("[desc]");
      // avatar
      cardAvatar.src =
        users[i].avatar !== "default_user_avatar.jpg"
          ? `assets/users/uploads/${users[i].avatar}`
          : `assets/users/default/default_user_avatar.jpg`;
      // username
      cardUsername.textContent = users[i].username;
      // body
      const icon = document.createElement("i");
      icon.classList.add("fa-solid");

      if (friendships) {
        for (let i = 0; i < friendships.length; i++) {
          let friendsUsername = friendships[i].username;
          let friendshipStatus = friendships[i].status;
          if (searchedUser === friendsUsername) {
            icon.classList.add("fa-user", friendshipStatus === 1);
            icon.setAttribute("id", "fa_user_icon", friendshipStatus === 1);
            cardButton.textContent =
              friendshipStatus === 1 ? "Friends " : "Add friend ";
            cardButton.setAttribute(
              "disabled",
              friendshipStatus === 1 || friendshipStatus === 2
            );
            cardDesc.textContent =
              friendshipStatus === 1
                ? "Already friends"
                : "Pending friend request";
            cardDesc.style.color =
              friendshipStatus === 1 ? "#44d9e8" : "#ffc107";
          } else {
            icon.classList.add("fa-plus");
            icon.setAttribute("id", "fa_plus_icon");
            cardButton.textContent = `Add friend `;
          }
          cardButton.append(icon);
        }
      } else {
        icon.classList.add("fa-plus");
        icon.setAttribute("id", "fa_plus_icon");
        cardButton.textContent = `Add friend `;
        cardButton.append(icon);
      }
      cardButton.addEventListener("click", (e) => {
        let target = e.target.parentNode.childNodes[1].textContent;
        socket.emit("friend-request", loggedUser, target);
      });
      userCardsContainer.append(card);
    }
  }
}

socket.on("is-friend-request-successful", ({ result }) => {
  if (result) {
    let user = document.querySelectorAll("[body]");
    for (let i = 0; i < user.length; i++) {
      let friendUsername = user[i].childNodes[1];
      let button = user[i].childNodes[3];
      let desc = user[i].childNodes[5];
      if (result === null || undefined) {
        desc.style.color = "#e44c55";
        desc.textContent = "There was an error, please try again";
      }
      if (friendUsername.textContent === result) {
        button.setAttribute("disabled", true);
        desc.style.color = "#3cf281";
        desc.textContent = "Friend request sent!";
      }
    }
  }
});

// socket.on("friendship-status", ({ friendshipID, status, username }) => {
//   if (status === "2") {
//     let user = document.querySelectorAll("[body]");
//     for (let i = 0; i < user.length; i++) {
//       let friendUsername = user[i].childNodes[1];
//       let button = user[i].childNodes[3];
//       let desc = user[i].childNodes[5];
//       if (friendUsername.textContent === username) {
//         button.setAttribute("disabled", true);
//         desc.style.color = "#ffc107";
//         desc.textContent = "Pending friend request";
//       }
//     }
//   }
// });
