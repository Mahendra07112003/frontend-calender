export function useCalendar(month: number, year: number): Date[] {
  const firstDay = new Date(year, month, 1);
  const lastDay = new Date(year, month + 1, 0);

  const days: Date[] = [];

  // Leading days to align the first week (Sunday=0 ... Saturday=6)
  const leading = firstDay.getDay();
  for (let i = 0; i < leading; i++) {
    days.push(new Date(year, month, i - leading + 1));
  }

  // Actual month days
  for (let i = 1; i <= lastDay.getDate(); i++) {
    days.push(new Date(year, month, i));
  }

  // Trailing days to complete the final week
  const trailing = (7 - ((days.length) % 7)) % 7;
  for (let i = 1; i <= trailing; i++) {
    days.push(new Date(year, month, lastDay.getDate() + i));
  }

  // Ensure 6 rows (42 cells) for consistent layout
  while (days.length < 42) {
    const last = days[days.length - 1];
    days.push(new Date(last.getFullYear(), last.getMonth(), last.getDate() + 1));
  }

  return days;
}
  