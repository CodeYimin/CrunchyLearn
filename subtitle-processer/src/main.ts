import { parse as assParse } from "ass-compiler";
import { parse as jsonParse } from "big-json";
import cors from "cors";
import express from "express";
import fs from "fs/promises";
import { tokenize } from "kuromojin";
import vocabs from "./data/vocab/vocabs";

const auxilary = "助動詞";
const verb = "動詞";
const noun = "名詞";
const adjective = "形容詞";
const particle = "助詞";
const adverb = "副詞";

export function shuffle<T>(array: T[]): T[] {
  let currentIndex = array.length,
    randomIndex;

  // While there remain elements to shuffle.
  while (currentIndex != 0) {
    // Pick a remaining element.
    randomIndex = Math.floor(Math.random() * currentIndex);
    currentIndex--;

    // And swap it with the current element.
    [array[currentIndex], array[randomIndex]] = [
      array[randomIndex],
      array[currentIndex],
    ];
  }

  return array;
}

interface Subtitle {
  anime: string;
  episodeId: string;
  start: number;
  end: number;
  text: string;
  basicForms: string[];
  conjugationForms: string[];
}

async function test() {
  // console.log(await tokenize("私は勉強しています７"));
  const processedRaw = await fs.readFile(
    "./src/output/processed_subtitles/subtitles.json"
  );
  const processed = (await jsonParse({ body: processedRaw })) as Subtitle[];
  while (true) {
    const inputStr = "せんもん";
    processed.forEach((sub) => {
      if (sub.text.includes(inputStr)) {
        console.log(sub);
      }
    });
  }
}

async function test2() {
  const raw = await fs.readFile(
    "./src/output/downloaded_subtitles/Death Note/Death Note Episode 1.ass"
  );
  const p = assParse(raw.toString());
  console.dir(
    p.events.dialogue.map((d) => ({
      start: d.Start,
      end: d.End,
      text: d.Text.raw,
    }))
  );
}
// test2();

async function server() {
  // await run();
  const processedRaw = await fs.readFile(
    "./src/output/processed_subtitles/subtitles.json"
  );
  const processed = (await jsonParse({ body: processedRaw })) as Subtitle[];

  // console.log(vocabs);

  const app = express();
  app.use(cors());
  app.get("/", (req, res) => {
    res.send("Hello World!");
  });
  app.get("/search", (req, res) => {
    const query = req.query.q as string;
    const results = processed.filter((sub) => sub.text.includes(query));
    res.send(results);
  });
  app.get("/recommend", (req, res) => {
    const level = parseInt(req.query.level as string);
    const amount = parseInt(req.query.amount as string);
    const anime = req.query.anime as string;
    const basic = vocabs.filter((a) => a.level === level).map((v) => v.word);
    const results = processed.filter(
      (p) =>
        p.anime.toLowerCase().includes(anime.toLowerCase()) &&
        p.text.length > 10 &&
        p.basicForms.length &&
        p.text.split("").every((c) => c === " " || c.charCodeAt(0) > 128) &&
        p.basicForms.every((b) => basic.includes(b))
    );
    res.send(shuffle(results).slice(0, amount));
  });
  app.listen(4445, () => {
    console.log("Server started on http://localhost:4445");
  });
}

// test();
// run();
server();
