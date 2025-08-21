import { useMemo, useState } from "react";
import { createPortal } from "react-dom";
import Calendar from "../components/Calendar";
import Header from "../components/Header";
import { loadTasks, saveTasks, type Task, type TaskCategory } from "../utils/storage";
import { addDays, differenceInCalendarDays } from "date-fns";

// NewTaskModal Component (moved here for simplicity, can be a separate file later)
const TaskModal = ({ isOpen, startDate, endDate, onClose, onSubmit, initialName = '', initialCategory = 'To Do', title = 'Create New Task' }: {
  isOpen: boolean;
  startDate: Date | null;
  endDate: Date | null;
  onClose: () => void;
  onSubmit: (name: string, category: TaskCategory) => void;
  initialName?: string;
  initialCategory?: TaskCategory;
  title?: string;
}) => {
  const [taskName, setTaskName] = useState(initialName);
  const [taskCategory, setTaskCategory] = useState<TaskCategory>(initialCategory);

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSubmit(taskName, taskCategory);
    setTaskName(''); // Clear input after submission
    setTaskCategory('To Do'); // Reset category
  };

  return createPortal(
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[9999] pointer-events-auto">
      <div className="bg-white p-6 rounded-lg shadow-lg relative w-96">
        <h2 className="text-lg font-bold mb-4">{title}</h2>
        <p className="mb-2">Start Date: {startDate?.toLocaleDateString()}</p>
        <p className="mb-4">End Date: {endDate?.toLocaleDateString()}</p>

        <div className="mb-4">
          <label htmlFor="taskName" className="block text-sm font-medium text-gray-700">Task Name</label>
          <input
            type="text"
            id="taskName"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            value={taskName}
            onChange={(e) => setTaskName(e.target.value)}
          />
        </div>

        <div className="mb-4">
          <label htmlFor="taskCategory" className="block text-sm font-medium text-gray-700">Category</label>
          <select
            id="taskCategory"
            className="mt-1 block w-full border border-gray-300 rounded-md shadow-sm p-2"
            value={taskCategory}
            onChange={(e) => setTaskCategory(e.target.value as TaskCategory)}
          >
            <option value="To Do">To Do</option>
            <option value="In Progress">In Progress</option>
            <option value="Review">Review</option>
            <option value="Completed">Completed</option>
          </select>
        </div>

        <div className="mt-4 flex justify-end">
          <button onClick={onClose} className="mr-2 px-4 py-2 bg-gray-200 rounded">Cancel</button>
          <button onClick={handleSubmit} className="px-4 py-2 bg-blue-500 text-white rounded">Save Task</button>
        </div>
      </div>
    </div>
  , document.body);
};

export default function Planner() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [tasks, setTasks] = useState<Task[]>(loadTasks());

  // State for the new task modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTaskDates, setNewTaskDates] = useState<{ startDate: Date, endDate: Date } | null>(null);

  // State for editing a task
  const [editingTask, setEditingTask] = useState<Task | null>(null);

  // Filters and search
  const [search, setSearch] = useState("");
  const [selectedCategories, setSelectedCategories] = useState<Record<TaskCategory, boolean>>({
    'To Do': true,
    'In Progress': true,
    'Review': true,
    'Completed': true,
  });
  const [weeksFilter, setWeeksFilter] = useState<0 | 1 | 2 | 3>(0); // 0 = all

  // Handles moving an existing task to a new day
  const handleMoveTask = (day: Date, taskId: string) => {
    setTasks((prev) => {
      const updated = prev.map((t) => {
        if (t.id !== taskId) return t;
        const currentStart = new Date(t.startDate);
        const currentEnd = new Date(t.endDate);
        const duration = differenceInCalendarDays(currentEnd, currentStart);
        const newStart = day;
        const newEnd = addDays(newStart, duration);
        return { ...t, startDate: newStart.toDateString(), endDate: newEnd.toDateString() };
      });
      saveTasks(updated);
      return updated;
    });
  };

  // Handles the creation of a new task after a drag selection
  const handleCreateTask = (startDate: Date, endDate: Date) => {
    setNewTaskDates({ startDate, endDate });
    setIsModalOpen(true); // Open the modal
  };

  // Closes the new task modal
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setNewTaskDates(null); // Clear dates
  };

  // Submits the new task details from the modal
  const handleSubmitNewTask = (name: string, category: TaskCategory) => {
    if (newTaskDates?.startDate && newTaskDates?.endDate) {
      const newTask: Task = {
        id: Date.now().toString(),
        name,
        category,
        startDate: newTaskDates.startDate.toDateString(),
        endDate: newTaskDates.endDate.toDateString(),
      };
      const updatedTasks = [...tasks, newTask];
      setTasks(updatedTasks);
      saveTasks(updatedTasks);
    }
    handleCloseModal();
  };

  const handleResizeTaskLeft = (taskId: string, newStart: Date) => {
    setTasks((prev) => {
      const updated = prev.map((t) => {
        if (t.id !== taskId) return t;
        const currentEnd = new Date(t.endDate);
        const adjustedStart = newStart > currentEnd ? currentEnd : newStart;
        return { ...t, startDate: adjustedStart.toDateString() };
      });
      saveTasks(updated);
      return updated;
    });
  };

  const handleResizeTaskRight = (taskId: string, newEnd: Date) => {
    setTasks((prev) => {
      const updated = prev.map((t) => {
        if (t.id !== taskId) return t;
        const currentStart = new Date(t.startDate);
        const adjustedEnd = newEnd < currentStart ? currentStart : newEnd;
        return { ...t, endDate: adjustedEnd.toDateString() };
      });
      saveTasks(updated);
      return updated;
    });
  };

  const handleEditTask = (task: Task) => {
    setEditingTask(task);
  };

  const handleSubmitEditTask = (name: string, category: TaskCategory) => {
    if (!editingTask) return;
    setTasks((prev) => {
      const updated = prev.map((t) => t.id === editingTask.id ? { ...t, name, category } : t);
      saveTasks(updated);
      return updated;
    });
    setEditingTask(null);
  };

  // Derived filtered tasks
  const visibleTasks = useMemo(() => {
    const lowerSearch = search.trim().toLowerCase();
    const now = new Date();
    const todayStripped = new Date(now.getFullYear(), now.getMonth(), now.getDate());
    const endWindow = weeksFilter === 0 ? null : addDays(todayStripped, weeksFilter * 7);

    return tasks.filter((t) => {
      if (!selectedCategories[t.category]) return false;
      if (lowerSearch && !t.name.toLowerCase().includes(lowerSearch)) return false;
      if (endWindow) {
        const taskStart = new Date(t.startDate);
        const taskEnd = new Date(t.endDate);
        const overlaps = !(taskEnd < todayStripped || taskStart > endWindow);
        if (!overlaps) return false;
      }
      return true;
    });
  }, [tasks, search, selectedCategories, weeksFilter]);

  const toggleCategory = (category: TaskCategory) => {
    setSelectedCategories((prev) => ({ ...prev, [category]: !prev[category] }));
  };

  const handlePrevMonth = () => {
    if (month === 0) {
      setMonth(11);
      setYear((y) => y - 1);
    } else {
      setMonth((m) => m - 1);
    }
  };

  const handleNextMonth = () => {
    if (month === 11) {
      setMonth(0);
      setYear((y) => y + 1);
    } else {
      setMonth((m) => m + 1);
    }
  };

  return (
    <div className="p-4">
      <Header
        month={month}
        year={year}
        onPrev={handlePrevMonth}
        onNext={handleNextMonth}
      />

      {/* Filters and Search */}
      <div className="mb-4 flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <button
            className="px-3 py-2 bg-blue-600 text-white rounded"
            onClick={() => handleCreateTask(today, today)}
          >
            New Task (today)
          </button>
        </div>
        <input
          type="text"
          placeholder="Search by task name..."
          className="border rounded px-3 py-2 max-w-md"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="flex items-center gap-6 flex-wrap">
          <div className="flex items-center gap-3">
            <label className="font-medium">Categories:</label>
            {(['To Do','In Progress','Review','Completed'] as TaskCategory[]).map((cat) => (
              <label key={cat} className="inline-flex items-center gap-2">
                <input type="checkbox" checked={selectedCategories[cat]} onChange={() => toggleCategory(cat)} />
                <span>{cat}</span>
              </label>
            ))}
          </div>
          <div className="flex items-center gap-3">
            <label className="font-medium">Time:</label>
            {([0,1,2,3] as Array<0|1|2|3>).map((w) => (
              <label key={w} className="inline-flex items-center gap-2">
                <input type="radio" name="weeksFilter" checked={weeksFilter === w} onChange={() => setWeeksFilter(w)} />
                <span>{w === 0 ? 'All' : `${w} week${w>1?'s':''}`}</span>
              </label>
            ))}
          </div>
        </div>
      </div>

      <Calendar
        month={month}
        year={year}
        tasks={visibleTasks}
        onDropTask={handleMoveTask}
        onResizeTaskLeft={handleResizeTaskLeft}
        onResizeTaskRight={handleResizeTaskRight}
        onRequestEditTask={handleEditTask}
        onCreateTask={handleCreateTask}
      />

      {/* Create Task Modal */}
      <TaskModal
        isOpen={isModalOpen}
        startDate={newTaskDates?.startDate || null}
        endDate={newTaskDates?.endDate || null}
        onClose={handleCloseModal}
        onSubmit={handleSubmitNewTask}
      />

      {/* Edit Task Modal */}
      <TaskModal
        isOpen={!!editingTask}
        startDate={editingTask ? new Date(editingTask.startDate) : null}
        endDate={editingTask ? new Date(editingTask.endDate) : null}
        onClose={() => setEditingTask(null)}
        onSubmit={handleSubmitEditTask}
        initialName={editingTask?.name}
        initialCategory={editingTask?.category}
        title="Edit Task"
      />
    </div>
  );
}