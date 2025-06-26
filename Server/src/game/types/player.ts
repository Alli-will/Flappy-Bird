import { IPosition } from "./position";

export default interface IPlayer extends IPosition {
  nickname: string;
  score: number;
}

