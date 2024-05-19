import { ReactElement, useEffect, useState } from "react";
import { RouterProvider } from "react-router";
import { createBrowserRouter } from "react-router-dom";
import Navbar from "./components/Navbar";
import Sentence from "./components/Sentence";
import Home from "./pages/Home";
import Login from "./pages/Login";
import PracticePage from "./pages/PracticePage";
import Register from "./pages/Register";
import VocabularySelectPage from "./pages/VocabularySelectPage";
import VocabularyWatchPage from "./pages/VocabularyWatchPage";
import { Account } from "./types/Subtitle";
import AccountContext from "./contexts/AccountContext";
import Profile from "./pages/Profile";

interface AppProps {}

const router = createBrowserRouter([
  { path: "/", element: <Home /> },
  {
    path: "/vocabulary",
    element: <VocabularySelectPage />,
  },
  {
    path: "/vocabularyWatch/:vocab",
    element: <VocabularyWatchPage />,
  },
  {
    path: "/practice",
    element: <PracticePage />,
  },
  {
    path: "/register",
    element: <Register />,
  },
  {
    path: "/login",
    element: <Login />,
  },
  {
    path: "/profile",
    element: <Profile />,
  },
  {
    path: "/test",
    element: <Sentence text="私は勉強しています" />,
  },
]);

export default function App({}: AppProps): ReactElement {
  const [account, setAccount] = useState<Account | null>(null);

  useEffect(() => {
    const interval = setInterval(() => {
      fetch("http://localhost:4445/me", { credentials: "include" }).then(
        (res) => {
          res.json().then((data) => {
            setAccount(data);
          });
        }
      );
    }, 1000);

    return () => {
      clearInterval(interval);
    };
  }, []);

  console.log(account);

  return (
    <div>
      <AccountContext.Provider value={account}>
        <Navbar
          account={account}
          onLogout={() => {
            fetch("http://localhost:4445/logout", {
              credentials: "include",
            }).then(() => {
              setAccount(null);
              window.location.href = "/";
            });
          }}
        />
        <RouterProvider router={router} />
      </AccountContext.Provider>
    </div>
  );
}
