import { useState, useCallback, useMemo } from "react";
import DayCell from "./DayCell";
import { useCalendar } from "../hooks/useCalendar";
import type { Task } from "../utils/storage";
import { useDndMonitor, type DragEndEvent, type DragStartEvent, type DragOverEvent } from "@dnd-kit/core";
import { isBefore, isSameDay, isWithinInterval, min as dfMin, max as dfMax, addDays, differenceInCalendarDays } from 'date-fns';

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

  // Moving state for live preview
  const [moving, setMoving] = useState<{
    taskId: string;
    hoverDate: Date | null;
    durationDays: number; // inclusive duration in days offset used with addDays
  } | null>(null);

  // Callback to handle when the mouse enters a day cell during a drag operation
  const handleDragEnter = useCallback((date: Date) => {
    if (selectionStart && isSelectionDragging) {
      setSelectionEnd(date);
    }
  }, [selectionStart, isSelectionDragging]);
  const handleDoubleClickDay = useCallback((date: Date) => {
    // Create a single-day task via modal
    onCreateTask(date, date);
  }, [onCreateTask]);

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
      if (type === 'TASK_MOVE' && event.active.data.current?.taskId) {
        const taskId = event.active.data.current.taskId as string;
        const task = tasks.find((t) => t.id === taskId);
        if (task) {
          const start = new Date(task.startDate);
          const end = new Date(task.endDate);
          const duration = differenceInCalendarDays(end, start);
          setMoving({ taskId, hoverDate: null, durationDays: duration });
        }
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
      if (type === 'TASK_MOVE' && event.over?.data.current?.type === 'DAY_CELL_DROPPABLE') {
        const date = event.over.data.current.date as Date;
        setMoving((prev) => prev ? { ...prev, hoverDate: date } : prev);
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
      setMoving(null);
    },
    onDragCancel: () => {
      setIsSelectionDragging(false);
      setSelectionStart(null);
      setSelectionEnd(null);
      setResizing(null);
      setMoving(null);
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

  const isDayInMovePreview = useCallback((day: Date) => {
    if (!moving || !moving.hoverDate) return false;
    const previewStart = moving.hoverDate;
    const previewEnd = addDays(previewStart, moving.durationDays);
    return isWithinInterval(day, { start: dfMin([previewStart, previewEnd]), end: dfMax([previewStart, previewEnd]) });
  }, [moving]);

  // Group days into weeks (arrays of 7)
  const weeks = useMemo(() => {
    const result: Date[][] = [];
    for (let i = 0; i < days.length; i += 7) {
      result.push(days.slice(i, i + 7));
    }
    return result;
  }, [days]);

  // For each week, compute lane assignments so each task occupies a consistent row across days
  const dayKeyToLanedTasks = useMemo(() => {
    const map = new Map<string, Array<Task | null>>();

    for (const week of weeks) {
      const weekStart = week[0];
      const weekEnd = week[week.length - 1];

      // Tasks intersecting this week (inclusive)
      const weekTasks = tasks
        .filter((t) => {
          const tStart = new Date(t.startDate);
          const tEnd = new Date(t.endDate);
          return !(tEnd < weekStart || tStart > weekEnd);
        })
        .map((t) => {
          const tStart = new Date(t.startDate);
          const tEnd = new Date(t.endDate);
          const startInWeek = tStart < weekStart ? weekStart : tStart;
          const endInWeek = tEnd > weekEnd ? weekEnd : tEnd;
          return { task: t, startInWeek, endInWeek };
        })
        .sort((a, b) => a.startInWeek.getTime() - b.startInWeek.getTime());

      // Assign lanes using a greedy interval packing
      const laneEnds: Date[] = [];
      const taskLane = new Map<string, number>();
      for (const item of weekTasks) {
        let placedLane = -1;
        for (let lane = 0; lane < laneEnds.length; lane++) {
          // Non-overlap if previous lane end < current start
          if (laneEnds[lane] < item.startInWeek) {
            placedLane = lane;
            laneEnds[lane] = item.endInWeek;
            break;
          }
        }
        if (placedLane === -1) {
          laneEnds.push(item.endInWeek);
          placedLane = laneEnds.length - 1;
        }
        taskLane.set(item.task.id, placedLane);
      }

      const laneCount = laneEnds.length;

      // Initialize each day's lanes with nulls
      for (const day of week) {
        const key = day.toDateString();
        map.set(key, new Array<Task | null>(laneCount).fill(null));
      }

      // Fill each day with the task occupying that lane if the task covers that day
      for (const item of weekTasks) {
        const lane = taskLane.get(item.task.id)!;
        for (const day of week) {
          if (isWithinInterval(day, { start: item.startInWeek, end: item.endInWeek })) {
            const key = day.toDateString();
            const arr = map.get(key)!;
            arr[lane] = item.task;
          }
        }
      }
    }

    return map;
  }, [weeks, tasks]);

  return (
    <div className="grid grid-cols-7 gap-2 p-2">
      {days.map((day) => {
        const laned = dayKeyToLanedTasks.get(day.toDateString()) || [];
        const selectedBg = isDaySelected(day) && isSelectionDragging ? 'bg-blue-300' : '';
        const resizeBg = isDayInResizePreview(day) ? 'bg-amber-200' : '';
        const moveBg = isDayInMovePreview(day) ? 'bg-indigo-200' : '';
        return (
          <DayCell
            key={day.toISOString()}
            date={day}
            lanedTasks={laned}
            onDragEnter={handleDragEnter}
            onDragLeave={handleDragLeave}
            classNameProp={`${selectedBg} ${resizeBg} ${moveBg}`.trim()}
            onRequestEditTask={onRequestEditTask}
            onDoubleClickDay={handleDoubleClickDay}
          />
        );
      })}
    </div>
  );
}