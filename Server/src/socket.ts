import { Server } from 'socket.io';
import { UserModel } from './models/user';
import { MatchModel } from './models/match';
import jwt from 'jsonwebtoken';
import Game from './game/Game';
import { cacheMatch } from './cache';

let io: Server | null = null;

export function initSocket(server: any) {
  io = new Server(server, {
    cors: {
      origin: 'http://localhost:3001',
      methods: ['GET', 'POST', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
      credentials: true,
    },
  });

  io.on('connection', (socket) => {
    console.log('a user connected: ', socket.id);

    socket.on('disconnect', () => {
      console.log('user disconnected');
    });

    socket.on('message', (data) => {
      console.log('message from client:', data);
    });

    socket.on('player-position', ({ matchId, x, y, pipes }) => {
      const game = cacheMatch.get(matchId);
      if (!game) return;

      // Atualiza posição do jogador
      game.updatePlayerPosition(socket.id, { x, y });
      // Atualiza as posições dos canos recebidas do client
      game.pipes = pipes;

      // Limites verticais (ajuste conforme o client)
      const upperLimit = 45;
      const lowerLimit = 715;
      let morreu = false;
      if (y <= upperLimit || y >= lowerLimit) {
        morreu = true;
      }

      // Validação de colisão com canos (pipes) usando método robusto
      if (!morreu && game.pipes) {
        if (game.checkPlayerPipeCollision(x, y, 34, 24)) {
          morreu = true;
        }
      }

      if (morreu) {
        game.markPlayerDead(socket.id);
        io?.to(matchId).emit('player-collision', { playerId: socket.id });
        if (game.areAllPlayersDead()) {
          io?.to(matchId).emit('game-over', { matchId });
          game.endMatch();
          cacheMatch.delete(matchId);
        }
        return;
      }

      socket.to(matchId).emit('enemy-position', { playerId: socket.id, position: { x, y } });
    });

    socket.on('collision', ({ matchId }) => {
      const game = cacheMatch.get(matchId);
      if (!game) return;

      game.markPlayerDead(socket.id);

      io?.to(matchId).emit('player-collision', { playerId: socket.id });

      if (game.areAllPlayersDead()) {
        io?.to(matchId).emit('game-over', { matchId });
        game.endMatch();
        cacheMatch.delete(matchId);
      }
    });

    socket.on('requestRanking', async () => {
      try {
        const ranking = await getRankingFromDB();
        socket.emit('rankingData', ranking);
        console.log('Enviando ranking:', ranking);
      } catch (error) {
        console.error('Erro ao buscar ranking:', error);
        socket.emit('rankingData', []);
      }
    });

    socket.on('login', async (data) => {
      console.log('[socket][login] Evento recebido:', data);
      const { nickname, password } = data;

      try {
        const user = await UserModel.findOne({ nickname });
        console.log('[socket][login] Usuário encontrado:', user ? user.nickname : 'Nenhum');

        if (!user) {
          return socket.emit('loginError', { message: 'Usuário não encontrado' });
        }

        const isPasswordValid = await user.comparePassword(password);
        console.log('[socket][login] Validação da senha:', isPasswordValid);

        if (!isPasswordValid) {
          return socket.emit('loginError', { message: 'Senha inválida' });
        }

        const token = jwt.sign(
          { sub: user._id, nickname: user.nickname },
          process.env.JWT_SECRET!,
          { expiresIn: '1h' }
        );

        socket.emit('loginSuccess', { token });
        console.log(`[socket][login] Usuário ${nickname} logado com sucesso. Token enviado.`);

      } catch (err) {
        console.error('Erro no login via socket:', err);
        socket.emit('loginError', { message: 'Erro no servidor' });
      }
    });

    socket.on('register', async (data) => {
  console.log('[socket][register] Evento recebido:', data);
  const { nickname, password } = data;

  try {
    const existingUser = await UserModel.findOne({ nickname });

    if (existingUser) {
      return socket.emit('registerError', { message: 'Nickname já está em uso' });
    }

    const newUser = new UserModel({ nickname, password });
    await newUser.save();

    console.log(`[socket][register] Usuário ${nickname} registrado com sucesso.`);

    socket.emit('registerSuccess', { message: 'Usuário registrado com sucesso' });

  } catch (err) {
    console.error('Erro no registro via socket:', err);
    socket.emit('registerError', { message: 'Erro ao registrar usuário' });
  }
});

    socket.on('createMatch', async ({ token, nickname }) => {
      try {
        let user = null;
        // Se não houver token, cria partida anônima
        if (!token) {
          // nickname anônimo ou fornecido
          const anonNickname = nickname || `Anonimo_${Math.floor(Math.random() * 100000)}`;
          user = { _id: null, nickname: anonNickname };
          // Cria partida sem usuário associado
          let match = await MatchModel.create({ user: null });
          const game = new Game(user, match);
          cacheMatch.set(match._id.toString(), game);
          console.log(`Partida anônima criada via socket: ${match._id}`);
          socket.emit('matchCreated', {
            matchId: match._id.toString(),
            nickname: anonNickname,
            userId: null
          });
          return;
        }

        const decoded: any = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET!);
        user = await UserModel.findById(decoded.sub);

        if (!user) {
          return socket.emit('matchCreationError', { message: 'Usuário inválido' });
        }

        let match = await MatchModel.findOne({ user: user._id, endAt: null });

        if (!match) {
          match = new MatchModel({ user });
          await match.save();

          const game = new Game(user, match);
          cacheMatch.set(match._id.toString(), game);

          console.log(`Partida criada via socket: ${match._id}`);
        } else {
          console.log(`Partida já existente via socket: ${match._id}`);
        }

        socket.emit('matchCreated', {
          matchId: match._id.toString(),
          nickname: user.nickname,
          userId: user._id
        });

      } catch (err) {
        console.error('Erro ao criar partida via socket:', err);
        socket.emit('matchCreationError', { message: 'Erro ao criar partida' });
      }
    });

    socket.on('joinMatch', ({ matchId, token }) => {
      try {
        const decoded: any = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET!);
        const userId = decoded.sub;
        const game = cacheMatch.get(matchId);
        if (!game) {
          return socket.emit('error', { message: 'Partida não encontrada' });
        }
        socket.join(matchId);
        game.addPlayer(socket.id, userId);
        console.log(`Jogador ${userId} entrou na partida ${matchId}`);
        socket.emit('joinedMatch', { matchId });
      } catch (err) {
        socket.emit('error', { message: 'Token inválido ou erro ao entrar na partida' });
      }
    });

    socket.on('getHistory', async ({ token }) => {
      try {
        if (!token) {
          return socket.emit('historyError', { message: 'Token ausente' });
        }

        const decoded: any = jwt.verify(token.replace('Bearer ', ''), process.env.JWT_SECRET!);
        const user = await UserModel.findById(decoded.sub);

        if (!user) {
          return socket.emit('historyError', { message: 'Usuário inválido' });
        }

        const history = await MatchModel.find({ user: user._id })
          .sort({ createdAt: -1 })
          .limit(20)
          .populate('user','nickname')
          .select('score createdAt')
          .exec();

        console.log(`Histórico enviado via socket para ${user.nickname}:`, history);

        socket.emit('historyData', history);

      } catch (err) {
        console.error('Erro ao obter histórico via socket:', err);
        socket.emit('historyError', { message: 'Erro ao obter histórico' });
      }
    });

    // *** AQUI: Tratamento do evento match-end para salvar score ***
    socket.on('match-end', async ({ matchId, score }) => {
      console.log(`[match-end] Evento recebido: matchId=${matchId}, score=${score}`)
  try {
    const match = await MatchModel.findById(matchId);
    if (!match) {
      console.warn(`[match-end] Partida não encontrada: ${matchId}`);
      return;
    }

    match.score = score;
    match.endAt = new Date();
    await match.save();

    // Atualizar o score do usuário se for maior que o anterior
    const user = await UserModel.findById(match.user);
    if (user && (user.score === undefined || score > user.score)) {
      user.score = score;
      await user.save();
    }

    console.log(`[match-end] Partida ${matchId} finalizada com score ${score}`);
  } catch (err) {
    console.error('[match-end] Erro ao finalizar partida:', err);
  }
});

    // Evento para limpar o banco de dados (apagar todos os usuários e partidas)
    socket.on('admin-clear-db', async (data) => {
      // Opcional: você pode adicionar uma senha simples aqui para evitar uso indevido
      // if (!data || data.secret !== process.env.ADMIN_SECRET) return socket.emit('adminClearDbError', { message: 'Acesso negado' });
      try {
        const userResult = await UserModel.deleteMany({});
        const matchResult = await MatchModel.deleteMany({});
        // Se quiser apagar outras coleções, adicione aqui
        // const outraResult = await OutraModel.deleteMany({});
        const msg = `Banco limpo com sucesso! Usuários removidos: ${userResult.deletedCount}, Partidas removidas: ${matchResult.deletedCount}`;
        socket.emit('adminClearDbSuccess', { message: msg });
        console.log('[admin-clear-db]', msg);
      } catch (err) {
        console.error('[admin-clear-db] Erro ao limpar banco:', err);
        socket.emit('adminClearDbError', { message: 'Erro ao limpar banco' });
      }
    });

  });
}

export function getIO() {
  if (!io) {
    throw new Error('Socket.io not initialized!');
  }
  return io;
}

export { io };

async function getRankingFromDB() {
  const users = await UserModel.find({ score: { $exists: true } })
    .sort({ score: -1 })
    .limit(20)
    .select('nickname score -_id')
    .exec();
  // Log para depuração
  console.log('Ranking bruto:', users.map(u => ({ nickname: u.nickname, score: u.score, type: typeof u.score })));
  // Filtra para garantir score > 0, seja number ou string
  return users.filter(u => {
    if (typeof u.score === 'number') return u.score > 0;
    if (typeof u.score === 'string') return parseInt(u.score, 10) > 0;
    return false;
  }).slice(0, 10);
}
