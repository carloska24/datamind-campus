import React from "react";
import { createRoot } from "react-dom/client";
import AccountGate from "./components/AccountGate";
createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <AccountGate />
  </React.StrictMode>,
);
