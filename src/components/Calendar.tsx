import React, { useState, useCallback } from "react";
import DayCell from "./DayCell";
import { useCalendar } from "../hooks/useCalendar";
import type { Event } from "../utils/storage";
import { useDndMonitor, type DragEndEvent } from "@dnd-kit/core";
import { isSameDay, isBefore } from 'date-fns';

type CalendarProps = {
  month: number;
  year: number;
  events: Event[];
  onDropEvent: (day: Date, eventId: string) => void;
  onCreateTask: (startDate: Date, endDate: Date) => void; // Prop for creating tasks
};

export default function Calendar({ month, year, events, onDropEvent, onCreateTask }: CalendarProps) {
  const days = useCalendar(month, year);
  const [selectionStart, setSelectionStart] = useState<Date | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<Date | null>(null);
  const [isDragging, setIsDragging] = useState(false);

  // Callback to handle when the mouse enters a day cell during a drag operation
  const handleDragEnter = useCallback((date: Date) => {
    if (selectionStart && isDragging) {
      setSelectionEnd(date); // Update the end of the selection range
    }
  }, [selectionStart, isDragging]);

  // Callback to handle when the mouse leaves a day cell during a drag operation (less critical for selection range)
  const handleDragLeave = useCallback((date: Date) => {
    // For drag selection, leaving a cell doesn't necessarily clear the selection end.
    // This function can be used for more advanced visual feedback if needed.
  }, []);

  // Monitor drag and drop events from @dnd-kit/core
  useDndMonitor({
    onDragStart: (event) => {
      // Only initiate task creation selection if the drag originates from a DayCell
      if (event.active.data.current?.type === 'DAY_CELL_SELECTION' && event.active.data.current?.date) {
        setIsDragging(true); // Indicate that a drag for selection has started
        const date = event.active.data.current.date as Date;
        setSelectionStart(date); // Set the start date of the selection
        setSelectionEnd(date); // Initially, end date is same as start date
      }
    },
    onDragEnd: (event: DragEndEvent) => {
      setIsDragging(false); // Reset dragging state
      // If a selection was made, call the onCreateTask prop
      if (selectionStart && selectionEnd) {
        // Ensure start date is before end date for correct range
        const sortedDates = [selectionStart, selectionEnd].sort((a, b) => a.getTime() - b.getTime());
        onCreateTask(sortedDates[0], sortedDates[1]); // Trigger task creation modal
      }
      setSelectionStart(null); // Clear selection start
      setSelectionEnd(null); // Clear selection end
    },
    onDragCancel: () => {
      setIsDragging(false); // Reset dragging state on cancel
      setSelectionStart(null); // Clear selection start
      setSelectionEnd(null); // Clear selection end
    },
  });

  // Determines if a given day falls within the current drag selection range
  const isDaySelected = useCallback((day: Date) => {
    if (!selectionStart || !selectionEnd) return false;

    // Determine the actual start and end of the selection, regardless of drag direction
    const sortedStart = isBefore(selectionStart, selectionEnd) ? selectionStart : selectionEnd;
    const sortedEnd = isBefore(selectionStart, selectionEnd) ? selectionEnd : selectionStart;

    // Check if the day is the start, end, or strictly between the selection range
    return (isSameDay(day, sortedStart) || isSameDay(day, sortedEnd) || (day > sortedStart && day < sortedEnd));
  }, [selectionStart, selectionEnd]);

  return (
    <div className="grid grid-cols-7 gap-2 p-2">
      {days.map((day, idx) => (
        <DayCell
          key={idx}
          date={day}
          events={events.filter((e) => isSameDay(new Date(e.date), day))}
          onDropEvent={onDropEvent}
          onDragEnter={handleDragEnter}
          onDragLeave={handleDragLeave}
          classNameProp={isDaySelected(day) && isDragging ? "bg-blue-300" : ""} // Apply selection highlight
        />
      ))}
    </div>
  );
}