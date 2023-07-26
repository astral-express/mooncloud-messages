// Form validation
let fields = document.querySelectorAll("#signup-modal input");
let nextBtn = document.getElementById("nextBtn");
let passwordErrorMsg = document.getElementById("password_error_msg");
let passwordSuccessMsg = document.getElementById("password_success_msg");
let confirmPasswordErrorMsg = document.getElementById(
  "confirm_password_error_msg"
);
let confirmPasswordSuccessMsg = document.getElementById(
  "confirm_password_success_msg"
);
let emailErrorMsg = document.getElementById("email_error_msg");
let usernameField = document.getElementById("username");
let submitBtn = document.getElementById("submit_finish_btn");
let usernameSuccessMsg = document.getElementById("username_success_msg");
let usernameErrorMsg = document.getElementById("username_error_msg");

const fieldsArray = Array.from(fields);

// Fields input validation
for (let i = 0; i < fieldsArray.length; i++) {
  fieldsArray[i].addEventListener("keyup", () => {
    let emailField = fieldsArray[0].value.trim();
    let passwordField = fieldsArray[1].value.trim();
    let confirmPasswordField = fieldsArray[2].value.trim();
    let isEmailValidated = emailValidation(emailField);
    let isPasswordValidated = passwordValidation(
      passwordField,
      confirmPasswordField
    );
    if (isEmailValidated === true && isPasswordValidated === true) {
      nextBtn.disabled = false;
    } else {
      nextBtn.disabled = true;
    }
  });
}

// Email validation
let emailValidation = (email) => {
  if (email.search(/^[\w-\.]+@([\w-]+\.)+[\w-]{2,4}$/) < 0) {
    emailErrorMsg.innerHTML = "Your email address is not valid";
    return false;
  } else {
    emailErrorMsg.innerHTML = "";
    return true;
  }
};

// Password validation
let passwordValidation = (password, confirm_password) => {
  let errors = [];

  if (password.search(/(?=.*[a-z])/i) < 0) {
    errors.push("Your password must contain at least one letter");
  }
  if (password.search(/(?=.*[0-9])/) < 0) {
    errors.push("Your password must contain at least one digit");
  }
  if (password.search(/(?=.*[A-Z])/) < 0) {
    errors.push("Your password must contain at least one uppercase letter");
  }
  if (password.search(/(?=.*[!@#$%^&*])/) < 0) {
    errors.push("Your password must contain at least one special character");
  }
  if (password.length < 6) {
    errors.push("Your password must be at least 6 characters long");
  }
  if (errors.length > 0) {
    passwordErrorMsg.innerHTML = errors[0];
    passwordSuccessMsg.innerHTML = "";
    return false;
  }
  if (errors.length === 0) {
    passwordErrorMsg.innerHTML = "";
    passwordSuccessMsg.innerHTML = "Looks good!";

    if (password != confirm_password) {
      confirmPasswordSuccessMsg.innerHTML = "";
      confirmPasswordErrorMsg.innerHTML = "Your passwords do not match!";
      return false;
    } else {
      confirmPasswordErrorMsg.innerHTML = "";
      confirmPasswordSuccessMsg.innerHTML = "Your passwords match!";
      return true;
    }
  }
};

// Username validation
usernameField.addEventListener("keyup", (e) => {
  let username = e.target.value.trim();
  let isUsernameValidated = usernameValidation(username);
  if (isUsernameValidated === true) {
    submitBtn.disabled = false;
  } else {
    submitBtn.disabled = true;
  }
});

let usernameValidation = (username) => {
  let isUsernameValidated = checkIfItsAlphabeticalOrNumeralChar(username);
  if (isUsernameValidated === false) {
    usernameSuccessMsg.innerHTML = "";
    usernameErrorMsg.innerHTML = "Username cannot contain special characters";
    return false;
  } else if (!isUsernameValidated === false) {
    usernameSuccessMsg.innerHTML = "";
    usernameErrorMsg.innerHTML = "Username cannot contain uppercase characters";
    return false;
  } else if (username.length <= 3) {
    usernameSuccessMsg.innerHTML = "";
    usernameErrorMsg.innerHTML = "Username must be at least 3 characters long";
    return false;
  } else if (username.length > 16) {
    usernameSuccessMsg.innerHTML = "";
    usernameErrorMsg.innerHTML = "Username can have maximum of 16 characters";
    return false;
  } else {
    usernameSuccessMsg.innerHTML = "Looks good!";
    usernameErrorMsg.innerHTML = "";
    return true;
  }
};

// Checks if string is within the range of letters and numbers in ascii table
let checkIfItsAlphabeticalOrNumeralChar = (str) => {
  for (let i = 0; i < str.length; i++) {
    let char = str[i].charCodeAt(0);
    if (char >= 65 && char <= 90) {
      return true;
    }
    if ((char >= 48 && char <= 57) || (char >= 97 && char <= 122)) continue;
    else return false;
  }
};
