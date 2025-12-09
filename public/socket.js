// public/socket.js

// --- 1. DOM Element References (Check the IDs in your HTML) ---
const sendbtn = document.getElementById("send-btn");
const messageInput = document.getElementById("message-input");
const allMessage = document.getElementById("messages");
const imageInput = document.getElementById("image-upload");
const uploadBtn = document.getElementById("upload-btn"); // The 🖼️ icon
const previewContainer = document.getElementById("preview-container");
const imagePreview = document.getElementById("image-preview");
const removePreviewBtn = document.getElementById("remove-preview-btn");
const previewFilename = document.getElementById("preview-filename");
//const SERVER_URL = 'http://192.168.29.114:8080'; 
const socket = io();

// --- 2. ASYNCHRONOUS BASE64 CONVERTER (Required for Image Upload) ---
function getBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
        reader.onerror = error => reject(error);
    });
}

// --- 3. IMPLEMENT UPLOAD BUTTON LISTENER (Triggers file dialog) ---
uploadBtn.addEventListener('click', () => {
    imageInput.value = '';
    imageInput.click(); // Opens the hidden file selection dialog
});

// --- 4. MESSAGE SEND HANDLER (Uses your existing function) ---
async function handleMessageSend(e) {
    e.preventDefault(); 
    
    const message = messageInput.value.trim();
    const imageFile = imageInput.files[0];
    
    if (message !== '' || imageFile) {
        let imageData = null;

        if (imageFile) {
            // Note: You might want to add a file size check here before converting
            imageData = await getBase64(imageFile);
        }
        
        socket.emit("user-message", { 
            content: message, 
            image: imageData 
        }); 
        
        messageInput.value = ''; 
        imageInput.value = '';
        displayImagePreview(null);
        messageInput.focus();
    }
}

sendbtn.addEventListener("click", handleMessageSend);

// --- 5. UPDATED APPEND MESSAGE FUNCTION (Displays Images) ---

function appendMessage(data) {
    // Create a wrapper for the entire message bubble
    const messageContainer = document.createElement("div");
    
    // NOTE: You need server logic to send a 'user' property to differentiate 
    // messages. For now, we default to received.
 //   const isSent = (data.user === localStorage.getItem('username')); // Assumes username is saved
//    messageContainer.classList.add(isSent ? 'sent' : 'received'); 

    // --- Image Display Logic ---
    if (data.image) {
        const img = document.createElement("img");
        img.src = data.image; // Base64 data is displayed directly
        img.classList.add('chat-image'); // Ensure this class is defined in CSS
        
        messageContainer.append(img); 
    }

    // --- Text Content Logic ---
    const p = document.createElement("p");
    
    const timeString = data.time || new Date(data.timestamp).toLocaleTimeString();
    
    // Only display content if it exists, otherwise just the time (for image-only messages)
    if (data.content) {
        p.innerText = `${data.content}`; 
        messageContainer.append(p); 
    } 
    
    
    
    allMessage.append(messageContainer);
   
   
}

function displayImagePreview(file) {
    if (!file) {
        // Clear and hide if no file is selected (or file was removed)
        previewContainer.style.display = 'none';
        imagePreview.src = '#';
        previewFilename.textContent = '';
        return;
    }

    // 1. Show the container
    previewContainer.style.display = 'flex'; // Use 'flex' for alignment

    // 2. Display file name and size
    previewFilename.textContent = `Ready: ${file.name} (${(file.size / 1024).toFixed(2)} KB)`;

    // 3. Create a URL to display the image preview
    const reader = new FileReader();
    reader.onload = function(e) {
        imagePreview.src = e.target.result;
    };
    reader.readAsDataURL(file);
}

// Event listener: Watch for changes in the hidden file input
imageInput.addEventListener('change', (e) => {
    console.log("--- FILE SELECTION DETECTED! ---"); 
    const file = e.target.files[0];
    displayImagePreview(file);
});

// Event listener: Allow the user to cancel the selection
removePreviewBtn.addEventListener('click', () => {
    imageInput.value = ''; // Clear the file input
    displayImagePreview(null); // Hide the preview
});
// --- 6. SOCKET LISTENERS (No change needed here, they call the updated appendMessage) ---

socket.on('chat-history', (history) => {
    history.forEach(message => {
        appendMessage(message);
    });
     
    allMessage.scrollTop = allMessage.scrollHeight;
});

socket.on("reply-message", (data) => {
    appendMessage(data);
     
    allMessage.scrollTop = allMessage.scrollHeight;
});