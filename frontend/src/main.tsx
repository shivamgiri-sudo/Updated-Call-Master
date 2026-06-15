import React from "react";
import { createRoot } from "react-dom/client";
import EnterpriseConsole from "./EnterpriseConsole";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <EnterpriseConsole />
  </React.StrictMode>
);
