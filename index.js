require('dotenv').config();
const express = require("express");
const http = require("http");
const app = express();
const server = http.createServer(app);
const path = require("path");
const { Server } = require("socket.io");
const io = new Server(server);
const mongoose = require("mongoose");

const DB_URI = process.env.MONGO_URL;

mongoose
  .connect(DB_URI)
  .then(() => console.log("Connected to MongoDB!"))
  .catch((err) => console.error("Could not connect to MongoDB:", err));

const messageSchema = new mongoose.Schema({
  content: String,
  image: String,
  timestamp: { type: Date, default: Date.now },
});
const Message = mongoose.model("Message", messageSchema);
app.use(express.static(path.resolve("./public")));

app.get("/", (req, res) => {
  return res.sendFile("./public/index.html");
});

/*io.on("connection", (socket) => {
  socket.on("user-message", (message) => {
    io.emit("reply-message", message);
  });
});*/

io.on("connection", async (socket) => {
  console.log(`A user connected: ${socket.id}`);

  // 1. LOAD HISTORY ON CONNECTION

  try {
    // Find the last 50 messages, sorted by oldest first
    const history = await Message.find({})
      .sort({ timestamp: 1 })
      .limit(50)
      .exec();

    // Send the history array ONLY to the connecting client
    socket.emit("chat-history", history);
  } catch (error) {
    console.error("Error loading history:", error);
  }

  // 2. HANDLE NEW MESSAGE SUBMISSION
  // 'content' is expected to be a simple string (the message text)
  socket.on("user-message", async (data) => {
    if (!data || (!data.content && !data.image)) {
      return;
    }
    try {
      // A) Save the message to MongoDB
      const newMessage = new Message({
        content: data.content,
        image: data.image,
      });
      await newMessage.save();

      // B) Broadcast the saved message to ALL connected clients
      io.emit("reply-message", {
        content: newMessage.content,
        image: newMessage.image,
        // Send a friendly time format
        time: new Date(newMessage.timestamp).toLocaleTimeString(),
      });
    } catch (error) {
      console.error("Error saving message:", error);
    }
  });

  socket.on("disconnect", () => {
    console.log(`User disconnected: ${socket.id}`);
  });
});
const PORT = process.env.PORT || 8080;
const HOST = "0.0.0.0";

server.listen(PORT, HOST, () => {
  console.log(`Server is running at http://${HOST}:${PORT}`);
  console.log("Use this address on other devices to connect!");
});
