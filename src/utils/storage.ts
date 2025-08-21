export type Event = {
    id: string;
    title: string;
    date: string; // Stored as toDateString
  };
  
  const STORAGE_KEY = "planner-events";
  
  export function loadEvents(): Event[] {
    const data = localStorage.getItem(STORAGE_KEY);
    return data ? JSON.parse(data) : [
      { id: "1", title: "Meeting", date: new Date().toDateString() }
    ];
  }
  
  export function saveEvents(events: Event[]) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(events));
  }
  