export function useCalendar(month: number, year: number): Date[] {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
  
    const days: Date[] = [];
  
    // Fill leading empty days
    for (let i = 0; i < firstDay.getDay(); i++) {
      days.push(new Date(year, month, i - firstDay.getDay() + 1));
    }
  
    // Fill actual month days
    for (let i = 1; i <= lastDay.getDate(); i++) {
      days.push(new Date(year, month, i));
    }
  
    return days;
  }
  