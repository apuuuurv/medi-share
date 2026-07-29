import { io } from "socket.io-client";

const socket = io("http://localhost:5000");

const taskId = "6a6a3041f4e6e8054f07a241";

socket.on("connect", () => {
  console.log("✅ Connected to Socket.IO server! Socket ID:", socket.id);

  // 1. Join task room
  console.log(`Joining room: task_${taskId}`);
  socket.emit("join_task_room", taskId);

  // 2. Simulate streaming location every 3 seconds
  setInterval(() => {
    const lat = 19.076 + (Math.random() - 0.5) * 0.01;
    const lng = 72.8777 + (Math.random() - 0.5) * 0.01;
    console.log(
      `📡 Emitting live GPS location -> Lat: ${lat.toFixed(4)}, Lng: ${lng.toFixed(4)}`,
    );

    socket.emit("update_location", {
      taskId,
      latitude: lat,
      longitude: lng,
    });
  }, 3000);
});

// Listen for incoming location updates broadcast by other clients/volunteers
socket.on("volunteer_location_updated", (data) => {
  console.log("📍 Received Location Update:", data);
});

// Listen for status events triggered by HTTP calls (e.g. Accept / OTP Verify)
socket.on("task_status_changed", (data) => {
  console.log("⚡ Task Status Changed Event:", data);
});

socket.on("task_completed", (data) => {
  console.log("🎉 Task Completed Event Received:", data);
});
