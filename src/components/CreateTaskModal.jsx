import { useState } from "react";

function CreateTaskModal({
  isOpen,
  onClose,
  onCreate,
}) {
  const [title, setTitle] = useState("");
  const [category, setCategory] =
    useState("KYC Review");

  const [priority, setPriority] =
    useState("STANDARD");

  const [description, setDescription] =
    useState("");

  // Modal open nahi hai
  if (!isOpen) {
    return null;
  }

  // ================================
  // CREATE TASK
  // ================================

  const handleSubmit = (event) => {
    event.preventDefault();

    const trimmedTitle = title.trim();

    // Empty title allowed nahi
    if (!trimmedTitle) {
      return;
    }

    const now = Date.now();

    const task = {
      id: now,

      title: trimmedTitle,

      category,

      priority,

      description:
        description.trim() ||
        "Verification checklist notes...",

      status: "PENDING",

      createdAt: now,

      updatedAt: now,
    };

    console.log(
      "[CreateTaskModal] Creating task:",
      task
    );

    // WorkflowEngine ko task bhejo
    onCreate(task);

    // Form reset
    setTitle("");
    setCategory("KYC Review");
    setPriority("STANDARD");
    setDescription("");

    // Modal close
    onClose();
  };

  return (
    <div
      className="modal-overlay"
      role="presentation"
      onMouseDown={(event) => {
        // Background click karne par modal close
        if (
          event.target ===
          event.currentTarget
        ) {
          onClose();
        }
      }}
    >
      <section
        className="create-task-modal"
        role="dialog"
        aria-modal="true"
        aria-labelledby="create-task-title"
      >

        {/* ================================= */}
        {/* HEADER */}
        {/* ================================= */}

        <div className="modal-header">

          <div>
            <p className="modal-eyebrow">
              NEW VERIFICATION
            </p>

            <h2 id="create-task-title">
              Create Verification Item
            </h2>
          </div>

          <button
            type="button"
            className="modal-close"
            onClick={onClose}
            aria-label="Close modal"
          >
            ×
          </button>

        </div>

        {/* ================================= */}
        {/* FORM */}
        {/* ================================= */}

        <form onSubmit={handleSubmit}>

          {/* TITLE */}

          <div className="form-group">

            <label htmlFor="task-title">
              Task Title *
            </label>

            <input
              id="task-title"
              type="text"
              value={title}
              onChange={(event) =>
                setTitle(
                  event.target.value
                )
              }
              placeholder="e.g. Verify Tax Residency Form"
              required
              autoFocus
            />

          </div>

          {/* CATEGORY + PRIORITY */}

          <div className="form-row">

            {/* CATEGORY */}

            <div className="form-group">

              <label htmlFor="task-category">
                Category
              </label>

              <select
                id="task-category"
                value={category}
                onChange={(event) =>
                  setCategory(
                    event.target.value
                  )
                }
              >

                <option value="KYC Review">
                  KYC Review
                </option>

                <option value="Identity">
                  Identity
                </option>

                <option value="Address">
                  Address
                </option>

                <option value="Financial Risk">
                  Financial Risk
                </option>

                <option value="Compliance">
                  Compliance
                </option>

              </select>

            </div>

            {/* PRIORITY */}

            <div className="form-group">

              <label htmlFor="task-priority">
                Priority
              </label>

              <select
                id="task-priority"
                value={priority}
                onChange={(event) =>
                  setPriority(
                    event.target.value
                  )
                }
              >

                <option value="STANDARD">
                  Standard
                </option>

                <option value="HIGH">
                  High
                </option>

                <option value="LOW">
                  Low
                </option>

              </select>

            </div>

          </div>

          {/* DESCRIPTION */}

          <div className="form-group">

            <label htmlFor="task-description">
              Description / Audit Notes
            </label>

            <textarea
              id="task-description"
              value={description}
              onChange={(event) =>
                setDescription(
                  event.target.value
                )
              }
              placeholder="Verification checklist notes..."
              rows="4"
            />

          </div>

          {/* ================================= */}
          {/* ACTION BUTTONS */}
          {/* ================================= */}

          <div className="modal-actions">

            <button
              type="button"
              className="cancel-button"
              onClick={onClose}
            >
              Cancel
            </button>

            <button
              type="submit"
              className="create-button"
              disabled={!title.trim()}
            >
              Create & Broadcast
            </button>

          </div>

        </form>

      </section>
    </div>
  );
}

export default CreateTaskModal;