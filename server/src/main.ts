import { parse as jsonParse } from "big-json";
import cors from "cors";
import express from "express";
import fs from "fs/promises";
import vocabs from "./data/vocabs";
import { shuffle } from "./utils";
import { PrismaClient } from "@prisma/client";
import bodyParser from "body-parser";
import session, { MemoryStore } from "express-session";
import { tokenize } from "kuromojin";
import "dotenv/config";
import { HfInference } from "@huggingface/inference";

interface Subtitle {
  anime: string;
  episodeId: string;
  start: number;
  end: number;
  text: string;
  basicForms: string[];
  conjugationForms: string[];
}

const prisma = new PrismaClient();

async function translateToEnglish(japanese: string) {
  const vocabTranslation = vocabs.find((v) => v.word === japanese)?.meaning;
  if (vocabTranslation) {
    console.log("Vocab translation found");
    return vocabTranslation;
  }

  const translation = await fetch(
    `https://translation.googleapis.com/language/translate/v2?q=${japanese}&target=en&format=text&source=ja&key=${process.env.GCLOUD_KEY}`,
    { method: "POST" }
  );
  const data = await translation.json();
  return data.data.translations[0].translatedText;
}

async function server() {
  // await run();
  const subtitlesRaw = await fs.readFile("./src/data/subtitles.json");
  const subtitles = (await jsonParse({ body: subtitlesRaw })) as Subtitle[];

  // console.log(vocabs);

  const app = express();
  app.use(
    cors({
      origin: "http://localhost:3000",
      credentials: true,
    }),
    session({
      resave: true,
      store: new MemoryStore(),
      secret: "keyboard cat",
      saveUninitialized: true,
      cookie: { httpOnly: false, secure: false },
    }),
    bodyParser.json()
  );

  app.post("/register", async (req, res) => {
    const { username, password } = req.body;
    if (
      await prisma.user.findFirst({ where: { username: username as string } })
    ) {
      res.send(400);
      return;
    }
    const user = await prisma.user.create({
      data: {
        username: username as string,
        password: password as string,
        vocabulary: {
          create: vocabs
            .filter((v) => v.level === 5)
            .map((v) => ({
              word: v.word,
              meaning: v.meaning,
              level: v.level,
              learned: true,
            })),
        },
      },
    });
    (req.session as any).userId = user.id;
    res.send(200);
  });

  app.get("/me", async (req, res) => {
    if (!(req.session as any).userId) {
      res.send(400);
      return;
    }

    const user = await prisma.user.findFirst({
      where: { id: (req.session as any).userId },
      select: {
        id: true,
        username: true,
        practiceRecords: true,
        vocabulary: true,
      },
    });
    res.send(user);
  });

  app.post("/login", async (req, res) => {
    const { username, password } = req.body;
    const user = await prisma.user.findFirst({
      where: { username: username as string, password: password as string },
    });
    if (user) {
      (req.session as any).userId = user.id;
      res.send(200);
    } else {
      res.send(400);
    }
  });

  app.get("/logout", (req, res) => {
    req.session.destroy(() => {
      res.send(200);
    });
  });

  app.get("/", (req, res) => {
    res.send((req.session as any).userId);
  });

  app.get("/vocabulary", async (req, res) => {
    const level = parseInt(req.query.level as string);

    res.send(shuffle(vocabs).filter((v) => v.level === level));
  });

  app.get("/search", (req, res) => {
    const query = req.query.q as string;
    const results = subtitles.filter(
      (sub) =>
        sub.text.split("").every((c) => c === " " || c.charCodeAt(0) > 128) &&
        sub.basicForms.includes(query)
    );
    res.send(results.slice(0, 500));
  });

  app.get("/tokenize", async (req, res) => {
    const text = req.query.text as string;
    const tokens = await tokenize(text);
    res.send(tokens);
  });

  app.get("/recommend", async (req, res) => {
    const user = await prisma.user.findFirst({
      where: { id: (req.session as any).userId },
      include: { vocabulary: true },
    });

    if (!user) {
      res.send(400);
      return;
    }

    if (user.vocabulary.filter((v) => !v.learned).length < 50) {
      for (const v of shuffle(vocabs)
        .filter((v) => !user.vocabulary.some((b) => b.word === v.word))
        .sort((a, b) => b.level - a.level)
        .slice(0, 10)) {
        await prisma.vocabulary.create({
          data: {
            word: v.word,
            meaning: v.meaning,
            level: v.level,
            learned: false,
            user: { connect: { id: user.id } },
          },
        });
      }
      // }
    }

    const amount = parseInt(req.query.amount as string);
    const anime = req.query.anime as string;
    const basic = vocabs
      .filter((a) => user.vocabulary.some((b) => a.word === b.word))
      .map((v) => v.word);
    const results = subtitles.filter(
      (p) =>
        p.anime.toLowerCase().includes(anime.toLowerCase()) &&
        p.text.length > 10 &&
        p.basicForms.length &&
        p.text.split("").every((c) => c === " " || c.charCodeAt(0) > 128) &&
        p.basicForms.every((b) => basic.includes(b)) &&
        p.basicForms.some((a) =>
          user.vocabulary.some((b) => a === b.word && !b.learned)
        )
    );
    res.send(shuffle(results).slice(0, amount));
  });

  app.get("/getEnglish", async (req, res) => {
    const text = req.query.text as string;
    const translation = await translateToEnglish(text);
    res.send(translation);
  });

  app.get("/vocabs", async (req, res) => {
    const user = await prisma.user.findFirst({
      where: { id: (req.session as any).userId },
    });
    if (!user) {
      res.send(400);
      return;
    }

    const vocabs = await prisma.vocabulary.findMany({
      where: { userId: user.id },
    });
    res.send(vocabs);
  });

  app.get("/addVocab", async (req, res) => {
    const user = await prisma.user.findFirst({
      where: { id: (req.session as any).userId },
    });
    if (!user) {
      res.send(400);
      return;
    }

    const vocab = req.query.vocab as string;
    const meaning = req.query.meaning as string;
    const level = parseInt(req.query.level as string);
    const learned = req.query.learned === "true";
    const word = await prisma.vocabulary.create({
      data: {
        word: vocab,
        meaning: meaning || vocabs.find((v) => v.word === vocab)?.meaning || "",
        level: level || vocabs.find((v) => v.word === vocab)?.level || 0,
        learned: learned,
        user: { connect: { id: user.id } },
      },
    });
    res.send(word);
  });

  app.get("/removeVocab", async (req, res) => {
    const user = await prisma.user.findFirst({
      where: { id: (req.session as any).userId },
    });
    if (!user) {
      res.send(400);
      return;
    }

    const id = req.query.id as string;
    const word = await prisma.vocabulary.delete({
      where: {
        id: id,
        userId: user.id,
      },
    });
    res.send(word);
  });

  app.get("/generateSimilarity", async (req, res) => {
    const HUGGING_FACE_KEY = process.env.HUGGING_FACE_KEY;

    const inference = new HfInference(HUGGING_FACE_KEY);

    const model = "sentence-transformers/all-MiniLM-L6-v2";

    const userResponse = req.query.userResponse as string;
    const japaneseSubtitle = req.query.japaneseSubtitle as string;
    const translation = await translateToEnglish(japaneseSubtitle);
    // const translation = "hi";

    // const result = await inference.imageToText()
    const result = await inference.sentenceSimilarity({
      inputs: { source_sentence: userResponse, sentences: [translation] },
      model: model,
    });

    const user = await prisma.user.findFirst({
      where: { id: (req.session as any).userId },
      include: { practiceRecords: true, vocabulary: true },
    });
    if (!user) {
      return;
    }
    await prisma.practiceRecord.create({
      data: {
        user: { connect: { id: user.id } },
        score: result[0],
        subtitle: japaneseSubtitle,
        translation: translation,
        userAnswer: userResponse,
        date: new Date(),
      },
    });

    if (result[0] > 0.5) {
      for (const learning of user.vocabulary) {
        let matchCount = 0;
        for (const record of user.practiceRecords) {
          const tokens = await tokenize(record.subtitle);
          const basics = tokens.map((t) => t.basic_form);
          if (basics.includes(learning.word)) {
            matchCount++;
          }
        }
        if (matchCount > 3) {
          await prisma.vocabulary.update({
            where: { id: learning.id },
            data: { learned: true },
          });
        }
      }
    }

    res.send({ score: result, answer: translation });
  });

  app.listen(4445, () => {
    console.log("Server started on http://localhost:4445");
  });
}

// test();
// run();
server();
