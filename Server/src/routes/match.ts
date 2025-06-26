import { Router, Request, Response } from "express";
import { MatchModel } from "../models/match";
import Game from "../game/Game";
import { cacheMatch } from "../cache";
import { authUser } from "../middleware/auth";
import { io } from "../socket";

const matchRoute = Router();

// Endpoint para criar nova partida
matchRoute.post('/', authUser, async (req: Request, res: Response) => {
    // @ts-ignore
    const user = req.user;

    if (!user) {
        return res.status(401).json({ message: "Usuário não autenticado" });
    }

    // Busca se já existe uma partida em aberto para o usuário
    const match = await MatchModel.findOne({
        user: user,
        endAt: null
    });

    if (match) {
        console.log(`Usuário ${user.nickname} já tem uma partida aberta: ${match.id}`);
        return res.json({
            matchId: match.id
        });
    }

    // Cria nova partida
    const newMatch = new MatchModel({
        user,
    });

    await newMatch.save();

    

    // Cria a instância do jogo e armazena no cache
    const game = new Game(user, newMatch);
    cacheMatch.set(newMatch._id.toString(), game);

    console.log(`Nova partida criada para usuário ${user.nickname}, matchId: ${newMatch.id}`);

    // Emite evento via socket para o usuário ou para todos
    io?.emit('matchCreated', {
        userId: user._id,
        nickname: user.nickname,
        matchId: newMatch._id
    });

    res.json({
        matchId: newMatch.id
    });
});

matchRoute.post('/:matchId/player-move', authUser, async (req: Request<{ matchId: string }>, res: Response) => {
    const { matchId } = req.params;
    const payload = req.body; // { x: number, y: number }
  
    const game = cacheMatch.get(matchId);
    if (!game) {
      return res.status(404).json({ message: "Partida não encontrada" });
    }
  
    game.updatePlayer(payload);
  
    const player = game.getPlayer();  // ✅ Correto

io?.emit('playerMoved', {
  matchId,
  player: {
    nickname: player.nickname,
    x: player.x,
    y: player.y,
    score: player.score
  }
});
  
    res.json({ message: "Posição atualizada" });
  });
  

// Endpoint para finalizar partida e registrar score
matchRoute.post('/:matchId/end', authUser, async (req: Request<{ matchId: string }>, res: Response) => {
    try {
        const { matchId } = req.params;
        const { score } = req.body;

        if (score === undefined || isNaN(Number(score))) {
            return res.status(400).json({ message: 'Score is required and must be a number' });
        }

        const match = await MatchModel.findByIdAndUpdate(
            matchId,
            {
                endAt: new Date(),
                score: Number(score)
            },
            { new: true }
        );

        if (!match) {
            return res.status(404).json({ message: 'Match not found' });
        }

        // Remove do cache
        if (cacheMatch.has(matchId)) {
            cacheMatch.delete(matchId);
        }

        console.log(`Partida finalizada: matchId=${matchId}, score=${score}`);

        // Emite evento via socket informando que a partida foi finalizada
        io?.emit('matchEnded', {
            matchId: matchId,
            score: score
        });

        res.json(match);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Internal server error' });
    }
});

// Ranking geral - lista os usuários com melhor score (top 10) com nickname
matchRoute.get('/ranking', async (req: Request, res: Response) => {
    try {
        const ranking = await MatchModel.aggregate([
            { $match: { score: { $ne: null } } },
            {
                $group: {
                    _id: "$user",
                    maxScore: { $max: "$score" },
                    totalScore: { $sum: "$score" },
                    gamesPlayed: { $sum: 1 }
                }
            },
            { $sort: { maxScore: -1 } },
            { $limit: 10 },
            {
                $lookup: {
                    from: "users",
                    localField: "_id",
                    foreignField: "_id",
                    as: "userData"
                }
            },
            { $unwind: "$userData" },
            {
                $project: {
                    _id: 1,
                    maxScore: 1,
                    totalScore: 1,
                    gamesPlayed: 1,
                    nickname: "$userData.nickname"
                }
            }
        ]);

        res.json(ranking);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro ao obter ranking" });
    }
});

// Histórico do usuário autenticado - lista partidas finalizadas com nickname
matchRoute.get('/history', authUser, async (req: Request, res: Response) => {
    try {
        // @ts-ignore
        const user = req.user;

        if (!user) {
            return res.status(401).json({ message: "Usuário não autenticado" });
        }

        const history = await MatchModel.find({ user: user._id, endAt: { $ne: null } })
            .sort({ endAt: -1 })
            .limit(50)
            .populate('user', 'nickname');

        const formatted = history.map(match => {
            const user = match.user as { nickname: string };

            return {
                _id: match._id,
                score: match.score,
                createdAt: match.createdAt,
                endAt: match.endAt,
                nickname: user.nickname
            };
        });

        res.json(formatted);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: "Erro ao obter histórico" });
    }
});

export { matchRoute };
