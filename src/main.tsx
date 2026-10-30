/// <reference types="vite/client" />
import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";
import "./index.scss";

async function enableMocking() {
  if (import.meta.env.PROD) return;

  const { worker } = await import("./mocks/browser");
  return worker.start();
}

enableMocking().then(() => {
  ReactDOM.createRoot(document.getElementById("root")!).render(
    <React.StrictMode>
      <App name="World" />
    </React.StrictMode>
  );
});
