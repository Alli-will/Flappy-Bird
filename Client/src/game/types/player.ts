export interface Player {
  _id: string;
  createdAt: string;
  score: number | null;
   maxScore: number;
  user: {
    _id: string;
    nickname: string;
  };
}