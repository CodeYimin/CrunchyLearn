import { ReactElement } from "react";
import { Account } from "../types/Subtitle";

interface NavbarProps {
  account: Account | null;
  onLogout: () => void;
}

export default function Navbar({
  account,
  onLogout,
}: NavbarProps): ReactElement {
  return (
    <div className="navbar bg-base-100">
      <div className="flex-1">
        <a href="/" className="btn btn-ghost text-xl">
          CrunchyLearn
        </a>
      </div>
      <div className="flex-none">
        {account === null ? (
          <ul className="menu menu-horizontal px-1">
            <li>
              <a className="text-lg" href="/register">
                Register
              </a>
            </li>
            <li>
              <a className="text-lg" href="/login">
                Login
              </a>
            </li>
          </ul>
        ) : (
          <ul className="menu menu-horizontal px-1">
            <li>
              <button className="text-lg" onClick={() => onLogout()}>
                Logout
              </button>
            </li>
            <li>
              <a className="text-lg" href="/vocabulary">
                Explore
              </a>
            </li>
            <li>
              <a className="text-lg" href="/practice">
                Practice
              </a>
            </li>
            <li>
              <a className="text-lg" href="/profile">
                Profile
              </a>
            </li>
          </ul>
        )}
      </div>
    </div>
  );
}
