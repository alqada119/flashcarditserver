export type flashCard = {
  question: question;
  answer: answer;
  deckId: string;
  createdBy: string;
};

export type question = {
  question: string;
  drawing?: SigningPathType;
};

export type answer = {
  answer: string;
  drawing?: SigningPathType;
};

export type SigningPathType = PathType[];

export type PathType = {
  path: string[];
  color: string;
  stroke: number;
};