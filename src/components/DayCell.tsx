import React, { useCallback } from "react";
import type { Task } from "../utils/storage";
import { useDroppable, useDraggable } from "@dnd-kit/core";
import { isSameDay } from 'date-fns';

const categoryColor: Record<Task['category'], string> = {
	'To Do': 'bg-blue-500',
	'In Progress': 'bg-yellow-500',
	'Review': 'bg-purple-500',
	'Completed': 'bg-green-600',
};

function TaskSegment({ task, date, onRequestEditTask }: { task: Task; date: Date; onRequestEditTask: (task: Task) => void }) {
	const start = new Date(task.startDate);
	const end = new Date(task.endDate);
	const isStart = isSameDay(date, start);
	const isEnd = isSameDay(date, end);

	const moveDraggable = useDraggable({
		id: `task-move-${task.id}-${date.toISOString()}`,
		data: { type: 'TASK_MOVE', taskId: task.id },
	});

	const leftResize = useDraggable({
		id: `task-resize-left-${task.id}-${date.toISOString()}`,
		data: { type: 'TASK_RESIZE_LEFT', taskId: task.id },
	});

	const rightResize = useDraggable({
		id: `task-resize-right-${task.id}-${date.toISOString()}`,
		data: { type: 'TASK_RESIZE_RIGHT', taskId: task.id },
	});

	return (
		<div className="relative">
			<div
				ref={moveDraggable.setNodeRef}
				{...moveDraggable.listeners}
				{...moveDraggable.attributes}
				className={`${categoryColor[task.category]} text-white text-xs px-2 py-1 select-none flex items-center gap-2 ${isStart ? 'rounded-l' : ''} ${isEnd ? 'rounded-r' : ''}`}
				onDoubleClick={(e) => { e.stopPropagation(); onRequestEditTask(task); }}
			>
				{isStart && (
					<span
						ref={leftResize.setNodeRef as unknown as React.Ref<HTMLSpanElement>}
						{...leftResize.listeners}
						{...leftResize.attributes}
						className="w-2 h-3 bg-white/80 rounded-sm cursor-ew-resize"
					/>
				)}
				<span className="truncate">{task.name}</span>
				<button
					type="button"
					className="ml-auto px-1 py-0.5 rounded bg-white/20 hover:bg-white/30 text-[10px]"
					onClick={(e) => { e.stopPropagation(); onRequestEditTask(task); }}
				>
					Edit
				</button>
				{isEnd && (
					<span
						ref={rightResize.setNodeRef as unknown as React.Ref<HTMLSpanElement>}
						{...rightResize.listeners}
						{...rightResize.attributes}
						className="w-2 h-3 bg-white/80 rounded-sm cursor-ew-resize ml-2"
					/>
				)}
			</div>
		</div>
	);
}

type Props = {
	date: Date;
	lanedTasks: Array<Task | null>;
	onDragEnter: (date: Date) => void;
	onDragLeave: (date: Date) => void;
	classNameProp?: string;
	onRequestEditTask: (task: Task) => void;
	onDoubleClickDay?: (date: Date) => void;
};

export default function DayCell({ date, lanedTasks, onDragEnter, onDragLeave, classNameProp, onRequestEditTask, onDoubleClickDay }: Props) {
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
			ref={combinedRef}
			className={`border rounded-md p-2 min-h-[100px] ${isOver ? "bg-blue-200" : "bg-gray-50"} ${classNameProp || ''}`}
			{...listeners}
			{...attributes}
			onMouseEnter={handleMouseEnter}
			onMouseLeave={handleMouseLeave}
			onDoubleClick={(e) => { e.preventDefault(); e.stopPropagation(); if (onDoubleClickDay) onDoubleClickDay(date); }}
			style={{ touchAction: 'none' }}
		>
			<div className="text-xs font-bold flex items-center justify-between">
				<span>{date.getDate()}</span>
			</div>

			{/* Render lanes to align tasks into consistent rows across the week */}
			<div className="flex flex-col gap-1 mt-1">
				{lanedTasks.map((task, laneIdx) => (
					<div key={`${date.toDateString()}-lane-${laneIdx}`} className="min-h-[18px]">
						{task && (
							<TaskSegment task={task} date={date} onRequestEditTask={onRequestEditTask} />
						)}
					</div>
				))}
			</div>
		</div>
	);
}