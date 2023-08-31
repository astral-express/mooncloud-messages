// Toggles password visibility on button click
var password = document.getElementById("password");
var confirm_password = document.getElementById("confirm_password");
var toggler = document.getElementById("show_password");

const togglePasswordVisibility = () => {
  if (password.type == "password") {
    password.setAttribute("type", "text");
    confirm_password.setAttribute("type", "text");
    toggler.classList.remove("fa-eye");
    toggler.classList.add("fa-eye-slash");
  } else {
    toggler.classList.remove("fa-eye-slash");
    toggler.classList.add("fa-eye");
    password.setAttribute("type", "password");
    confirm_password.setAttribute("type", "password");
  }
};

toggler.addEventListener("click", togglePasswordVisibility);
