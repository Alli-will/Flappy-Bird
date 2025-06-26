import Phaser from "phaser";
import { PlayerAnimation } from "../objects/animations/PlayerAnimation";

class PreloadScene extends Phaser.Scene {
  constructor() {
    super({ key: "PreloadScene" });
  }

  preload() {
    this.load.spritesheet("player_1", "/assets/player/bird.png", {
      frameHeight: 110,
      frameWidth: 110,
    });

    // ✅ Aqui carrega a imagem de fundo
    this.load.image("fundo_menu", "/assets/map/fundo.jpg"); 
    this.load.image('fundo', '/assets/map/fundo1-0000.jpg');
    
  }

  create() {
    new PlayerAnimation(this);

    this.scene.start("MenuScene");
  }
}

export default PreloadScene;
