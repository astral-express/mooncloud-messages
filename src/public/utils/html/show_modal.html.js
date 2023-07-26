// Displays bootstrap modal on page load
var loginPathName = "/login";
var signUpPathName = "/signup";

window.addEventListener("DOMContentLoaded", () => {
  let pathName = window.location.pathname;
  openModalBasedOnPathName(pathName);
});

var openModalBasedOnPathName = (pathName) => {
  if (pathName === loginPathName) {
    window.onload = () => {
      let login_modal = new bootstrap.Modal("#login-modal");
      login_modal.show();
    };
  }

  if (pathName === signUpPathName) {
    window.onload = () => {
      let signup_modal = new bootstrap.Modal("#signup-modal");
      signup_modal.show();
    };
  }
};
