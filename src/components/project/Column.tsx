import React, { useState } from "react";
import { Droppable, Draggable } from "react-beautiful-dnd";
import { Plus, MoreVertical, Trash2, Edit } from "lucide-react";
import { Button } from "../ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "../ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "../ui/dialog";
import TaskCard from "./TaskCard";
import { useToast } from "../ui/use-toast";

interface Task {
  id: string;
  title: string;
  description?: string;
  labels?: { id: string; name: string; color: string }[];
  dueDate?: Date;
  assignees?: { id: string; name: string; avatar: string }[];
}

interface ColumnProps {
  id: string;
  title?: string;
  tasks?: Task[];
  index?: number;
  onAddTask?: (columnId: string) => void;
  onEditColumn?: (columnId: string, title: string) => void;
  onDeleteColumn?: (columnId: string) => void;
  onEditTask?: (columnId: string, taskId: string) => void;
  onDeleteTask?: (columnId: string, taskId: string) => void;
  canEditTasks?: boolean;
  canAddTasks?: boolean;
}

const Column = ({
  id = "column-1",
  title = "New Column",
  tasks = [
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
    },
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
    },
  ],
  index = 0,
  onAddTask = () => {},
  onEditColumn = undefined,
  onDeleteColumn = undefined,
  onEditTask = () => {},
  onDeleteTask = undefined,
  canEditTasks = true,
  canAddTasks = true,
}: ColumnProps) => {
  const [isEditing, setIsEditing] = useState(false);
  const [columnTitle, setColumnTitle] = useState(title);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const { toast } = useToast();

  const handleTitleSave = () => {
    if (onEditColumn) {
      onEditColumn(id, columnTitle);
      setIsEditing(false);
      toast({
        title: "Column updated",
        description: "Column title has been updated successfully",
      });
    }
  };

  const handleDeleteColumn = () => {
    if (onDeleteColumn) {
      onDeleteColumn(id);
      setConfirmDelete(false);
      toast({
        title: "Column deleted",
        description: "Column and its tasks have been deleted",
        variant: "destructive",
      });
    }
  };

  return (
    <div className="flex flex-col h-full w-[220px] min-w-[220px] bg-white rounded-xl shadow-[5px_5px_15px_rgba(0,0,0,0.1),-5px_-5px_15px_rgba(255,255,255,0.8)] p-3 mx-1">
      <div className="flex items-center justify-between mb-4">
        {isEditing ? (
          <div className="flex w-full">
            <input
              type="text"
              value={columnTitle}
              onChange={(e) => setColumnTitle(e.target.value)}
              className="flex-1 px-2 py-1 text-lg font-medium border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-[#0089AD]"
              autoFocus
            />
            <Button
              onClick={handleTitleSave}
              size="sm"
              className="ml-2 bg-[#0089AD] hover:bg-[#006d8a]"
            >
              Save
            </Button>
          </div>
        ) : (
          <>
            <h3 className="text-lg font-medium text-black">{title}</h3>
            <div className="flex items-center">
              <span className="px-2 py-1 mr-2 text-xs font-medium text-gray-600 bg-gray-100 rounded-full">
                {tasks.length}
              </span>
              {(onEditColumn || onDeleteColumn) && (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="ghost" size="icon" className="h-8 w-8">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end">
                    {onEditColumn && (
                      <DropdownMenuItem onClick={() => setIsEditing(true)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Edit Column
                      </DropdownMenuItem>
                    )}
                    {onDeleteColumn && title.toLowerCase() !== "completed" && (
                      <DropdownMenuItem
                        className="text-red-500 focus:text-red-500"
                        onClick={() => setConfirmDelete(true)}
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Delete Column
                      </DropdownMenuItem>
                    )}
                    {onDeleteColumn && title.toLowerCase() === "completed" && (
                      <DropdownMenuItem
                        className="text-gray-400 cursor-not-allowed"
                        disabled
                      >
                        <Trash2 className="h-4 w-4 mr-2" />
                        Cannot Delete
                      </DropdownMenuItem>
                    )}
                  </DropdownMenuContent>
                </DropdownMenu>
              )}
            </div>
          </>
        )}
      </div>

      {/* Droppable area for tasks */}
      <div className="flex-1 overflow-y-auto mb-2 min-h-[200px] p-1">
        <Droppable droppableId={id} type="task">
          {(provided) => (
            <div
              ref={provided.innerRef}
              {...provided.droppableProps}
              className="space-y-2"
            >
              {tasks.map((task, taskIndex) => (
                <Draggable
                  key={task.id}
                  draggableId={task.id}
                  index={taskIndex}
                >
                  {(provided, snapshot) => (
                    <div
                      ref={provided.innerRef}
                      {...provided.draggableProps}
                      {...provided.dragHandleProps}
                      style={{
                        ...provided.draggableProps.style,
                        opacity: snapshot.isDragging ? 0.8 : 1,
                      }}
                      className="mb-2"
                      onClick={(e) => e.stopPropagation()}
                    >
                      <TaskCard
                        id={task.id}
                        title={task.title}
                        description={task.description}
                        labels={task.labels}
                        dueDate={task.dueDate?.toISOString()}
                        assignees={task.assignees}
                        onEdit={() => onEditTask(id, task.id)}
                        onDelete={
                          onDeleteTask
                            ? () => onDeleteTask(id, task.id)
                            : undefined
                        }
                        onView={() => onEditTask(id, task.id)}
                        canEdit={canEditTasks}
                      />
                    </div>
                  )}
                </Draggable>
              ))}
              {provided.placeholder}
            </div>
          )}
        </Droppable>
      </div>

      {/* Add Task Button - Only shown if user can add tasks */}
      {canAddTasks && (
        <Button
          onClick={() => onAddTask(id)}
          variant="outline"
          className="w-full mt-auto flex items-center justify-center py-2 border-dashed border-2 border-gray-300 bg-gray-50 hover:bg-gray-100 text-gray-700 rounded-lg transition-colors"
        >
          <Plus className="h-4 w-4 mr-2" />
          Add Task
        </Button>
      )}

      {/* Delete Confirmation Dialog */}
      <Dialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Delete Column</DialogTitle>
            <DialogDescription>
              This action cannot be undone. All tasks in this column will also
              be deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="py-4">
            <p>
              Are you sure you want to delete this column and all its tasks?
              This action cannot be undone.
            </p>
          </div>
          <div className="flex justify-end space-x-2">
            <Button variant="outline" onClick={() => setConfirmDelete(false)}>
              Cancel
            </Button>
            <Button
              variant="destructive"
              onClick={handleDeleteColumn}
              className="bg-red-500 hover:bg-red-600"
            >
              <Trash2 className="h-4 w-4 mr-2" />
              Delete
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default Column;
