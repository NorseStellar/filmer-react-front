import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App.jsx";

ReactDOM.createRoot(document.getElementById("root")).render(
   <React.StrictMode>
      <App />
   </React.StrictMode>,
);

if ("serviceWorker" in navigator) {
   window.addEventListener("load", () => {
      navigator.serviceWorker
         .register("/service-worker.js")
         .then((reg) => console.log("Service-workern är registrerad", reg))
         .catch((err) => console.log("Service-workern kunde inte registreras!", err));
   });
}
