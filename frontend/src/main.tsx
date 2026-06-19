import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";
import EnterpriseConsoleV2 from "./EnterpriseConsoleV2";
import AppV1 from "./AppV1";
import "./styles.css";

createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <BrowserRouter>
      <Routes>
        {/* v1 executive dashboard — /v1/* */}
        <Route path="/v1/*" element={<AppV1 />} />
        {/* Legacy app — everything else */}
        <Route path="/*" element={<EnterpriseConsoleV2 />} />
      </Routes>
    </BrowserRouter>
  </React.StrictMode>
);
