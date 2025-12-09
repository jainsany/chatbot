// public/login/login.js

// --- 1. DOM Element References ---
const loginForm = document.getElementById("login-form");
const registerForm = document.getElementById("register-form");
const showLoginBtn = document.getElementById("show-login");
const showRegisterBtn = document.getElementById("show-register");

const loginMessage = document.getElementById("login-message");
const registerMessage = document.getElementById("register-message");

const chatAppUrl = "../index.html"; // URL of the main chat page

// --- 2. Form Toggling Functionality ---
function showForm(formId) {
  // Hide all forms
  loginForm.classList.add("hidden");
  registerForm.classList.add("hidden");

  // Deactivate all buttons
  showLoginBtn.classList.remove("active");
  showRegisterBtn.classList.remove("active");

  if (formId === "login") {
    loginForm.classList.remove("hidden");
    showLoginBtn.classList.add("active");
  } else {
    registerForm.classList.remove("hidden");
    showRegisterBtn.classList.add("active");
  }
}

// Attach event listeners to the switch buttons
showLoginBtn.addEventListener("click", () => showForm("login"));
showRegisterBtn.addEventListener("click", () => showForm("register"));

// Initially show the login form
showForm("login");

// --- 3. Core Submission Function ---

// Helper function to display messages
function displayMessage(element, message, isError = true) {
  element.innerText = message;
  element.style.color = isError ? "red" : "green";
  element.style.visibility = "visible";
}

/**
 * Handles sending form data to the backend
 * @param {string} endpoint - '/login' or '/register'
 * @param {object} data - { username, password }
 * @param {HTMLElement} msgElement - The element to display messages in
 */
async function handleSubmit(endpoint, data, msgElement) {
  try {
    msgElement.style.visibility = "hidden"; // Hide previous message

    const response = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await response.json();

    if (response.ok && result.success) {
      // Success! Redirect to the chat app.
      displayMessage(msgElement, result.message + ". Redirecting...", false);
      // Store username in local storage temporarily to use in chat
      localStorage.setItem("username", result.username);
      setTimeout(() => {
        window.location.href = chatAppUrl;
      }, 1000); // Wait 1 second before redirecting
    } else {
      // Handle server-side validation or authentication errors
      displayMessage(
        msgElement,
        result.message || "An unknown error occurred."
      );
    }
  } catch (error) {
    console.error("Network Error:", error);
    displayMessage(msgElement, "Could not connect to the server.");
  }
}

// --- 4. Attach Form Submission Listeners ---

// A. Login Form Listener
loginForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const username = document.getElementById("login-username").value;
  const password = document.getElementById("login-password").value;

  const data = { username, password };
  handleSubmit("/login", data, loginMessage);
});

// B. Registration Form Listener
registerForm.addEventListener("submit", (e) => {
  e.preventDefault();

  const username = document.getElementById("register-username").value;
  const password = document.getElementById("register-password").value;
  const confirmPassword = document.getElementById(
    "register-confirm-password"
  ).value;

  // Client-side password validation
  if (password !== confirmPassword) {
    return displayMessage(registerMessage, "Passwords do not match.");
  }
  if (password.length < 6) {
    return displayMessage(
      registerMessage,
      "Password must be at least 6 characters."
    );
  }

  const data = { username, password };
  handleSubmit("/register", data, registerMessage);
});
