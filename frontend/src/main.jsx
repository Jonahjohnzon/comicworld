import React from "react";
import ReactDOM from "react-dom/client";
import { HashRouter } from "react-router-dom";
import App from "./App";
import { initTelegram } from "./telegram";
import "./styles/index.css";

initTelegram();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* HashRouter avoids needing server-side rewrite config inside the Telegram in-app browser */}
    <HashRouter>
      <App />
    </HashRouter>
  </React.StrictMode>
);
