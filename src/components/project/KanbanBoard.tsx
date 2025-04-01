import React, { useState } from "react";
import { Droppable, Draggable } from "react-beautiful-dnd";
import { Plus, X } from "lucide-react";
import Column from "./Column";
import TaskCard from "./TaskCard";
import { Button } from "../ui/button";
import { useAuth } from "@/lib/auth";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import { useToast } from "../ui/use-toast";
import { taskApi, columnApi } from "@/lib/api";
import TaskModal from "../modals/TaskModal";

interface Task {
  id: string;
  title: string;
  description?: string;
  labels?: { id: string; name: string; color: string }[];
  dueDate?: Date;
  assignees?: { id: string; name: string; avatar: string }[];
  commentsCount?: number;
  isCompleted?: boolean;
}

interface Column {
  id: string;
  title: string;
  tasks: Task[];
}

interface KanbanBoardProps {
  projectId?: string;
  columns?: Column[];
  onColumnsReordered?: (columns: Column[]) => void;
}

const KanbanBoard: React.FC<KanbanBoardProps> = ({
  projectId = "project-1",
  onColumnsReordered,
  columns: initialColumnsFromProps = [
    {
      id: "column-1",
      title: "Backlog",
      tasks: [
        {
          id: "task-1",
          title: "Research competitors",
          description: "Analyze top 5 competitors in the market",
          labels: [{ id: "label-1", name: "Research", color: "#0089AD" }],
          dueDate: new Date(Date.now() + 86400000 * 3),
          assignees: [
            {
              id: "user-1",
              name: "Alex Johnson",
              avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
            },
          ],
          commentsCount: 2,
        },
      ],
    },
    {
      id: "column-2",
      title: "Next Week",
      tasks: [
        {
          id: "task-2",
          title: "Create wireframes",
          description: "Design initial wireframes for the dashboard",
          labels: [{ id: "label-2", name: "Design", color: "#00AD89" }],
          dueDate: new Date(Date.now() + 86400000 * 5),
          assignees: [
            {
              id: "user-2",
              name: "Sam Taylor",
              avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sam",
            },
          ],
          commentsCount: 0,
        },
      ],
    },
    {
      id: "column-3",
      title: "Working On",
      tasks: [
        {
          id: "task-3",
          title: "Implement authentication",
          description: "Set up user authentication with JWT",
          labels: [{ id: "label-3", name: "Development", color: "#5D5FEF" }],
          dueDate: new Date(Date.now() + 86400000 * 2),
          assignees: [
            {
              id: "user-3",
              name: "Jamie Lee",
              avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jamie",
            },
          ],
          commentsCount: 5,
        },
      ],
    },
    {
      id: "column-4",
      title: "On Hold",
      tasks: [],
    },
    {
      id: "column-5",
      title: "Completed",
      tasks: [
        {
          id: "task-4",
          title: "Project setup",
          description:
            "Initialize repository and set up development environment",
          labels: [{ id: "label-4", name: "Setup", color: "#F59E0B" }],
          dueDate: new Date(Date.now() - 86400000 * 1),
          assignees: [
            {
              id: "user-4",
              name: "Taylor Kim",
              avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Taylor",
            },
          ],
          commentsCount: 3,
        },
      ],
    },
  ],
}) => {
  // Use columns directly from props without ensuring Completed column
  const columns = initialColumnsFromProps;
  // Initialize boardColumns directly from columns without ensuring Completed column
  const [boardColumns, setBoardColumns] = useState<Column[]>(columns);

  // No automatic Completed column creation
  const [showAddColumn, setShowAddColumn] = useState(false);
  const [newColumnTitle, setNewColumnTitle] = useState("");
  const [activeTaskModal, setActiveTaskModal] = useState<{
    columnId: string;
    taskId?: string;
  } | null>(null);
  const { toast } = useToast();
  const { user } = useAuth();
  const isAdmin = user?.role === "admin";

  const handleDragEnd = async (result: any) => {
    const { destination, source, draggableId, type } = result;

    // If there's no destination or the item was dropped back to its original position
    if (
      !destination ||
      (destination.droppableId === source.droppableId &&
        destination.index === source.index)
    ) {
      return;
    }

    // If we're dragging columns
    if (type === "column") {
      const newColumnOrder = Array.from(boardColumns);
      const [movedColumn] = newColumnOrder.splice(source.index, 1);

      // No special handling for Completed column
      newColumnOrder.splice(destination.index, 0, movedColumn);

      setBoardColumns(newColumnOrder);

      // Notify parent component about the column reordering
      if (onColumnsReordered) {
        onColumnsReordered(newColumnOrder);
      }

      toast({
        title: "Column moved",
        description: `Column "${movedColumn.title}" has been moved from position ${source.index + 1} to ${destination.index + 1}`,
      });
      return;
    }

    // Moving tasks between columns
    const sourceColumn = boardColumns.find(
      (col) => col.id === source.droppableId,
    );
    const destColumn = boardColumns.find(
      (col) => col.id === destination.droppableId,
    );

    if (!sourceColumn || !destColumn) return;

    // If moving within the same column
    if (source.droppableId === destination.droppableId) {
      const newTasks = Array.from(sourceColumn.tasks);
      const [movedTask] = newTasks.splice(source.index, 1);
      newTasks.splice(destination.index, 0, movedTask);

      const newColumns = boardColumns.map((col) => {
        if (col.id === sourceColumn.id) {
          return { ...col, tasks: newTasks };
        }
        return col;
      });

      setBoardColumns(newColumns);

      // Update task order in Supabase
      try {
        const tasksToReorder = sourceColumn.tasks.map((task, idx) => ({
          id: task.id,
          order: idx,
        }));
        await taskApi.reorder(tasksToReorder);
      } catch (error) {
        console.error("Error updating task order:", error);
      }

      toast({
        title: "Task reordered",
        description: `Task "${movedTask.title}" has been reordered`,
      });
    } else {
      // Moving to a different column
      const sourceTasks = Array.from(sourceColumn.tasks);
      const [movedTask] = sourceTasks.splice(source.index, 1);
      const destTasks = Array.from(destColumn.tasks);
      destTasks.splice(destination.index, 0, movedTask);

      // No special handling for tasks moved to any column

      const newColumns = boardColumns.map((col) => {
        if (col.id === sourceColumn.id) {
          return { ...col, tasks: sourceTasks };
        }
        if (col.id === destColumn.id) {
          return { ...col, tasks: destTasks };
        }
        return col;
      });

      setBoardColumns(newColumns);

      // Update task in Supabase
      try {
        // Move task to new column
        await taskApi.moveToColumn(movedTask.id, destination.droppableId);

        // Update order in source column
        const sourceTasksToReorder = sourceTasks.map((task, idx) => ({
          id: task.id,
          order: idx,
        }));

        // Update order in destination column
        const destTasksToReorder = destTasks.map((task, idx) => ({
          id: task.id,
          order: idx,
        }));

        await Promise.all([
          taskApi.reorder(sourceTasksToReorder),
          taskApi.reorder(destTasksToReorder),
        ]);
      } catch (error) {
        console.error("Error moving task between columns:", error);
      }

      toast({
        title: "Task moved",
        description: `Task "${movedTask.title}" moved from "${sourceColumn.title}" to "${destColumn.title}"`,
      });
    }
  };

  const handleAddColumn = async () => {
    if (!newColumnTitle.trim()) return;

    // No special handling for adding a Completed column

    const newColumn: Column = {
      id: `column-${Date.now()}`,
      title: newColumnTitle,
      tasks: [],
    };

    // Add the new column at the end
    const updatedColumns = [...boardColumns, newColumn];

    setBoardColumns(updatedColumns);
    setNewColumnTitle("");
    setShowAddColumn(false);

    // Notify parent component about the column addition
    if (onColumnsReordered) {
      onColumnsReordered(updatedColumns);
    }

    toast({
      title: "Column added",
      description: `Column "${newColumnTitle}" has been added`,
    });
  };

  const handleEditColumn = (columnId: string, newTitle: string) => {
    // No special handling for renaming columns

    const updatedColumns = boardColumns.map((col) => {
      if (col.id === columnId) {
        return { ...col, title: newTitle };
      }
      return col;
    });

    setBoardColumns(updatedColumns);

    // Notify parent component about the column update
    if (onColumnsReordered) {
      onColumnsReordered(updatedColumns);
    }
  };

  const handleDeleteColumn = (columnId: string) => {
    // No special handling for deleting columns

    const updatedColumns = boardColumns.filter((col) => col.id !== columnId);
    setBoardColumns(updatedColumns);

    // Notify parent component about the column deletion
    if (onColumnsReordered) {
      onColumnsReordered(updatedColumns);
    }
  };

  const handleAddTask = (columnId: string) => {
    setActiveTaskModal({ columnId });
  };

  const handleEditTask = (columnId: string, taskId: string) => {
    setActiveTaskModal({ columnId, taskId });
  };

  // No need for findCompletedColumn function;

  const handleDeleteTask = (columnId: string, taskId: string) => {
    const updatedColumns = boardColumns.map((col) => {
      if (col.id === columnId) {
        return {
          ...col,
          tasks: col.tasks.filter((task) => task.id !== taskId),
        };
      }
      return col;
    });

    setBoardColumns(updatedColumns);
    toast({
      title: "Task deleted",
      description: "The task has been deleted successfully",
      variant: "destructive",
    });
  };

  // DragDropContext is now provided at the App level

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-[8px_8px_16px_rgba(0,0,0,0.05),-8px_-8px_16px_rgba(255,255,255,0.8)] p-6 relative">
      {/* Add Column Button - Positioned to the right */}
      <div className="absolute right-6 top-6 w-[220px] z-20">
        {showAddColumn ? (
          <div className="bg-white rounded-xl shadow-[5px_5px_15px_rgba(0,0,0,0.1),-5px_-5px_15px_rgba(255,255,255,0.8)] p-4">
            <div className="flex justify-between items-center mb-2">
              <h3 className="text-lg font-medium">Add New Column</h3>
              <Button
                variant="ghost"
                size="icon"
                className="h-8 w-8"
                onClick={() => setShowAddColumn(false)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
            <input
              type="text"
              value={newColumnTitle}
              onChange={(e) => setNewColumnTitle(e.target.value)}
              placeholder="Enter column title"
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-[#0089AD] mb-3"
              autoFocus
            />
            <Button
              onClick={handleAddColumn}
              className="w-full bg-[#0089AD] hover:bg-[#006d8a]"
            >
              Add Column
            </Button>
          </div>
        ) : (
          <Button
            onClick={() => setShowAddColumn(true)}
            variant="outline"
            className="w-full h-12 flex items-center justify-center border-dashed border-2 border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-xl transition-colors z-10"
          >
            <Plus className="h-5 w-5 mr-2" />
            Add Column
          </Button>
        )}
      </div>

      <Droppable droppableId="all-columns" direction="horizontal" type="column">
        {(provided) => (
          <div
            className="flex overflow-x-auto pb-4 h-full gap-2"
            {...provided.droppableProps}
            ref={provided.innerRef}
          >
            {boardColumns.map((column, index) => (
              <Draggable key={column.id} draggableId={column.id} index={index}>
                {(provided, snapshot) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    className="mr-0" /* Reduced margin between columns */
                  >
                    <div
                      {...provided.dragHandleProps}
                      className={`cursor-grab ${snapshot.isDragging ? "opacity-80" : ""}`}
                      style={{
                        width: "220px",
                      }} /* Reduced to fit 5 columns */
                    >
                      <Column
                        id={column.id}
                        title={column.title}
                        tasks={column.tasks}
                        index={index}
                        onAddTask={() => handleAddTask(column.id)}
                        onEditColumn={isAdmin ? handleEditColumn : undefined}
                        onDeleteColumn={
                          isAdmin ? handleDeleteColumn : undefined
                        }
                        onEditTask={handleEditTask}
                        onDeleteTask={isAdmin ? handleDeleteTask : undefined}
                        canEditTasks={isAdmin || user?.role === "user"}
                        canAddTasks={isAdmin}
                      />
                    </div>
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>

      {/* Import TaskModal from modals folder */}
      <TaskModal
        open={!!activeTaskModal}
        onOpenChange={(open) => {
          if (!open) setActiveTaskModal(null);
        }}
        task={
          activeTaskModal?.taskId
            ? boardColumns
                .find((col) => col.id === activeTaskModal.columnId)
                ?.tasks.find((task) => task.id === activeTaskModal.taskId)
            : undefined
        }
        mode={activeTaskModal?.taskId ? "edit" : "create"}
        columnId={activeTaskModal?.columnId}
        projectId={projectId}
        onSave={(taskData) => {
          // Handle task creation/update
          if (activeTaskModal?.taskId) {
            // Update existing task
            let updatedColumns;

            // Check if task is being marked as completed
            const sourceColumn = boardColumns.find(
              (col) => col.id === activeTaskModal.columnId,
            );
            const task = sourceColumn?.tasks.find(
              (t) => t.id === activeTaskModal.taskId,
            );
            // No special handling for completed tasks

            {
              // Regular update without moving
              updatedColumns = boardColumns.map((col) => {
                if (col.id === activeTaskModal.columnId) {
                  return {
                    ...col,
                    tasks: col.tasks.map((task) =>
                      task.id === activeTaskModal.taskId
                        ? { ...task, ...taskData }
                        : task,
                    ),
                  };
                }
                return col;
              });
            }

            setBoardColumns(updatedColumns);
          } else if (activeTaskModal?.columnId) {
            // Create new task
            const newTask = {
              id: `task-${Date.now()}`,
              title: taskData.title,
              description: taskData.description || "",
              labels: taskData.labels || [],
              dueDate: taskData.dueDate,
              assignees: taskData.assignees || [],
              commentsCount: 0,
            };

            const updatedColumns = boardColumns.map((col) => {
              if (col.id === activeTaskModal.columnId) {
                return {
                  ...col,
                  tasks: [...col.tasks, newTask],
                };
              }
              return col;
            });
            setBoardColumns(updatedColumns);
          }

          // Close the modal
          setActiveTaskModal(null);

          // Show success toast
          toast({
            title: activeTaskModal?.taskId ? "Task updated" : "Task created",
            description: activeTaskModal?.taskId
              ? `The task "${taskData.title}" has been updated successfully`
              : `A new task "${taskData.title}" has been created`,
          });
        }}
        availableLabels={[
          { id: "label-1", name: "Bug", color: "#ff5252" },
          { id: "label-2", name: "Feature", color: "#4caf50" },
          { id: "label-3", name: "Enhancement", color: "#2196f3" },
          { id: "label-4", name: "Documentation", color: "#ff9800" },
          { id: "label-5", name: "Design", color: "#9c27b0" },
        ]}
        availableAssignees={[
          {
            id: "user-1",
            name: "Alex Johnson",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Alex",
          },
          {
            id: "user-2",
            name: "Sam Taylor",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Sam",
          },
          {
            id: "user-3",
            name: "Jamie Lee",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Jamie",
          },
          {
            id: "user-4",
            name: "Taylor Kim",
            avatar: "https://api.dicebear.com/7.x/avataaars/svg?seed=Taylor",
          },
        ]}
      />
    </div>
  );
};

export default KanbanBoard;
