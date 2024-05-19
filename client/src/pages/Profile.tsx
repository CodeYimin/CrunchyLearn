import { ReactElement, useContext } from "react";
import AccountContext from "../contexts/AccountContext";
import Dropdown from "../components/Dropdown";

interface ProfileProps {}

export default function Profile({}: ProfileProps): ReactElement {
  const account = useContext(AccountContext);

  if (!account) {
    return <div>Loading...</div>;
  }

  return (
    <div>
      <div className="w-full flex flex-col items-center gap-5">
        <p className="text-[3rem]">{account.username}'s Profile</p>
        <div className="w-[80%]">
          <Dropdown
            name="Practice History"
            content={account.practiceRecords
              .sort(
                (a, b) =>
                  new Date(b.date).getTime() - new Date(a.date).getTime()
              )
              .map((p) => (
                <div className="h-30 flex justify-between p-2 border">
                  <p>Original: {p.subtitle}</p>
                  <p>Your translation: {p.userAnswer}</p>
                  <p>Correct translation: {p.translation}</p>
                  <p>Date: {new Date(p.date).toLocaleString()}</p>
                  <p>Score: {Math.round(p.score * 100)}%</p>
                </div>
              ))}
          />
        </div>
        <div className="w-[80%]">
          <Dropdown
            name="Vocabulary in Learning"
            content={account.vocabulary
              .filter((v) => !v.learned)
              .map((v) => (
                <a
                  href={`/vocabularyWatch/${v.word}`}
                  className="h-30 flex justify-between p-2 btn"
                >
                  <p>{v.word}</p>
                  <p>{v.meaning}</p>
                  {v.level && <p>N{v.level}</p>}
                </a>
              ))}
          />
        </div>
        <div className="w-[80%]">
          <Dropdown
            name="Finished Learned Vocabulary"
            content={account.vocabulary
              .filter((v) => v.learned)
              .map((v) => (
                <a
                  href={`/vocabularyWatch/${v.word}`}
                  className="h-30 flex justify-between p-2 btn"
                >
                  <p>{v.word}</p>
                  <p>{v.meaning}</p>
                  {v.level && <p>N{v.level}</p>}
                </a>
              ))}
          />
        </div>
      </div>
    </div>
  );
}
