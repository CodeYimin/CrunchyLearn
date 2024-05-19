import { parse as srtParse } from "@plussub/srt-vtt-parser";
import { parse as assParse } from "ass-compiler";
import { parse as jsonParse } from "big-json";
import cors from "cors";
import express from "express";
import fs from "fs/promises";
import { tokenize } from "kuromojin";

const auxilary = "助動詞";
const verb = "動詞";
const noun = "名詞";
const particle = "助詞";

interface Subtitle {
  anime: string;
  episode: string;
  start: number;
  end: number;
  text: string;
  basicForms: string[];
  conjugationForms: string[];
}

async function run() {
  const str = "私は勉強しています";
  const tokens = await tokenize(str);
  // console.log(tokens);

  // const subs = [] as Subtitle[];
  let subsString = "[";
  const subtitle_base_path = "./src/output/downloaded_subtitles";
  const animes = await fs.readdir(subtitle_base_path);
  await Promise.all(
    animes.map(async (anime, index) => {
      // if (anime === ".kitsuignore") {
      //   return;
      // }

      const episodes = await fs.readdir(`${subtitle_base_path}/${anime}`);
      for (const episode of episodes) {
        if (episode === ".kitsuinfo.json" || !episode.includes(".srt")) {
          continue;
        }

        const subtitlesRaw = await fs.readFile(
          `${subtitle_base_path}/${anime}/${episode}`,
          "utf-8"
        );
        let subtitles;

        try {
          subtitles = srtParse(subtitlesRaw).entries.map((sub) => ({
            anime: anime,
            episode: episode,
            start: sub.from,
            end: sub.to,
            text: sub.text,
          }));
        } catch (e) {
          continue;
        }

        await Promise.all(
          subtitles.map(async (subtitle) => {
            const tokenized = await tokenize(subtitle.text);
            const known = tokenized.filter(
              (token) => token.word_type === "KNOWN"
            );
            const basicForms = known.map((token) => token.basic_form);
            const conjugationForms = known
              .map((token) => token.conjugated_form)
              .filter((form) => form !== "*");
            const subtitleFinal = {
              ...subtitle,
              basicForms,
              conjugationForms,
            };
            // subs.push(subtitleFinal);
            subsString += JSON.stringify(subtitleFinal) + ",";
          })
        );
      }
      console.log(index, anime);
    })
  );

  subsString = subsString.slice(0, -1) + "]";

  console.log("done");
  await fs.writeFile(
    "./src/output/processed_subtitles/subtitles.json",
    subsString
  );
  console.log("done2");
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
test2();

async function server() {
  // await run();
  const processedRaw = await fs.readFile(
    "./src/output/processed_subtitles/subtitles_1.json"
  );
  const processed = (await jsonParse({ body: processedRaw })) as Subtitle[];
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
  app.listen(4445, () => {
    console.log("Server started on http://localhost:4445");
  });
}

// test();
// run();
// server();
