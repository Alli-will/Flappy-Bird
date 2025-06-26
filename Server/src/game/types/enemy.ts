import { IPosition } from "./position"

export interface IEnemy extends IPosition {
  id: number
  lastTime: number
}