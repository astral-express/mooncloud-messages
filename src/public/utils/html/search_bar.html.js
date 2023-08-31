const searchInput = document.getElementById("search_input");

let searchFriends = (users) => {
  searchInput.addEventListener("input", (e) => {
    let input = e.target.value.toLowerCase();
    console.log(input);
    users.forEach((user) => {
      const isVisible = user.username.toLowerCase(input);
      user.element.classList.toggle("hide", !isVisible);
    });
  });
}
