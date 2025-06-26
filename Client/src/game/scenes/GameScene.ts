import Phaser from "phaser";
import Player from "../objects/Player";
import Pipe from "../objects/Pipe";
import { initSocket } from "../../App";
import { Socket } from "socket.io-client";

class MainScene extends Phaser.Scene {
  private player!: Player;
  private pipes!: Phaser.Physics.Arcade.Group;
  private score: number = 0;
  private scoreText!: Phaser.GameObjects.Text;
  private pipePairs: number = 2;
  private nickname!: string;
  private upperLimit: number = 45;
  private lowerLimit: number = 715; // Agora o pássaro morre ao chegar em y=715
  private gapSize: number = 230; // Gap padrão
  private pipeHeight: number = 320;
  private socket!: Socket;
  private matchId!: string;
  private isGameOver: boolean = false;

  private pipePairsData: { topPipe: Pipe; bottomPipe: Pipe; scoreZone: Phaser.GameObjects.Zone }[] = [];

  private background!: Phaser.GameObjects.TileSprite | undefined;

  private lastGapY: number | null = null; // Salva o último gapY usado
  private minGapY = 400;
  private maxGapY = 650;
  private minDist = 120; // Distância mínima entre gaps consecutivos
  private maxTopPipeY: number = 80; // Topo do cano de cima pode subir mais
  private pipeVelocityX: number = -150;

  constructor() {
    super({ key: "GameScene" });
  }

  init(data: { nickname: string; matchId: string }) {
    this.nickname = data.nickname;
    this.matchId = data.matchId;
    console.log("[init] Usuário logado:", this.nickname, "Match ID:", this.matchId);

    this.socket = initSocket(this.nickname);
    console.log("[init] Socket inicializado");
  }

  preload() {
    this.load.image("topPipe", "assets/pipes/pipe_top.png");
    this.load.image("bottomPipe", "assets/pipes/pipe_bottom.png");

    this.load.spritesheet("player_1", "assets/player.png", {
      frameWidth: 34,
      frameHeight: 24,
    });
    console.log("[preload] Assets carregados");
  }

  create() {
    this.background = this.add.tileSprite(0, 0 , this.cameras.main.width,this.cameras.main.height, 'fundo').setOrigin(0, 0)
    .setDisplaySize(this.scale.width, this.scale.height);;
    console.log("[create] Criando cena...");
    this.physics.world.setBounds(0, 0, 800, 750); // aumenta o limite inferior do mundo para 750
    this.score = 0;
    this.isGameOver = false;
    

   
    this.player = new Player(this, 100, 300, "player_1");
    this.player.isDead = false;
    this.player.waitingForSpaceRelease = false;
    console.log("[create] Player criado");

    this.pipes = this.physics.add.group({
      classType: Pipe,
      runChildUpdate: true,
    });

    for (let i = 0; i < this.pipePairs; i++) {
      const xPos = 800 + i * 400; // volta ao espaçamento original
      this.createPipePair(xPos);
    }

    this.physics.add.collider(
      this.player,
      this.pipes,
      (player, pipe) => this.handleCollision(pipe as Phaser.GameObjects.GameObject),
      undefined,
      this
    );

    this.scoreText = this.add.text(16, 16, "Pontuação: 0", {
      fontSize: "32px",
      color: "#000000",
    });

    this.socket.on("enemies-position", (enemies: any[]) => {
      // console.log("[socket] enemies-position recebido:", enemies);
      this.pipes.getChildren().forEach((pipe) => {
        const pipeSprite = pipe as Phaser.Physics.Arcade.Sprite;
        const enemy = enemies.find((e) => e.id === pipeSprite.getData("id"));
        if (enemy) {
          pipeSprite.setPosition(enemy.x, enemy.y);
          pipeSprite.body?.updateFromGameObject();
        }
      });
    });

    this.socket.on("game-over", (data: { score?: number }) => {
      console.log("[socket] game-over recebido", data);
      this.handleGameOver(data?.score);
    });

    this.events.once("shutdown", () => {
      console.log("[scene] shutdown: removendo listeners e desconectando socket");
      this.socket.off("enemies-position");
      this.socket.off("game-over");
      this.socket.disconnect();
    });
  }

  private createPipePair(xPosition: number) {
    // Centraliza os limites e lógica de gap
    let gapY = this.getRandomGapY();
    let topPipeY = gapY - this.pipeHeight; // Corrige: topo do cano de cima
    let bottomPipeY = gapY + this.gapSize; // Corrige: topo do cano de baixo

    const topPipe = this.pipes.get(xPosition, topPipeY, "topPipe") as Pipe;
    if (topPipe) {
      topPipe.setActive(true);
      topPipe.setVisible(true);
      topPipe.setData("id", `top_${xPosition}_${Date.now()}`);
      const topPipeBody = topPipe.body as Phaser.Physics.Arcade.Body;
      topPipeBody.setVelocityX(this.pipeVelocityX);
      topPipeBody.allowGravity = false;
      topPipeBody.immovable = true;
    }

    const bottomPipe = this.pipes.get(xPosition, bottomPipeY, "bottomPipe") as Pipe;
    if (bottomPipe) {
      bottomPipe.setActive(true);
      bottomPipe.setVisible(true);
      bottomPipe.setData("id", `bottom_${xPosition}_${Date.now()}`);
      const bottomPipeBody = bottomPipe.body as Phaser.Physics.Arcade.Body;
      bottomPipeBody.setVelocityX(this.pipeVelocityX);
      bottomPipeBody.allowGravity = false;
      bottomPipeBody.immovable = true;
    }

    // Cria a zona de pontuação entre os canos
    const scoreZone = this.add.zone(xPosition, gapY + this.gapSize / 2, 1, this.gapSize);
    this.physics.world.enable(scoreZone);
    const scoreZoneBody = scoreZone.body as Phaser.Physics.Arcade.Body;
    scoreZoneBody.setVelocityX(this.pipeVelocityX);
    scoreZoneBody.allowGravity = false;
    scoreZoneBody.immovable = true;

    this.physics.add.overlap(
      this.player,
      scoreZone,
      () => this.incrementScore(scoreZone),
      undefined,
      this
    );

    // Log das posições dos canos a cada criação
    console.log(`[PIPES] topPipe: x=${topPipe?.x}, y=${topPipe?.y} | bottomPipe: x=${bottomPipe?.x}, y=${bottomPipe?.y}`);

    this.pipePairsData.push({ topPipe, bottomPipe, scoreZone });
  }

  private getRandomGapY(): number {
    // Garante variedade e limites corretos
    let minGapY = this.maxTopPipeY + this.pipeHeight;
    let maxGapY = this.lowerLimit - this.gapSize;
    let gapY: number;
    let tentativas = 0;
    do {
      gapY = Phaser.Math.Between(minGapY, maxGapY);
      tentativas++;
    } while (
      (this.lastGapY !== null && Math.abs(gapY - this.lastGapY) < this.minDist) && tentativas < 20
    );
    this.lastGapY = gapY;
    return gapY;
  }

  private async handleGameOver(finalScore?: number) {
    if (this.isGameOver) return;
    this.isGameOver = true;

    console.log("[handleGameOver] Game Over. Pontuação final:", finalScore ?? this.score);
    this.physics.pause();

    const scoreToUser = finalScore ?? this.score;

    try {
      this.socket.emit("match-end", {
        matchId: this.matchId,
        score: scoreToUser,
      });
      console.log("[handleGameOver] Evento match-end emitido:", { matchId: this.matchId, score: scoreToUser });
    } catch (error) {
      console.error("Erro ao enviar fim da partida:", error);
      this.add.text(400, 300, "Erro ao salvar pontuação", {
        fontSize: "24px",
        color: "#ff0000",
      }).setOrigin(0.5);
    }

    if (this.time) {
      this.time.removeAllEvents();
    }

    if (this.pipes) {
      this.pipes.getChildren().forEach((pipe) => pipe.destroy());
    }
    this.pipePairsData.forEach(({ scoreZone }) => scoreZone.destroy());
    this.pipePairsData = [];

    this.scene.start("GameOverScene", {
      nickname: this.nickname,
      matchId: this.matchId,
      score: scoreToUser,
    });
  }

  private handleCollision(pipe?: Phaser.GameObjects.GameObject) {
    const enemyId = pipe?.getData("id") ?? "UNKNOWN";
    console.log("[handleCollision] Colisão detectada com cano id:", enemyId);

    // Pausa a física imediatamente para evitar empurrar os canos
    this.physics.pause();

    if (this.socket) {
      this.socket.emit("collision", {
        matchId: this.matchId,
        enemyId,
        score: this.score,
      });
      console.log("[handleCollision] Evento collision emitido:", { matchId: this.matchId, enemyId, score: this.score });
    }

    this.player.gameOver();
    this.handleGameOver();
  }

  private incrementScore(scoreZone: Phaser.GameObjects.Zone) {
    this.score++;
    this.scoreText.setText("Pontuação: " + this.score);
    console.log("[incrementScore] Pontuação incrementada para:", this.score);
    console.log(`[incrementScore] Velocidade atual dos canos: ${this.pipeVelocityX}`);
    scoreZone.destroy();
    // Aumenta a velocidade dos canos a cada 5 pontos
    if (this.score % 5 === 0) {
      this.pipeVelocityX -= 20; // aumenta a velocidade (mais negativo = mais rápido)
      // Atualiza a velocidade dos canos e zonas já existentes
      this.pipePairsData.forEach(({ topPipe, bottomPipe, scoreZone }) => {
        if (topPipe && topPipe.body && !topPipe.active) {
          return;
        }
        (topPipe.body as Phaser.Physics.Arcade.Body).setVelocityX(this.pipeVelocityX);
        if (bottomPipe && bottomPipe.body && !bottomPipe.active) {
          return;
        }
        (bottomPipe.body as Phaser.Physics.Arcade.Body).setVelocityX(this.pipeVelocityX);
        if (scoreZone && scoreZone.body && (scoreZone as any).active !== false) {
          (scoreZone.body as Phaser.Physics.Arcade.Body).setVelocityX(this.pipeVelocityX);
        }
      });
      console.log(`[incrementScore] Velocidade dos canos aumentada para: ${this.pipeVelocityX}`);
    }
  }

  update() {
    if (this.isGameOver) return;

    if (this.background) {
      this.background.tilePositionX += 1;
    }
    if (this.player.y <= this.upperLimit || this.player.y >= this.lowerLimit) {
      console.log("[update] Jogador saiu dos limites verticais:", this.player.y);
      this.handleCollision();
    }

    // Log da posição do pássaro a cada frame
   // console.log(`[update] Posição do pássaro: x=${this.player.x}, y=${this.player.y}`);

    this.pipePairsData.forEach(({ topPipe, bottomPipe, scoreZone }, index) => {
      if (topPipe.x < -50) {
        // Usa a mesma lógica de variedade e limites ao reciclar
        let gapY = this.getRandomGapY();
        let topPipeY = gapY - this.pipeHeight;
        let bottomPipeY = gapY + this.gapSize;
        topPipe.setPosition(800, topPipeY);
        topPipe.setData("id", `top_${Date.now()}`);
        bottomPipe.setPosition(800, bottomPipeY);
        bottomPipe.setData("id", `bottom_${Date.now()}`);
        // Log das posições dos canos ao serem reposicionados
        console.log(`[PIPES-RECYCLE] topPipe: x=${topPipe.x}, y=${topPipe.y} | bottomPipe: x=${bottomPipe.x}, y=${bottomPipe.y}`);
        (topPipe.body as Phaser.Physics.Arcade.Body).setVelocityX(this.pipeVelocityX);
        (bottomPipe.body as Phaser.Physics.Arcade.Body).setVelocityX(this.pipeVelocityX);
        if (scoreZone) {
          scoreZone.destroy();
        }
        const newScoreZone = this.add.zone(800, gapY + this.gapSize / 2, 1, this.gapSize);
        this.physics.world.enable(newScoreZone);
        const scoreZoneBody = newScoreZone.body as Phaser.Physics.Arcade.Body;
        scoreZoneBody.setVelocityX(this.pipeVelocityX);
        scoreZoneBody.allowGravity = false;
        scoreZoneBody.immovable = true;
        this.physics.add.overlap(
          this.player,
          newScoreZone,
          () => this.incrementScore(newScoreZone),
          undefined,
          this
        );
        this.pipePairsData[index].scoreZone = newScoreZone;
      }
    });

    // Envia as posições dos canos para o servidor junto com a posição do pássaro
    const pipesData = this.pipes.getChildren().map((pipe: any) => ({
      x: pipe.x,
      y: pipe.y,
      width: pipe.displayWidth,
      height: pipe.displayHeight,
      id: pipe.getData("id")
    }));
    this.socket.emit("playerPosition", {
      matchId: this.matchId,
      x: this.player.x,
      y: this.player.y,
      pipes: pipesData
    });
  }
}

export default MainScene;
