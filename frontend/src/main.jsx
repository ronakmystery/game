// import React from "react"
// import ReactDOM from "react-dom/client"
// import App from "./App"

// ReactDOM.createRoot(document.getElementById("root")).render(
//     // <React.StrictMode>
//     <App />
//     // </React.StrictMode>
// )


import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter, Routes, Route } from "react-router-dom";

import App from "./App.jsx";          // your Game page
import DebugPage from "./DebugPage.jsx";  // new debug page


ReactDOM.createRoot(document.getElementById("root")).render(
    <BrowserRouter>
        <Routes>
            <Route path="/" element={<App />} />
            <Route path="/debug" element={<DebugPage />} />
        </Routes>
    </BrowserRouter>
);
