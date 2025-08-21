import React, { useCallback } from "react";
import EventCard from "./EventCard";
import type { Event } from "../utils/storage";
import { useDroppable, useDraggable } from "@dnd-kit/core";

type Props = {
  date: Date;
  events: Event[];
  onDropEvent: (day: Date, eventId: string) => void;
  onDragEnter: (date: Date) => void;
  onDragLeave: (date: Date) => void;
  classNameProp?: string; // Prop to pass additional class names for styling
};

export default function DayCell({ date, events, onDropEvent, onDragEnter, onDragLeave, classNameProp }: Props) {
  // Hook for making the DayCell a droppable target
  const { isOver, setNodeRef: setDroppableNodeRef } = useDroppable({
    id: date.toISOString(), // Unique ID for this droppable day cell
    data: { date: date, type: 'DAY_CELL_DROPPABLE' }, // Data for droppable events
  });

  // Hook for making the DayCell a draggable source
  const { attributes, listeners, setNodeRef: setDraggableNodeRef } = useDraggable({
    id: `draggable-day-${date.toISOString()}`, // Unique ID for draggable. Important to distinguish from droppable ID.
    data: { date: date, type: 'DAY_CELL_SELECTION' }, // Data for the drag operation for selection
  });

  // Combine the refs for both droppable and draggable onto the same DOM node.
  const combinedRef = useCallback((node: HTMLDivElement) => {
    setDroppableNodeRef(node);
    setDraggableNodeRef(node);
  }, [setDroppableNodeRef, setDraggableNodeRef]);

  // Handlers for mouse events to track drag selection across cells
  const handleMouseEnter = () => {
    onDragEnter(date);
  };

  const handleMouseLeave = () => {
    onDragLeave(date);
  };

  return (
    <div
      ref={combinedRef} // Apply the combined ref
      className={`border rounded-md p-2 min-h-[100px] ${isOver ? "bg-blue-200" : "bg-gray-50"} ${classNameProp || ''}`} // Apply classNameProp
      {...listeners} // Apply draggable listeners
      {...attributes} // Apply draggable attributes
      onMouseEnter={handleMouseEnter} // Use for drag selection visual feedback
      onMouseLeave={handleMouseLeave} // Use for drag selection visual feedback
      style={{ touchAction: 'none' }} // Needed for touch devices to prevent scrolling during drag
    >
      <div className="text-xs font-bold">{date.getDate()}</div>
      <div className="flex flex-col gap-1 mt-1">
        {events.map((event) => (
          <EventCard key={event.id} event={event} />
        ))}
      </div>
    </div>
  );
}