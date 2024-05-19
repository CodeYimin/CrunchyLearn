export interface Subtitle {
  anime: string;
  episodeId: string;
  start: number;
  end: number;
  text: string;
  basicForms: string[];
  conjugationForms: string[];
}

export interface Account {
  id: string;
  username: string;
  practiceRecords: {
    id: string;
    subtitle: string;
    userAnswer: string;
    translation: string;
    score: number;
    date: number;
  }[];
  vocabulary: {
    id: string;
    word: string;
    meaning: string;
    level: number;
    learned: boolean;
  }[];
}
