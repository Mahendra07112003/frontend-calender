import React, { useState } from "react";
import Calendar from "../components/Calendar";
import Header from "../components/Header";
import { loadEvents, saveEvents, type Event } from "../utils/storage"; // Using type import for Event

// NewTaskModal Component (moved here for simplicity, can be a separate file later)
const NewTaskModal = ({ isOpen, startDate, endDate, onClose, onSubmit }: {
  isOpen: boolean;
  startDate: Date | null;
  endDate: Date | null;
  onClose: () => void;
  onSubmit: (name: string, category: string) => void;
}) => {
  const [taskName, setTaskName] = useState('');
  const [taskCategory, setTaskCategory] = useState('To Do'); // Default category

  if (!isOpen) return null;

  const handleSubmit = () => {
    onSubmit(taskName, taskCategory);
    setTaskName(''); // Clear input after submission
    setTaskCategory('To Do'); // Reset category
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg shadow-lg relative w-96">
        <h2 className="text-lg font-bold mb-4">Create New Task</h2>
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
            onChange={(e) => setTaskCategory(e.target.value)}
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
  );
};

export default function Planner() {
  const today = new Date();
  const [month, setMonth] = useState(today.getMonth());
  const [year, setYear] = useState(today.getFullYear());
  const [events, setEvents] = useState<Event[]>(loadEvents());

  // State for the new task modal
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newTaskDates, setNewTaskDates] = useState<{ startDate: Date, endDate: Date } | null>(null);

  // Handles moving an existing task to a new day
  const handleMoveTask = (day: Date, eventId: string) => {
    const updated = events.map((e) =>
      e.id === eventId ? { ...e, date: day.toDateString() } : e
    );
    setEvents(updated);
    saveEvents(updated);
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
  const handleSubmitNewTask = (name: string, category: string) => {
    if (newTaskDates?.startDate && newTaskDates?.endDate) {
      const newTask: Event = {
        id: Date.now().toString(), // Simple unique ID
        name,
        date: newTaskDates.startDate.toDateString(), // Store start date as string
        endDate: newTaskDates.endDate.toDateString(), // Store end date as string
        category,
      };
      const updatedEvents = [...events, newTask];
      setEvents(updatedEvents);
      saveEvents(updatedEvents); // Save to local storage
    }
    handleCloseModal(); // Close modal after saving
  };

  return (
    <div className="p-4">
      <Header
        month={month}
        year={year}
        onPrev={() => setMonth((m) => (m === 0 ? 11 : m - 1))}
        onNext={() => setMonth((m) => (m === 11 ? 0 : m + 1))}
      />
      <Calendar
        month={month}
        year={year}
        events={events}
        onDropEvent={handleMoveTask}
        onCreateTask={handleCreateTask} // Pass the handler
      />
      {/* Render the NewTaskModal */}
      <NewTaskModal
        isOpen={isModalOpen}
        startDate={newTaskDates?.startDate || null}
        endDate={newTaskDates?.endDate || null}
        onClose={handleCloseModal}
        onSubmit={handleSubmitNewTask}
      />
    </div>
  );
}