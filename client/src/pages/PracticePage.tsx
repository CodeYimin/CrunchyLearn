import { ReactElement, useEffect, useMemo, useRef, useState } from "react";
import Sentence from "../components/Sentence";
import { tokenize } from "kuromojin";
import ReactPlayer from "react-player";
import { useParams } from "react-router";
import { Subtitle } from "../types/Subtitle";

interface PracticePageProps {}

export default function PracticePage({}: PracticePageProps): ReactElement {
  const { vocab } = useParams() as { vocab: string };
  const playerRef = useRef<ReactPlayer>(null);
  const [playing, setPlaying] = useState(false);
  const [time, setTime] = useState(0);
  const [videoUrl, setVideoUrl] = useState("");
  const [currentSub, setCurrentSub] = useState<Subtitle | undefined>(undefined);
  const progress =
    currentSub === undefined
      ? 0
      : (time - currentSub?.start) / (currentSub?.end - currentSub?.start);
  const [input, setInput] = useState("");
  const [submitResult, setSubmitResult] = useState<{
    score: number;
    answer: string;
  }>();

  useEffect(() => {
    setSubmitResult(undefined);
    setInput("");
  }, [currentSub]);

  useEffect(() => {
    nextClip();
  }, []);

  function nextClip() {
    const anime = "";
    const level = 5;
    fetch(
      `http://localhost:4445/recommend?level=${level}&amount=1&anime=${anime}`,
      { credentials: "include" }
    ).then((res) => {
      res.json().then(async (data) => {
        setCurrentSub(data[0]);

        fetch(
          `http://localhost:4444/anime/episode-srcs?id=${data[0].episodeId}&server=vidstreaming&category=sub`
        ).then((r) =>
          r.json().then((d) => {
            setVideoUrl(d.sources[0].url);
          })
        );
      });
    });
  }

  return (
    <div className="h-screen w-screen flex flex-col items-center gap-10 mt-20">
      <div className="flex gap-10">
        <div className="flex flex-col gap-5">
          <div className=" w-[30rem]">
            <div className="text-[1.5rem]">Anime: {currentSub?.anime}</div>
            {/* <div className="text-[1.5rem]">
              Transcript:{" "}
              <Sentence
                text={currentSub?.text || ""}
                highlightBasic={vocab}
                clickToOtherWord={false}
              />
            </div> */}
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
          <div className="flex gap-5">
            <input
              className="input input-bordered input-primary flex-grow"
              placeholder="What did the dialogue talk about?"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              disabled={submitResult !== undefined}
            />
            <button
              disabled={submitResult !== undefined}
              className="btn btn-primary w-32 btn-outline"
              onClick={() => {
                fetch(
                  `http://localhost:4445/generateSimilarity?userResponse=${input}&japaneseSubtitle=${currentSub?.text}`,
                  { credentials: "include" }
                ).then((r) => {
                  r.json().then((d) => {
                    setSubmitResult(d);
                  });
                });
              }}
            >
              Submit
            </button>
          </div>
          {submitResult && (
            <div className="border border-primary rounded-lg p-5 pt-2">
              <p className="text-[2rem] font-bold">
                {submitResult.score > 0.5 ? "Pass" : "Fail"}
              </p>
              <div className="flex">
                <div className="text-lg">
                  <p>Score: {Math.round(submitResult.score * 100)}%</p>
                  <p>Transcript: {currentSub?.text}</p>
                  <p>Correct translation: {submitResult.answer}</p>
                </div>
                <button
                  className="btn btn-primary ml-auto"
                  onClick={() => {
                    nextClip();
                  }}
                >
                  Next clip
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
