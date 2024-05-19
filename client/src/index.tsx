import React from "react";
import ReactDOM from "react-dom/client";
import "./index.css";

import { createBrowserRouter, RouterProvider } from "react-router-dom";
import "./index.css";
import VocabularySelectPage from "./pages/VocabularySelectPage";
import VocabularyWatchPage from "./pages/VocabularyWatchPage";
import Sentence from "./components/Sentence";
import Home from "./pages/Home";
import PracticePage from "./pages/PracticePage";
import Navbar from "./components/Navbar";
import Login from "./pages/Login";
import Register from "./pages/Register";
import App from "./App";

ReactDOM.createRoot(document.getElementById("root") as HTMLElement).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
