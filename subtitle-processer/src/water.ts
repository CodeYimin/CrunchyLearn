import fs from "fs/promises";
import { parse as assParse } from "ass-compiler";
import { tokenize } from "kuromojin";

interface Subtitle {
  anime: string;
  episodeId: string;
  start: number;
  end: number;
  text: string;
  basicForms: string[];
  conjugationForms: string[];
}

const animeHiMap = {
  "Death Note": { id: "death-note-60", startEp: 1464, delay: 0 },
  "Sword Art Online": {
    id: "sword-art-online-2274",
    startEp: 26565,
    delay: 12,
  },
  "World Trigger": { id: "world-trigger-1356", startEp: 19502, delay: 0 },
} as Record<string, { id: string; startEp: number; delay: number }>;

const auxilary = "助動詞";
const verb = "動詞";
const noun = "名詞";
const adjective = "形容詞";
const particle = "助詞";
const adverb = "副詞";

async function run() {
  const linker = JSON.parse(
    await fs.readFile("./src/data/linker.json", "utf-8")
  );

  let subsString = "[";
  const subtitle_base_path = "./src/output/downloaded_subtitles";
  const animes = await fs.readdir(subtitle_base_path);
  await Promise.all(
    animes.map(async (anime, index) => {
      const episodes = await fs.readdir(`${subtitle_base_path}/${anime}`);
      for (const episode of episodes) {
        const subtitlesRaw = await fs.readFile(
          `${subtitle_base_path}/${anime}/${episode}`,
          "utf-8"
        );
        let subtitles;
        const theOne = linker.find((a: any) => a.animelonId === anime);

        try {
          subtitles = assParse(subtitlesRaw).events.dialogue.map((d) => {
            const epNum = parseInt(episode.match(/(\d+)\.ass/)![1]) - 1;

            return {
              anime: anime,
              episodeId: theOne.hanimeEpisodeIds[epNum],
              start: d.Start + theOne.delay,
              end: d.End + theOne.delay,
              text: d.Text.raw,
            };
          });
        } catch (e) {
          continue;
        }

        await Promise.all(
          subtitles.map(async (subtitle) => {
            const tokenized = await tokenize(subtitle.text);
            const known = tokenized.filter(
              (token) => token.word_type === "KNOWN"
            );
            const basicForms = known
              .filter((a) => [verb, noun, adjective, adverb].includes(a.pos))
              .map((token) => token.basic_form);
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

run();
