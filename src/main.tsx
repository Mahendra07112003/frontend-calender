import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { DndContext, MouseSensor, TouchSensor, useSensor, useSensors } from '@dnd-kit/core';
import "./index.css";

function Root() {
	const sensors = useSensors(
		useSensor(MouseSensor, {
			activationConstraint: { distance: 6 },
		}),
		useSensor(TouchSensor, {
			activationConstraint: { delay: 150, tolerance: 6 },
		})
	);
	return (
		<DndContext sensors={sensors}>
			<App />
		</DndContext>
	);
}

ReactDOM.createRoot(document.getElementById("root")!).render(
	<React.StrictMode>
		<Root />
	</React.StrictMode>
);
