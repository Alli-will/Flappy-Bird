import Phaser from "phaser";
import { socket } from '../socket';  // ✅ ajuste o caminho conforme seu projeto

export default class GameOverScene extends Phaser.Scene {
  private score: number = 0;
  private canRestart: boolean = false;
  private nickname: string = '';
  private countdownText!: Phaser.GameObjects.Text;
  private countdown: number = 3;

  constructor() {
    super({ key: "GameOverScene" });
  }

  init(data: { score: number, nickname?: string }) {
    this.score = data.score;
    this.nickname = data.nickname || localStorage.getItem('nickname') || 'Jogador';
  }

  create() {
    this.add.image(0, 0, 'fundo_menu').setOrigin(0, 0);

    const overlay = this.add.rectangle(
      0, 0,
      this.cameras.main.width,
      this.cameras.main.height,
      0x000000, 0.7
    );
    overlay.setOrigin(0, 0);

    this.add.text(this.cameras.main.centerX, this.cameras.main.centerY - 100, "Game Over", {
      fontSize: "64px",
      color: "#ff0000",
      fontFamily: "Arial",
      stroke: "#000000",
      strokeThickness: 8,
    }).setOrigin(0.5);

    this.add.text(this.cameras.main.centerX, this.cameras.main.centerY, `Pontuação Final: ${this.score}`, {
      fontSize: "48px",
      color: "#ffffff",
      fontFamily: "Arial",
      stroke: "#000000",
      strokeThickness: 4,
    }).setOrigin(0.5);

    this.add.text(this.cameras.main.centerX, this.cameras.main.centerY + 100, "Clique fora do botão ou pressione ESPAÇO para jogar novamente", {
      fontSize: "24px",
      color: "#ffffff",
      fontFamily: "Arial",
    }).setOrigin(0.5);

    const menuButton = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY + 170, "Menu", {
      fontSize: "32px",
      color: "#ffffff",
      fontFamily: "Arial",
      backgroundColor: "#333333",
      padding: { x: 20, y: 10 },
    }).setOrigin(0.5).setInteractive();

    menuButton.on("pointerover", () => {
      menuButton.setColor("#ff0000");
    });

    menuButton.on("pointerout", () => {
      menuButton.setColor("#ffffff");
    });

    const goToMenu = () => {
      this.scene.stop("GameOverScene");
      this.scene.stop("GameScene");

      const token = localStorage.getItem("token");
      if (token) {
        this.scene.start("MenuGameScene");
      } else {
        this.scene.start("MenuScene");
      }
    };

    menuButton.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      pointer.event.stopPropagation();
      goToMenu();
    });

    this.countdown = 3;
    this.countdownText = this.add.text(this.cameras.main.centerX, this.cameras.main.centerY + 60, `Aguarde ${this.countdown} segundos para reiniciar...`, {
      fontSize: "28px",
      color: "#ffff00",
      fontFamily: "Arial",
      stroke: "#000000",
      strokeThickness: 4,
    }).setOrigin(0.5);

    const countdownEvent = this.time.addEvent({
      delay: 1000,
      repeat: 2,
      callback: () => {
        this.countdown--;
        if (this.countdown > 0) {
          this.countdownText.setText(`Aguarde ${this.countdown} segundos para reiniciar...`);
        } else {
          this.countdownText.setText('Você pode reiniciar!');
          this.time.delayedCall(500, () => this.countdownText.setVisible(false));
        }
      }
    });

    this.time.delayedCall(3000, () => {
      this.canRestart = true;
    });

    const criarPartidaViaSocket = () => {
      if (!socket.connected) {
        console.log('Socket não conectado, conectando...');
        socket.connect();
      }

      const token = localStorage.getItem('token') || '';

      socket.emit('createMatch', { token, nickname: this.nickname });

      socket.once('matchCreated', (data) => {
        console.log('Partida criada via socket:', data.matchId);
        this.scene.stop("GameOverScene");
        this.scene.start("GameScene", { nickname: this.nickname, matchId: data.matchId });
      });

      socket.once('matchCreationError', (error) => {
        console.error('Erro ao criar partida via socket:', error.message);
        alert(error.message || 'Erro ao criar partida');
      });
    };

    // Clique fora do botão
    this.input.on("pointerdown", (pointer: Phaser.Input.Pointer) => {
      if (this.canRestart && !menuButton.getBounds().contains(pointer.x, pointer.y)) {
        this.canRestart = false;  // ✅ evita múltiplos cliques
        criarPartidaViaSocket();
      }
    });

    if (this.input.keyboard) {
      this.input.keyboard.on("keydown-SPACE", () => {
        if (this.canRestart) {
          this.canRestart = false;
          criarPartidaViaSocket();
        }
      });
    }
  }
}
