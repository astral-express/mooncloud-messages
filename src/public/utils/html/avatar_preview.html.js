// Function for pre-loading avatar on client side
let avatar_preview = document.getElementById("avatar_preview");
let upload_user_avatar = document.getElementById("upload_user_avatar");

upload_user_avatar.addEventListener("change", () => {
  preloadAvatar(upload_user_avatar, avatar_preview);
});

let preloadAvatar = (upload_user_avatar, avatar_preview) => {
  let file = upload_user_avatar.files[0];
  let reader = new FileReader();

  reader.readAsDataURL(file);
  reader.onload = () => {
    avatar_preview.src = reader.result;
  };
};
