import { Scene } from "phaser";
import { getSocket } from "../../App";

class Player extends Phaser.Physics.Arcade.Sprite {
  private flapForce: number = -300; 
  private fallForce: number = 300; 
  cursors: Phaser.Types.Input.Keyboard.CursorKeys;
  isDead: any;
  waitingForSpaceRelease: boolean = false;

  constructor(scene: Scene, x: number, y: number, sprite: string) {
    super(scene, x, y, sprite);
    this.scene.physics.add.existing(this);
    this.scene.add.existing(this);
    this.setCollideWorldBounds(true);
    this.anims.play("player_flap");
    this.cursors = this.scene.input.keyboard!.createCursorKeys();
    this.scene.events.on("update", this.update, this);
    this.setOffset(50, 0);
    this.body?.setSize(110, 90);
    this.setCircle(40, 20);
    this.setCollideWorldBounds(true);

    
    
  }

  update(): void {
  if (this.isDead) {
    return; // Se o jogador está morto, não atualiza mais
  }

  const socket = getSocket();
  if (socket) {
    socket.emit("playerPosition", {
      x: this.x,
      y: this.y,
      match: "ID_DA_PARTIDA"
    });
  }

  const { space } = this.cursors;

  if (space.isDown) {
    this.setVelocityY(this.flapForce); // Faz o jogador subir
  } else {
    this.setVelocityY(this.fallForce); // Faz o jogador descer
  }

  // Verifica se o jogador tocou no chão ou no teto
  if (this.y >= this.scene.scale.height || this.y <= 0) {
    this.gameOver(); // Chama o método de Game Over
  }
}

  gameOver(): void {
    this.isDead = true;
    this.setVelocityY(0);
    this.setVelocityX(0);
    this.setRotation(90);
    this.setTint(0xff0000);

    this.scene.events.emit("gameOver");
  }

  adjustDifficulty(): void {
  
    this.flapForce -= 10; 
    this.fallForce += 10; 
  }
}

export default Player;