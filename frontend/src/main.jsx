import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { initTelegram } from "./telegram";
import "./styles/index.css";

initTelegram();

ReactDOM.createRoot(document.getElementById("root")).render(
  <React.StrictMode>
    {/* BrowserRouter, not HashRouter: Telegram appends its own #tgWebAppData=... fragment
        to the URL on load, which collides with HashRouter's use of # for routing and
        leaves the app blank until a nav click overwrites the hash. vercel.json already
        rewrites all paths to index.html, so BrowserRouter works fine here. */}
    <BrowserRouter>
      <App />
    </BrowserRouter>
  </React.StrictMode>
);