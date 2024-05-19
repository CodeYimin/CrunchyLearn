import { ReactElement, useContext } from "react";
import { Account } from "../types/Subtitle";
import AccountContext from "../contexts/AccountContext";

interface HomeProps {}

export default function Home({}: HomeProps): ReactElement {
  const account = useContext(AccountContext);

  return (
    <div className="w-screen flex flex-col items-center">
      {account ? (
        <div className="text-[3rem] text-center mt-[5rem] flex flex-col items-center">
          <h1>Welcome back, {account.username}!</h1>
          <p>Click on the menu to get started.</p>
          <div className="flex gap-5 mx-auto mt-5">
            <a
              href="/vocabulary"
              className="btn btn-primary w-[15rem] h-[5rem] text-[2rem]"
            >
              Explore
            </a>
            <a
              href="/practice"
              className="btn btn-primary w-[15rem] h-[5rem] text-[2rem]"
            >
              Practice
            </a>
          </div>
        </div>
      ) : (
        <div className="text-[3rem] text-center mt-[5rem] flex flex-col items-center">
          <h1>Welcome to CrunchyLearn!</h1>
          <p>CrunchyLearn is a platform for learning Japanese through anime.</p>
          <p>Register or Login to get started.</p>
          <div className="flex gap-5 mx-auto mt-5">
            <a
              href="/login"
              className="btn btn-primary w-[15rem] h-[5rem] text-[2rem]"
            >
              Login
            </a>
            <a
              href="/register"
              className="btn btn-primary w-[15rem] h-[5rem] text-[2rem]"
            >
              Register
            </a>
          </div>
        </div>
      )}
    </div>
  );
}
