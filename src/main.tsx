import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import { DndContext } from '@dnd-kit/core';
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <DndContext>
       <App />
    </DndContext>
    
  </React.StrictMode>
);
