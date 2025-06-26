import { Schema, model } from 'mongoose';
import { IUser } from './user';

interface IMatch {
  createdAt: Date;
  user: IUser | Schema.Types.ObjectId;
  endAt: Date;
  score: number;
}

const matchSchema = new Schema<IMatch>({
  createdAt: { type: Date, default: new Date(), required: true, index: true },
  endAt: { type: Date, default: null },
  score: { type: Number, default: null, index: true },
  user: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  }
});

const MatchModel = model<IMatch>('Match', matchSchema);

export { IMatch, MatchModel }