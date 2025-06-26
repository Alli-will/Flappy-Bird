import { Schema, model, Document } from 'mongoose';
import bcrypt from 'bcrypt';

// Extende o Document do Mongoose para adicionar métodos de instância
interface IUser extends Document {
  nickname: string;
  password: string;
  score?: number;
  comparePassword(candidatePassword: string): Promise<boolean>;
}

const userSchema = new Schema<IUser>({
  nickname: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  score: { type: Number, default: 0 },
});

// Método de instância para comparar senha
userSchema.methods.comparePassword = async function (
  candidatePassword: string
): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Opcional: middleware para hash automático da senha antes de salvar
userSchema.pre<IUser>('save', async function (next) {
  if (!this.isModified('password')) return next();

  const salt = await bcrypt.genSalt(10);
  this.password = await bcrypt.hash(this.password, salt);
  next();
});

const UserModel = model<IUser>('User', userSchema);

export { IUser, UserModel };
