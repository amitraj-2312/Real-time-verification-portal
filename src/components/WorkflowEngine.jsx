import {
  useCallback,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";

import KanbanColumn from "./KanbanColumn";
import CreateTaskModal from "./CreateTaskModal";

const SOCKET_URL =
  import.meta.env.VITE_SOCKET_URL ||
  "ws://localhost:8080";

const INITIAL_TASKS = [
  {
    id: 1,
    title: "Verify Identity Documents",
    category: "Identity",
    priority: "HIGH",
    description: "Verify identity documents.",
    status: "PENDING",
  },
  {
    id: 2,
    title: "Validate Address",
    category: "Address",
    priority: "STANDARD",
    description: "Validate customer address.",
    status: "PENDING",
  },
  {
    id: 3,
    title: "Review Payment Details",
    category: "Financial Risk",
    priority: "HIGH",
    description: "Review payment information.",
    status: "IN_PROGRESS",
  },
  {
    id: 4,
    title: "Final Verification",
    category: "Compliance",
    priority: "STANDARD",
    description: "Complete final verification.",
    status: "COMPLETED",
  },
];

function WorkflowEngine() {
  // =========================================================
  // STATE
  // =========================================================

  const [tasks, setTasks] = useState(INITIAL_TASKS);

  const [connectionStatus, setConnectionStatus] =
    useState("CONNECTING");

  const [isCreateModalOpen, setIsCreateModalOpen] =
    useState(false);

  // =========================================================
  // REFS
  // =========================================================

  const wsRef = useRef(null);

  const reconnectTimeoutRef = useRef(null);

  const retryCountRef = useRef(0);

  const isUnmountedRef = useRef(false);

  // =========================================================
  // CONNECTION STATE
  // =========================================================

  const isOnline =
    connectionStatus === "CONNECTED";

  const isConnecting =
    connectionStatus === "CONNECTING";

  // =========================================================
  // HANDLE INCOMING WEBSOCKET MESSAGE
  // =========================================================

  const handleSocketMessage = useCallback(
    (event) => {
      try {
        const data = JSON.parse(event.data);

        console.log(
          "[WebSocket] Message received:",
          data
        );

        // =====================================================
        // CONNECTION SUCCESS
        // =====================================================

        if (
          data.type === "CONNECTION_SUCCESS"
        ) {
          console.log(
            "[WebSocket] Joined Operations Room:",
            data.message
          );

          setConnectionStatus("CONNECTED");

          return;
        }

        // =====================================================
        // STATUS UPDATE
        // =====================================================

        if (
          data.type === "STATUS_UPDATE"
        ) {
          const taskId = Number(data.taskId);

          const newStatus = data.newStatus;

          console.log(
            "[WebSocket] Processing status update:",
            {
              taskId,
              newStatus,
            }
          );

          setTasks((currentTasks) => {
            return currentTasks.map((task) => {
              if (
                Number(task.id) === taskId
              ) {
                return {
                  ...task,
                  status: newStatus,
                  updatedAt: Date.now(),
                };
              }

              return task;
            });
          });

          console.log(
            "[Analytics] Task status mutated via WebSocket"
          );

          return;
        }

        // =====================================================
        // TASK CREATED
        // =====================================================

        if (
          data.type === "TASK_CREATED"
        ) {
          const newTask = data.task;

          console.log(
            "[WebSocket] TASK_CREATED received:",
            newTask
          );

          if (!newTask) {
            console.warn(
              "[WebSocket] TASK_CREATED has no task"
            );

            return;
          }

          setTasks((currentTasks) => {
            const exists =
              currentTasks.some(
                (task) =>
                  String(task.id) ===
                  String(newTask.id)
              );

            if (exists) {
              console.log(
                "[WebSocket] Task already exists:",
                newTask.id
              );

              return currentTasks;
            }

            return [
              ...currentTasks,
              {
                ...newTask,
                status:
                  newTask.status ||
                  "PENDING",
              },
            ];
          });

          console.log(
            "[WebSocket] New task added to dashboard"
          );

          return;
        }

        // =====================================================
        // CREATE TASK RESPONSE
        // Some servers may return CREATE_TASK
        // =====================================================

        if (
          data.type === "CREATE_TASK"
        ) {
          const newTask =
            data.task || data;

          if (
            !newTask ||
            !newTask.title
          ) {
            return;
          }

          console.log(
            "[WebSocket] CREATE_TASK received:",
            newTask
          );

          setTasks((currentTasks) => {
            const exists =
              currentTasks.some(
                (task) =>
                  String(task.id) ===
                  String(newTask.id)
              );

            if (exists) {
              return currentTasks;
            }

            return [
              ...currentTasks,
              {
                ...newTask,
                status:
                  newTask.status ||
                  "PENDING",
              },
            ];
          });

          return;
        }
      } catch (error) {
        console.error(
          "[WebSocket] Failed to parse message:",
          error
        );
      }
    },
    []
  );

  // =========================================================
  // CONNECT WEBSOCKET
  // =========================================================

  const connectWebSocket = useCallback(() => {
    if (isUnmountedRef.current) {
      return;
    }

    // Prevent duplicate connections
    if (
      wsRef.current &&
      (
        wsRef.current.readyState ===
          WebSocket.OPEN ||
        wsRef.current.readyState ===
          WebSocket.CONNECTING
      )
    ) {
      return;
    }

    console.log(
      "[WebSocket] Connecting to:",
      SOCKET_URL
    );

    setConnectionStatus("CONNECTING");

    const ws = new WebSocket(
      SOCKET_URL
    );

    wsRef.current = ws;

    // =====================================================
    // OPEN
    // =====================================================

    ws.onopen = () => {
      if (isUnmountedRef.current) {
        ws.close();
        return;
      }

      console.log(
        "[WebSocket] Connected successfully"
      );

      retryCountRef.current = 0;

      setConnectionStatus(
        "CONNECTED"
      );
    };

    // =====================================================
    // MESSAGE
    // =====================================================

    ws.onmessage =
      handleSocketMessage;

    // =====================================================
    // ERROR
    // =====================================================

    ws.onerror = (error) => {
      console.warn(
        "[WebSocket] Socket error:",
        error
      );
    };

    // =====================================================
    // CLOSE
    // =====================================================

    ws.onclose = () => {
      if (isUnmountedRef.current) {
        return;
      }

      console.warn(
        "[WebSocket] Connection closed"
      );

      setConnectionStatus(
        "DISCONNECTED"
      );

      if (
        wsRef.current === ws
      ) {
        wsRef.current = null;
      }

      const attempt =
        retryCountRef.current;

      const delay = Math.min(
        1000 *
          Math.pow(2, attempt),
        30000
      );

      retryCountRef.current += 1;

      console.log(
        `[WebSocket] Reconnecting in ${
          delay / 1000
        } seconds...`
      );

      clearTimeout(
        reconnectTimeoutRef.current
      );

      reconnectTimeoutRef.current =
        setTimeout(() => {
          if (
            !isUnmountedRef.current
          ) {
            connectWebSocket();
          }
        }, delay);
    };
  }, [handleSocketMessage]);

  // =========================================================
  // INITIAL CONNECTION
  // =========================================================

  useEffect(() => {
    isUnmountedRef.current = false;

    connectWebSocket();

    return () => {
      isUnmountedRef.current = true;

      console.log(
        "[WebSocket] Cleaning up connection..."
      );

      clearTimeout(
        reconnectTimeoutRef.current
      );

      reconnectTimeoutRef.current =
        null;

      if (wsRef.current) {
        wsRef.current.close();

        wsRef.current = null;
      }
    };
  }, [connectWebSocket]);

  // =========================================================
  // UPDATE TASK STATUS
  // =========================================================

  const updateTaskStatus = useCallback(
    (taskId, newStatus) => {
      const socket =
        wsRef.current;

      if (
        !socket ||
        socket.readyState !==
          WebSocket.OPEN
      ) {
        console.warn(
          "[WebSocket] Cannot send status update. Socket is offline."
        );

        return;
      }

      const payload = {
        type: "STATUS_UPDATE",
        taskId: Number(taskId),
        newStatus,
      };

      console.log(
        "[WebSocket] Sending status update:",
        payload
      );

      socket.send(
        JSON.stringify(payload)
      );
    },
    []
  );

  // =========================================================
  // APPROVE
  // PENDING -> IN_PROGRESS
  // =========================================================

  const approveTask = useCallback(
    (taskId) => {
      console.log(
        "[Task] Approving task:",
        taskId
      );

      updateTaskStatus(
        taskId,
        "IN_PROGRESS"
      );
    },
    [updateTaskStatus]
  );

  // =========================================================
  // REJECT
  // PENDING -> REJECTED
  // =========================================================

  const rejectTask = useCallback(
    (taskId) => {
      console.log(
        "[Task] Rejecting task:",
        taskId
      );

      updateTaskStatus(
        taskId,
        "REJECTED"
      );
    },
    [updateTaskStatus]
  );

  // =========================================================
  // COMPLETE
  // IN_PROGRESS -> COMPLETED
  // =========================================================

  const completeTask = useCallback(
    (taskId) => {
      console.log(
        "[Task] Completing task:",
        taskId
      );

      updateTaskStatus(
        taskId,
        "COMPLETED"
      );
    },
    [updateTaskStatus]
  );

  // =========================================================
  // CREATE NEW TASK
  // =========================================================

  const createTask = useCallback(
    (task) => {
      const socket =
        wsRef.current;

      if (
        !socket ||
        socket.readyState !==
          WebSocket.OPEN
      ) {
        console.warn(
          "[WebSocket] Cannot create task. Socket is offline."
        );

        return;
      }

      const newTask = {
        ...task,

        id:
          task.id ||
          `task-${Date.now()}`,

        status: "PENDING",

        createdAt:
          task.createdAt ||
          Date.now(),

        updatedAt: Date.now(),
      };

      console.log(
        "[Task] New task created locally:",
        newTask
      );

      // =====================================================
      // ADD IMMEDIATELY TO PENDING COLUMN
      // =====================================================

      setTasks((currentTasks) => {
        const alreadyExists =
          currentTasks.some(
            (existingTask) =>
              String(
                existingTask.id
              ) ===
              String(newTask.id)
          );

        if (alreadyExists) {
          return currentTasks;
        }

        return [
          ...currentTasks,
          newTask,
        ];
      });

      // =====================================================
      // WEBSOCKET PAYLOAD
      // =====================================================

      const payload = {
        type: "CREATE_TASK",
        task: newTask,
      };

      console.log(
        "[WebSocket] Creating task:",
        payload
      );

      socket.send(
        JSON.stringify(payload)
      );

      // =====================================================
      // CLOSE MODAL
      // =====================================================

      setIsCreateModalOpen(false);

      console.log(
        "[WebSocket] Task sent successfully"
      );
    },
    []
  );

  // =========================================================
  // FILTER TASKS
  // =========================================================

  const pendingTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.status ===
          "PENDING"
      ),
    [tasks]
  );

  const inProgressTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.status ===
          "IN_PROGRESS"
      ),
    [tasks]
  );

  const completedTasks = useMemo(
    () =>
      tasks.filter(
        (task) =>
          task.status ===
            "COMPLETED" ||
          task.status ===
            "REJECTED"
      ),
    [tasks]
  );

  // =========================================================
  // CONNECTION MESSAGE
  // =========================================================

  const connectionMessage = {
    CONNECTING:
      "Connecting...",

    CONNECTED:
      "Online",

    DISCONNECTED:
      "Offline - Reconnecting...",
  };

  // =========================================================
  // RENDER
  // =========================================================

  return (
    <main className="workflow-container">

      {/* ================================================= */}
      {/* HEADER */}
      {/* ================================================= */}

      <header className="workflow-header">

        <div>
          <p className="eyebrow">
            OPERATIONS CONTROL CENTER
          </p>

          <h1>
            Real-Time Verification Portal
          </h1>

          <p>
            Manage and monitor
            verification workflows
            in real time.
          </p>
        </div>

        {/* HEADER ACTIONS */}

        <div className="header-actions">

          {/* CREATE TASK */}

          <button
            type="button"
            className="new-task-button"
            onClick={() =>
              setIsCreateModalOpen(
                true
              )
            }
            disabled={!isOnline}
            title={
              !isOnline
                ? "Waiting for WebSocket connection..."
                : "Create a new verification task"
            }
          >
            <span className="plus-icon">
              +
            </span>

            Create New Task
          </button>

          {/* CONNECTION STATUS */}

          <div
            className={`connection-status ${
              isOnline
                ? "online"
                : "offline"
            }`}
            aria-live="polite"
          >

            {isConnecting && (
              <span
                className="connection-spinner"
                aria-hidden="true"
              />
            )}

            <span
              className="connection-dot"
              aria-hidden="true"
            />

            <span>
              {
                connectionMessage[
                  connectionStatus
                ]
              }
            </span>

          </div>

        </div>
      </header>

      {/* ================================================= */}
      {/* CREATE TASK MODAL */}
      {/* ================================================= */}

      <CreateTaskModal
        isOpen={
          isCreateModalOpen
        }

        onClose={() =>
          setIsCreateModalOpen(
            false
          )
        }

        onCreate={
          createTask
        }
      />

      {/* ================================================= */}
      {/* OFFLINE MESSAGE */}
      {/* ================================================= */}

      {!isOnline && (
        <div
          className="offline-banner"
          role="status"
          aria-live="polite"
        >
          <strong>
            Connection unavailable.
          </strong>{" "}
          Actions are temporarily
          disabled. Reconnecting
          automatically...
        </div>
      )}

      {/* ================================================= */}
      {/* KANBAN BOARD */}
      {/* ================================================= */}

      <section
        className="kanban-board"
        aria-label="Verification workflow board"
      >

        {/* ================================================= */}
        {/* PENDING */}
        {/* ================================================= */}

        <KanbanColumn
          title="Pending"
          tasks={
            pendingTasks
          }
          onApprove={
            approveTask
          }
          onReject={
            rejectTask
          }
          onComplete={
            completeTask
          }
          isOnline={
            isOnline
          }
        />

        {/* ================================================= */}
        {/* IN PROGRESS */}
        {/* ================================================= */}

        <KanbanColumn
          title="In Progress"
          tasks={
            inProgressTasks
          }
          onApprove={
            approveTask
          }
          onReject={
            rejectTask
          }
          onComplete={
            completeTask
          }
          isOnline={
            isOnline
          }
        />

        {/* ================================================= */}
        {/* COMPLETED */}
        {/* ================================================= */}

        <KanbanColumn
          title="Completed"
          tasks={
            completedTasks
          }
          onApprove={
            approveTask
          }
          onReject={
            rejectTask
          }
          onComplete={
            completeTask
          }
          isOnline={
            isOnline
          }
        />

      </section>

    </main>
  );
}

export default WorkflowEngine;