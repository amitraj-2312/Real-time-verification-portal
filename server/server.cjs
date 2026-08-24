const WebSocket = require("ws");

const PORT = process.env.PORT || 8080;

const wss = new WebSocket.Server({
  port: PORT,
  host: "0.0.0.0",
});

console.log(`WebSocket server running on port ${PORT}`);

wss.on("connection", (ws) => {
  console.log("[Server] Client connected");

  ws.send(
    JSON.stringify({
      type: "CONNECTION_SUCCESS",
      message: "Joined Operations Room",
    })
  );

  ws.on("message", (message) => {
    try {
      const data = JSON.parse(message.toString());

      console.log("[Server] Received:", data);

      // ==========================================
      // STATUS UPDATE
      // ==========================================

      if (data.type === "STATUS_UPDATE") {
        const response = {
          type: "STATUS_UPDATE",
          taskId: data.taskId,
          newStatus: data.newStatus,
        };

        console.log(
          "[Server] Broadcasting:",
          response
        );

        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(response));
          }
        });

        return;
      }

      // ==========================================
      // CREATE TASK
      // ==========================================

      if (data.type === "CREATE_TASK") {
        const task = {
          ...data.task,
          status: "PENDING",
        };

        const response = {
          type: "TASK_CREATED",
          task,
        };

        console.log(
          "[Server] Broadcasting new task:",
          response
        );

        wss.clients.forEach((client) => {
          if (client.readyState === WebSocket.OPEN) {
            client.send(JSON.stringify(response));
          }
        });

        return;
      }
    } catch (error) {
      console.error(
        "[Server] Message error:",
        error
      );
    }
  });

  ws.on("close", () => {
    console.log("[Server] Client disconnected");
  });

  ws.on("error", (error) => {
    console.error(
      "[Server] WebSocket error:",
      error
    );
  });
});