import { ReactElement, useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";

interface SentenceProps {
  text: string;
  highlightBasic?: string;
  clickToOtherWord?: boolean;
}

const auxilary = "助動詞";
const verb = "動詞";
const noun = "名詞";
const adjective = "形容詞";
const particle = "助詞";
const adverb = "副詞";

export default function Sentence({
  text,
  highlightBasic,
  clickToOtherWord = false,
}: SentenceProps): ReactElement {
  const [tokens, setTokens] = useState<
    {
      surface_form: string;
      word_position: number;
      pos: string;
      basic_form: string;
      pronounciation: string;
    }[]
  >([]);

  const navigate = useNavigate();

  useEffect(() => {
    fetch(`http://localhost:4445/tokenize?text=${text}`).then((res) => {
      res.json().then((data) => {
        setTokens(data);
      });
    });
  }, [text]);

  return (
    <div>
      {tokens.map((token) => {
        const yes = [verb, noun, adjective, adverb].includes(token.pos);

        return (
          <span
            onClick={() => {
              if (!clickToOtherWord) {
                return;
              }
              navigate(`/vocabularyWatch/${token.basic_form}`);
            }}
            className={`${
              token.basic_form === highlightBasic && "bg-secondary"
            } border-primary ${
              yes &&
              clickToOtherWord &&
              "border cursor-pointer hover:bg-white hover:bg-opacity-30"
            }`}
          >
            {token.surface_form}
          </span>
        );
      })}
    </div>
  );
}
