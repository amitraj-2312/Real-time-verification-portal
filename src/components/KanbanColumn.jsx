import TaskCard from "./TaskCard";

function KanbanColumn({
  title,
  tasks,
  onApprove,
  onReject,
  onComplete,
  isOnline,
}) {
  return (
    <section className="kanban-column">
      <div className="kanban-column-header">
        <h2>{title}</h2>

        <span>{tasks.length}</span>
      </div>

      <div className="task-list">
        {tasks.length === 0 ? (
          <p className="column-empty">
            No tasks available
          </p>
        ) : (
          tasks.map((task) => (
            <TaskCard
              key={task.id}
              task={task}
              onApprove={onApprove}
              onReject={onReject}
              onComplete={onComplete}
              isOnline={isOnline}
            />
          ))
        )}
      </div>
    </section>
  );
}

export default KanbanColumn;