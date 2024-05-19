import {
  ReactElement,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import ReactPlayer from "react-player";
import { useParams } from "react-router-dom";
import Sentence from "../components/Sentence";
import { Subtitle } from "../types/Subtitle";
import AccountContext from "../contexts/AccountContext";

interface VocabularyWatchPageProps {}

async function tokenize(text: string) {
  const res = await fetch("http://localhost:4445/tokenize?text=" + text);
  return await res.json();
}

export default function VocabularyWatchPage({}: VocabularyWatchPageProps): ReactElement {
  const account = useContext(AccountContext);
  const { vocab } = useParams() as { vocab: string };
  const playerRef = useRef<ReactPlayer>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [videoUrl, setVideoUrl] = useState("");
  const [foundSubs, setFoundSubs] = useState<Subtitle[]>([]);
  const [subNum, setSubNum] = useState<number | undefined>(undefined);
  const currentSub = useMemo(
    () => (subNum !== undefined ? foundSubs[subNum] : undefined),
    [subNum, foundSubs]
  );
  const [definition, setDefinition] = useState<string>("");
  const progress =
    currentSub === undefined
      ? 0
      : (time - currentSub?.start) / (currentSub?.end - currentSub?.start);
  const [transcriptMeaning, setTranscriptMeaning] = useState<string>("");

  tokenize(currentSub?.text || "").then(console.log);

  useEffect(() => {
    if (!currentSub) {
      return;
    }

    fetch(`http://localhost:4445/getEnglish?text=${currentSub.text}`).then(
      (res) => {
        res.text().then((data) => {
          setTranscriptMeaning(data);
        });
      }
    );
  }, [currentSub]);

  useEffect(() => {
    const anime = "";
    fetch(
      // "http://localhost:4445/recommend?level=5&amount=50&anime=" + anime
      "http://localhost:4445/search?q=" + vocab
    ).then((res) => {
      res.json().then(async (data) => {
        setFoundSubs(data);
      });
    });
    fetch(`http://localhost:4445/getEnglish?text=${vocab}`).then((res) => {
      res.text().then((data) => {
        setDefinition(data);
      });
    });
  }, [vocab]);

  const vocabInAccount = account?.vocabulary.find((v) => v.word === vocab);

  return (
    <div className="h-screen w-screen flex flex-col items-center gap-10">
      <div className="text-center">
        <div className="flex gap-10 items-center">
          <p className="text-[5rem]">Clips containing: {vocab}</p>
          <button
            className="btn btn-primary btn-outline"
            disabled={vocabInAccount?.learned}
            onClick={() => {
              if (!account) {
                return;
              }

              if (vocabInAccount) {
                fetch(
                  "http://localhost:4445/removeVocab?id=" + vocabInAccount.id,
                  { credentials: "include" }
                );
              } else {
                fetch(
                  `http://localhost:4445/addVocab?vocab=${vocab}&meaning=${definition}`,
                  {
                    credentials: "include",
                  }
                );
              }
            }}
          >
            {vocabInAccount?.learned
              ? "Already learned"
              : vocabInAccount
              ? `Remove ${vocab} from learning list`
              : `Add ${vocab} to learning list`}
          </button>
        </div>
        <p className="text-[1.5rem]">Definition: {definition}</p>
      </div>
      <div className="flex gap-10">
        <div className="flex flex-col">
          <div className="flex justify-center items-center outline outline-primary text-[1.5rem] h-16">
            Transcript Browser
          </div>
          <div className="flex flex-col items-center w-[30rem] h-[30rem] overflow-y-scroll outline outline-primary gap-3 pt-5">
            {foundSubs.map((s, i) => (
              <button
                className="btn btn-primary ml-3 mr-3"
                onClick={() => {
                  setSubNum(i);

                  fetch(
                    `http://localhost:4444/anime/episode-srcs?id=${foundSubs[i].episodeId}&server=vidstreaming&category=sub`
                  ).then((r) =>
                    r.json().then((d) => {
                      setVideoUrl(d.sources[0].url);
                    })
                  );
                }}
              >
                <Sentence text={s.text} highlightBasic={vocab} />
              </button>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-5">
          <div className=" w-[40rem]">
            <div className="text-[1rem]">Anime: {currentSub?.anime}</div>
            <div className="text-[1rem]">Meaning: {transcriptMeaning}</div>
            <div className="text-[1.5rem]">
              Transcript:{" "}
              <Sentence
                text={currentSub?.text || ""}
                highlightBasic={vocab}
                clickToOtherWord={true}
              />
            </div>
          </div>
          <ReactPlayer
            ref={playerRef}
            playing={playing}
            controls={false}
            onReady={() => {
              const player = playerRef.current;
              if (!player) {
                return;
              }

              player.seekTo(currentSub?.start || 0, "seconds");
              setPlaying(true);
            }}
            onProgress={(progress) => {
              setTime(progress.playedSeconds);
              if (progress.playedSeconds >= (currentSub?.end || 0)) {
                setPlaying(false);
              }
            }}
            url={videoUrl}
          />
          <progress className="progress w-full" value={progress} max="1" />
          <button
            className="btn btn-primary"
            onClick={() => {
              setPlaying(true);
              playerRef.current?.seekTo(currentSub?.start || 0, "seconds");
            }}
          >
            Replay
          </button>
        </div>
      </div>
    </div>
  );
}
