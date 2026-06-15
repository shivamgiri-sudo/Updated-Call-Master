import React from "react";
import { createRoot } from "react-dom/client";
import EnterpriseConsoleV2 from "./EnterpriseConsoleV2";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <EnterpriseConsoleV2 />
  </React.StrictMode>
);
