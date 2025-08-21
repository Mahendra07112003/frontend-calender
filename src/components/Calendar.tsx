import { useState, useCallback } from "react";
import DayCell from "./DayCell";
import { useCalendar } from "../hooks/useCalendar";
import type { Task } from "../utils/storage";
import { useDndMonitor, type DragEndEvent, type DragStartEvent, type DragOverEvent } from "@dnd-kit/core";
import { isBefore, isSameDay, isWithinInterval, min as dfMin, max as dfMax } from 'date-fns';

type CalendarProps = {
  month: number;
  year: number;
  tasks: Task[];
  onDropTask: (day: Date, taskId: string) => void;
  onResizeTaskLeft: (taskId: string, newStart: Date) => void;
  onResizeTaskRight: (taskId: string, newEnd: Date) => void;
  onRequestEditTask: (task: Task) => void;
  onCreateTask: (startDate: Date, endDate: Date) => void;
};

export default function Calendar({ month, year, tasks, onDropTask, onResizeTaskLeft, onResizeTaskRight, onRequestEditTask, onCreateTask }: CalendarProps) {
  const days = useCalendar(month, year);
  const [selectionStart, setSelectionStart] = useState<Date | null>(null);
  const [selectionEnd, setSelectionEnd] = useState<Date | null>(null);
  const [isSelectionDragging, setIsSelectionDragging] = useState(false);

  // Resizing state for live preview
  const [resizing, setResizing] = useState<{
    taskId: string;
    side: 'left' | 'right';
    hoverDate: Date | null;
  } | null>(null);

  // Callback to handle when the mouse enters a day cell during a drag operation
  const handleDragEnter = useCallback((date: Date) => {
    if (selectionStart && isSelectionDragging) {
      setSelectionEnd(date);
    }
  }, [selectionStart, isSelectionDragging]);

  // Callback to handle when the mouse leaves a day cell during a drag operation (less critical for selection range)
  const handleDragLeave = useCallback(() => {
    // For drag selection, leaving a cell doesn't necessarily clear the selection end.
    // This function can be used for more advanced visual feedback if needed.
  }, []);

  // Monitor drag and drop events from @dnd-kit/core
  useDndMonitor({
    onDragStart: (event: DragStartEvent) => {
      const type = event.active.data.current?.type;
      if (type === 'DAY_CELL_SELECTION' && event.active.data.current?.date) {
        setIsSelectionDragging(true);
        const date = event.active.data.current.date as Date;
        setSelectionStart(date);
        setSelectionEnd(date);
      }
      if ((type === 'TASK_RESIZE_LEFT' || type === 'TASK_RESIZE_RIGHT') && event.active.data.current?.taskId) {
        setResizing({ taskId: event.active.data.current.taskId as string, side: type === 'TASK_RESIZE_LEFT' ? 'left' : 'right', hoverDate: null });
      }
    },
    onDragOver: (event: DragOverEvent) => {
      const type = event.active.data.current?.type;
      if ((type === 'TASK_RESIZE_LEFT' || type === 'TASK_RESIZE_RIGHT') && event.over?.data.current?.type === 'DAY_CELL_DROPPABLE') {
        const date = event.over.data.current.date as Date;
        setResizing((prev) => prev ? { ...prev, hoverDate: date } : prev);
      }
      if (type === 'DAY_CELL_SELECTION' && event.over?.data.current?.type === 'DAY_CELL_DROPPABLE') {
        const date = event.over.data.current.date as Date;
        if (isSelectionDragging) setSelectionEnd(date);
      }
    },
    onDragEnd: (event: DragEndEvent) => {
      const type = event.active.data.current?.type;

      if (type === 'DAY_CELL_SELECTION') {
        setIsSelectionDragging(false);
        if (selectionStart && selectionEnd) {
          const sortedDates = [selectionStart, selectionEnd].sort((a, b) => a.getTime() - b.getTime());
          onCreateTask(sortedDates[0], sortedDates[1]);
        }
        setSelectionStart(null);
        setSelectionEnd(null);
      }

      if (type === 'TASK_MOVE' && event.over?.data.current?.type === 'DAY_CELL_DROPPABLE' && event.active.data.current?.taskId) {
        const date = event.over.data.current.date as Date;
        onDropTask(date, event.active.data.current.taskId as string);
      }

      if ((type === 'TASK_RESIZE_LEFT' || type === 'TASK_RESIZE_RIGHT') && event.over?.data.current?.type === 'DAY_CELL_DROPPABLE' && event.active.data.current?.taskId) {
        const date = event.over.data.current.date as Date;
        const taskId = event.active.data.current.taskId as string;
        if (type === 'TASK_RESIZE_LEFT') onResizeTaskLeft(taskId, date);
        if (type === 'TASK_RESIZE_RIGHT') onResizeTaskRight(taskId, date);
      }

      setResizing(null);
    },
    onDragCancel: () => {
      setIsSelectionDragging(false);
      setSelectionStart(null);
      setSelectionEnd(null);
      setResizing(null);
    },
  });

  // Determines if a given day falls within the current drag selection range
  const isDaySelected = useCallback((day: Date) => {
    if (!selectionStart || !selectionEnd) return false;
    const sortedStart = isBefore(selectionStart, selectionEnd) ? selectionStart : selectionEnd;
    const sortedEnd = isBefore(selectionStart, selectionEnd) ? selectionEnd : selectionStart;
    return (isSameDay(day, sortedStart) || isSameDay(day, sortedEnd) || (day > sortedStart && day < sortedEnd));
  }, [selectionStart, selectionEnd]);

  const isDayInResizePreview = useCallback((day: Date) => {
    if (!resizing) return false;
    const task = tasks.find((t) => t.id === resizing.taskId);
    if (!task) return false;
    const start = new Date(task.startDate);
    const end = new Date(task.endDate);
    const hover = resizing.hoverDate ?? (resizing.side === 'left' ? start : end);
    const previewStart = resizing.side === 'left' ? (hover < end ? hover : end) : start;
    const previewEnd = resizing.side === 'right' ? (hover > start ? hover : start) : end;
    return isWithinInterval(day, { start: dfMin([previewStart, previewEnd]), end: dfMax([previewStart, previewEnd]) });
  }, [resizing, tasks]);

  return (
    <div className="grid grid-cols-7 gap-2 p-2">
      {days.map((day) => {
        const dayTasks = tasks.filter((t) => isWithinInterval(day, { start: new Date(t.startDate), end: new Date(t.endDate) }));
        const selectedBg = isDaySelected(day) && isSelectionDragging ? 'bg-blue-300' : '';
        const resizeBg = isDayInResizePreview(day) ? 'bg-amber-200' : '';
        return (
          <DayCell
            key={day.toISOString()}
            date={day}
            tasks={dayTasks}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            classNameProp={`${selectedBg} ${resizeBg}`.trim()}
            onRequestEditTask={onRequestEditTask}
          />
        );
      })}
    </div>
  );
}