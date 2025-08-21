export type TaskCategory = 'To Do' | 'In Progress' | 'Review' | 'Completed';

export type Task = {
  id: string;
  name: string;
  category: TaskCategory;
  startDate: string; // Stored as toDateString
  endDate: string;   // Stored as toDateString
};

const STORAGE_KEY_TASKS = 'planner-tasks';
const LEGACY_STORAGE_KEY_EVENTS = 'planner-events';

export function loadTasks(): Task[] {
  const tasksJson = localStorage.getItem(STORAGE_KEY_TASKS);
  if (tasksJson) {
    try {
      const parsed: Task[] = JSON.parse(tasksJson);
      return Array.isArray(parsed) ? parsed : [];
    } catch {
      return [];
    }
  }

  // Migrate legacy single-day events if present
  const legacyJson = localStorage.getItem(LEGACY_STORAGE_KEY_EVENTS);
  if (legacyJson) {
    try {
      const legacy = JSON.parse(legacyJson) as Array<{ id: string; title: string; date: string }>;
      const migrated: Task[] = legacy.map((e) => ({
        id: e.id,
        name: e.title ?? 'Task',
        category: 'To Do',
        startDate: e.date,
        endDate: e.date,
      }));
      localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(migrated));
      return migrated;
    } catch {
      // fallthrough
    }
  }

  // Default example
  const today = new Date().toDateString();
  const seed: Task[] = [
    { id: '1', name: 'Meeting', category: 'To Do', startDate: today, endDate: today },
  ];
  localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(seed));
  return seed;
}

export function saveTasks(tasks: Task[]) {
  localStorage.setItem(STORAGE_KEY_TASKS, JSON.stringify(tasks));
}
  