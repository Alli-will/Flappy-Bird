import { IMatch } from "../models/match"
import { IUser } from "../models/user"
import { IEnemy } from "./types/enemy"
import IPlayer from "./types/player"
import { IPosition } from "./types/position"

class Game {
  public user: Partial<IUser>;
  public match: IMatch
  public isPaused = true
  private players: Map<string, IPlayer> = new Map();
  private player: IPlayer
  private isPlayerDead = false

  public mapEnemies: Map<number, IEnemy>
  private enemySpawnDelay = 10000
  private enemyNextSpawn = 0

  private readonly COLLISION_RADIUS = 50
  private readonly PLAYER_RADIUS = 25
  private readonly ENEMY_RADIUS = 25
  private readonly SPEED = 60 // pixels por segundo

  private additionalPlayers: Map<string, IPlayer>

  public pipes: Array<{ x: number; y: number; width: number; height: number; id: string } > = [];

  constructor(user: Partial<IUser>, match: IMatch) {
    this.user = user;
    this.match = match;
    this.mapEnemies = new Map();
    this.player = {
      nickname: user.nickname || 'Anônimo',
      x: 0,
      y: 0,
      score: 0
    };
    this.additionalPlayers = new Map();
  }

  public getPlayer() {
    return this.player
  }

  public resume() {
    const now = Date.now()
    this.player.score = now
    this.isPaused = false
    for (const [, enemy] of this.mapEnemies) {
      enemy.lastTime = now
    }
  }

  public validateCollision(enemyId: number): boolean {
    const enemy = this.mapEnemies.get(enemyId)
    if (!enemy) return false

    const dx = this.player.x - enemy.x
    const dy = this.player.y - enemy.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    return distance <= (this.PLAYER_RADIUS + this.ENEMY_RADIUS)
  }

  private notifyNewEnemy(enemy: IEnemy) {
    console.log(`Novo inimigo spawnado: ${enemy.id} em (${enemy.x}, ${enemy.y})`)
  }

  private getRandomOffset(range: number) {
    return Math.floor(Math.random() * (2 * range + 1)) - range
  }

  private spawnEnemy(time: number) {
    if (time < this.enemyNextSpawn) return

    const enemy: IEnemy = {
      x: this.player.x + 500 + this.getRandomOffset(100),
      y: this.player.y + this.getRandomOffset(100),
      id: time,
      lastTime: time
    }

    this.mapEnemies.set(time, enemy)
    this.enemyNextSpawn = time + this.enemySpawnDelay

    this.notifyNewEnemy(enemy)
  }

  public update(time: number) {
    this.spawnEnemy(time)
  }

  public updatePlayer(payload: IPosition) {
    const now = Date.now()
    const delta = now - this.player.score

    const dx = payload.x - this.player.x
    const dy = payload.y - this.player.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    const speedMillis = this.SPEED / 1000
    const deltaMillis = speedMillis * delta

    if (distance <= deltaMillis) {
      this.player.x = payload.x
      this.player.y = payload.y
      this.player.score = now
    } else {
      console.warn("Movimento do jogador inválido, rollback realizado.")
      this.player.score = now
    }
  }

  public updateEnemy(payload: IPosition) {
    const enemy = this.mapEnemies.get(payload.id!)
    if (!enemy) return

    const now = Date.now()
    const delta = now - enemy.lastTime

    const dx = payload.x - enemy.x
    const dy = payload.y - enemy.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    const speedMillis = this.SPEED / 1000
    const deltaMillis = speedMillis * delta

    if (distance <= deltaMillis) {
      enemy.x = payload.x
      enemy.y = payload.y
      enemy.lastTime = now
    } else {
      console.warn(`Movimento inválido do inimigo ${payload.id}, rollback realizado.`)
      enemy.lastTime = now
    }
  }

  // ✅ Método esperado: updatePlayerPosition
  public updatePlayerPosition(playerId: string, payload: IPosition) {
    const player = this.additionalPlayers.get(playerId)
    if (!player) {
      console.warn(`Jogador ${playerId} não encontrado.`)
      return
    }

    const now = Date.now()
    const delta = now - player.score

    const dx = payload.x - player.x
    const dy = payload.y - player.y
    const distance = Math.sqrt(dx * dx + dy * dy)

    const speedMillis = this.SPEED / 1000
    const deltaMillis = speedMillis * delta

    if (distance <= deltaMillis) {
      player.x = payload.x
      player.y = payload.y
      player.score = now
    } else {
      console.warn(`Movimento inválido do jogador ${playerId}, rollback.`)
      player.score = now
    }
  }

  // Atualiza a posição do jogador e valida colisão robusta com pipes
  public updatePlayerPositionSwept(playerId: string, payload: IPosition, tolerance: number = 0): boolean {
    const player = this.additionalPlayers.get(playerId);
    if (!player) {
      console.warn(`Jogador ${playerId} não encontrado.`);
      return false;
    }
    // Armazena posição anterior
    if (!('prevX' in player) || !('prevY' in player)) {
      (player as any).prevX = player.x;
      (player as any).prevY = player.y;
    }
    const prevX = (player as any).prevX;
    const prevY = (player as any).prevY;
    // Atualiza posição
    (player as any).prevX = player.x;
    (player as any).prevY = player.y;
    player.x = payload.x;
    player.y = payload.y;
    player.score = Date.now();
    // Validação robusta de colisão
    if (this.checkPlayerPipeCollisionSwept(prevX, prevY, player.x, player.y, 34, 24, tolerance)) {
      this.markPlayerDead(playerId);
      return true;
    }
    return false;
  }

  // Atualiza a posição do jogador (principal ou adicional) e valida colisão robusta com pipes
  public updateAnyPlayerPositionSwept(playerId: string, payload: IPosition, tolerance: number = 0): boolean {
    // Verifica se é o jogador principal
    let player: any = null;
    if (playerId === this.user.nickname || playerId === this.player.nickname) {
      player = this.player;
    } else {
      player = this.additionalPlayers.get(playerId);
    }
    if (!player) {
      console.warn(`Jogador ${playerId} não encontrado.`);
      return false;
    }
    // Armazena posição anterior
    if (!('prevX' in player) || !('prevY' in player)) {
      player.prevX = player.x;
      player.prevY = player.y;
    }
    const prevX = player.x;
    const prevY = player.y;
    // Validação robusta de colisão ANTES de atualizar
    if (this.checkPlayerPipeCollisionSwept(prevX, prevY, payload.x, payload.y, 34, 24, tolerance)) {
      this.markPlayerDead(playerId);
      return true;
    }
    // Só atualiza se não colidiu
    player.prevX = player.x;
    player.prevY = player.y;
    player.x = payload.x;
    player.y = payload.y;
    player.score = Date.now();
    return false;
  }

  // ✅ Método esperado: markPlayerDead
  public markPlayerDead(playerId: string) {
    if (playerId === this.user.nickname) {
      this.isPlayerDead = true
    } else {
      const player = this.additionalPlayers.get(playerId)
      if (player) {
        this.additionalPlayers.delete(playerId)
        console.log(`Jogador ${playerId} removido por estar morto.`)
      }
    }
  }

  // ✅ Método esperado: areAllPlayersDead
  public areAllPlayersDead(): boolean {
    return this.isPlayerDead && this.additionalPlayers.size === 0
  }

  // ✅ Método esperado: endMatch
  public endMatch() {
    this.isPaused = true
    console.log("Partida encerrada.")
    // Aqui você pode adicionar outras rotinas de encerramento.
  }

  // ✅ Método esperado: addPlayer
  public addPlayer(socketId: string, nickname: string) {
    const player: IPlayer = {
      nickname,
      score: 0,
      x: 0,
      y: 0
    };
    
    this.players.set(socketId, player);
    console.log(`[Game] Jogador adicionado: ${nickname} (socket: ${socketId})`);
  }

  // Verifica colisão do pássaro com todos os pipes
  public checkPlayerPipeCollision(playerX: number, playerY: number, playerW: number = 34, playerH: number = 24): boolean {
    for (const pipe of this.pipes) {
      if (this.rectsOverlap(playerX, playerY, playerW, playerH, pipe.x, pipe.y, pipe.width, pipe.height)) {
        return true;
      }
    }
    return false;
  }

  // Verifica colisão do pássaro com todos os pipes, considerando swept collision
  public checkPlayerPipeCollisionSwept(prevX: number, prevY: number, currX: number, currY: number, playerW: number = 34, playerH: number = 24, tolerance: number = 0): boolean {
    for (const pipe of this.pipes) {
      // Colisão no frame atual
      if (this.rectsOverlap(currX, currY, playerW, playerH, pipe.x, pipe.y, pipe.width, pipe.height, tolerance)) {
        return true;
      }
      // Colisão no frame anterior
      if (this.rectsOverlap(prevX, prevY, playerW, playerH, pipe.x, pipe.y, pipe.width, pipe.height, tolerance)) {
        return true;
      }
      // Swept collision: verifica se cruzou o topo do cano de baixo
      // (apenas para canos de baixo)
      if (pipe.y > 300) { // Supondo que canos de baixo têm y > 300
        const prevBottom = prevY + playerH;
        const currBottom = currY + playerH;
        // Se o bico do pássaro cruzou o topo do cano de baixo
        if (prevBottom <= pipe.y && currBottom > pipe.y && currX + playerW > pipe.x && currX < pipe.x + pipe.width) {
          return true;
        }
      }
    }
    return false;
  }

  // Ajusta utilitário para aceitar tolerância
  private rectsOverlap(ax: number, ay: number, aw: number, ah: number, bx: number, by: number, bw: number, bh: number, tolerance: number = 0): boolean {
    return ax < bx + bw + tolerance && ax + aw > bx - tolerance && ay < by + bh + tolerance && ay + ah > by - tolerance;
  }
}

export default Game
