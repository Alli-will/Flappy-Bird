import { Scene } from "phaser";

class Pipe extends Phaser.Physics.Arcade.Sprite {
  constructor(scene: Scene, x: number, y: number, texture: string) {
    super(scene, x, y, texture);

    // Adiciona o sprite à cena e à física
    scene.add.existing(this);
    scene.physics.add.existing(this);

    // Configura a física do cano
    const body = this.body as Phaser.Physics.Arcade.Body;
    body.setVelocityX(-150); // Move para a esquerda
    body.setAllowGravity(false);
    body.setImmovable(true); // Não é afetado por outras físicas
  }

  update(): void {
    // Remove o cano quando sair completamente da tela
    if (this.x < -this.width) {
      this.destroy();
    }
  }
}

export default Pipe;