function TaskCard({
  task,
  onApprove,
  onReject,
  onComplete,
  isOnline,
}) {
  const isPending = task.status === "PENDING";
  const isInProgress = task.status === "IN_PROGRESS";

  return (
    <article className="task-card">
      <div className="task-card-content">
        <h3>{task.title}</h3>

        {task.category && (
          <p>
            Category: <strong>{task.category}</strong>
          </p>
        )}

        {task.priority && (
          <p>
            Priority: <strong>{task.priority}</strong>
          </p>
        )}

        <p>
          Status: <strong>{task.status}</strong>
        </p>

        {task.description && (
          <p className="task-description">
            {task.description}
          </p>
        )}
      </div>

      {/* PENDING TASK */}
      {isPending && (
        <div className="task-actions">
          <button
            type="button"
            onClick={() => onApprove(task.id)}
            disabled={!isOnline}
            aria-label={`Approve ${task.title}`}
          >
            Approve
          </button>

          <button
            type="button"
            onClick={() => onReject(task.id)}
            disabled={!isOnline}
            aria-label={`Reject ${task.title}`}
          >
            Reject
          </button>
        </div>
      )}

      {/* IN PROGRESS TASK */}
      {isInProgress && (
        <div className="task-actions">
          <button
            type="button"
            className="complete-button"
            onClick={() => onComplete(task.id)}
            disabled={!isOnline}
            aria-label={`Complete ${task.title}`}
          >
            Complete Verification
          </button>
        </div>
      )}
    </article>
  );
}

export default TaskCard;