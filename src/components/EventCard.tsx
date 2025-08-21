import React from "react";
import { Event } from "../utils/storage";

export default function EventCard({ event }: { event: Event }) {
  const handleDragStart = (e: React.DragEvent) => {
    e.dataTransfer.setData("text/plain", event.id);
  };

  return (
    <div
      draggable
      onDragStart={handleDragStart}
      className="p-1 text-xs rounded bg-blue-500 text-white cursor-grab"
    >
      {event.title}
    </div>
  );
}
