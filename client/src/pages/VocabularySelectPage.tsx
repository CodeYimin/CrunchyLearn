import { ReactElement, useEffect, useState } from "react";

interface VocabularySelectPageProps {}

export default function VocabularySelectPage({}: VocabularySelectPageProps): ReactElement {
  const [vocabulary, setVocabulary] = useState<{ word: string }[]>([]);
  const [level, setLevel] = useState<string>("");

  useEffect(() => {
    fetch(`http://localhost:4445/vocabulary?level=${level}`).then((res) => {
      res.json().then((data) => {
        setVocabulary(data);
      });
    });
  }, [level]);

  return (
    <div className="w-screen flex flex-col items-center">
      <div className="text-[5rem]">Vocabulary browser</div>
      <select
        onInput={(event) => {
          setLevel(event.currentTarget.value);
        }}
        className="select w-60 select-bordered select-primary mt-5 mb-5"
      >
        <option disabled selected>
          Pick Vocabulary Level
        </option>
        <option value={5}>N5</option>
        <option value={4}>N4</option>
        <option value={3}>N3</option>
        <option value={2}>N2</option>
        <option value={1}>N1</option>
      </select>
      <div className="w-[30rem] flex flex-col items-center gap-3 h-[40rem] overflow-y-scroll outline outline-primary">
        {vocabulary.map((v) => (
          <div>
            <a
              href={`vocabularyWatch/${v.word}`}
              className="btn btn-primary w-32"
            >
              {v.word}
            </a>
          </div>
        ))}
      </div>
    </div>
  );
}
