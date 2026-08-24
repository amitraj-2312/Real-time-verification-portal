const WebSocket = require("ws");

const PORT = 8080;

const wss = new WebSocket.Server({
  port: PORT,
});

console.log(
  `WebSocket server running on ws://localhost:${PORT}`
);

// =====================================================
// BROADCAST HELPER
// =====================================================

function broadcast(data) {
  console.log("[Server] Broadcasting:", data);

  wss.clients.forEach((client) => {
    console.log(
      "[Server] Client readyState:",
      client.readyState
    );

    if (client.readyState === WebSocket.OPEN) {
      client.send(JSON.stringify(data));

      console.log(
        "[Server] Message sent to client:",
        data
      );
    }
  });
}

// =====================================================
// GENERATE TASK ID
// =====================================================

let nextTaskId = 5;

// =====================================================
// CLIENT CONNECTION
// =====================================================

wss.on("connection", (socket) => {
  console.log("Client connected");

  // Send connection confirmation
  socket.send(
    JSON.stringify({
      type: "CONNECTION_SUCCESS",
      message: "Connected to Operations Room",
    })
  );

  // ===================================================
  // MESSAGE
  // ===================================================

  socket.on("message", (message) => {
    try {
      const data = JSON.parse(message.toString());

      console.log("[Server] Received:", data);

      // =================================================
      // CREATE NEW TASK
      // =================================================

      if (
        data.type === "CREATE_TASK" ||
        data.type === "NEW_TASK" ||
        data.type === "TASK_CREATED"
      ) {
        const newTask = {
          id: Number(data.id) || nextTaskId++,

          title:
            data.title ||
            data.task?.title ||
            "New Verification Task",

          status:
            data.status ||
            data.task?.status ||
            "PENDING",

          category:
            data.category ||
            data.task?.category ||
            "Verification",

          priority:
            data.priority ||
            data.task?.priority ||
            "STANDARD",

          description:
            data.description ||
            data.task?.description ||
            "Verification task requiring review.",
        };

        console.log(
          "[Server] New task created:",
          newTask
        );

        // Broadcast new task to ALL connected clients
        broadcast({
          type: "TASK_CREATED",
          task: newTask,
        });

        return;
      }

      // =================================================
      // STATUS UPDATE
      // =================================================

      if (data.type === "STATUS_UPDATE") {
        console.log(
          "[Server] Status update received:",
          data
        );

        broadcast({
          type: "STATUS_UPDATE",
          taskId: Number(data.taskId),
          newStatus: data.newStatus,
        });

        return;
      }

      // =================================================
      // UNKNOWN MESSAGE
      // =================================================

      console.log(
        "[Server] Unknown message type:",
        data.type
      );
    } catch (error) {
      console.error(
        "[Server] Invalid WebSocket message:",
        error
      );
    }
  });

  // ===================================================
  // DISCONNECT
  // ===================================================

  socket.on("close", () => {
    console.log("Client disconnected");
  });

  // ===================================================
  // SOCKET ERROR
  // ===================================================

  socket.on("error", (error) => {
    console.error(
      "[Server] WebSocket client error:",
      error
    );
  });
});