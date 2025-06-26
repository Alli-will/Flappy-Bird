import Phaser from "phaser";
import PreloadScene from "./scenes/PreloadScene";
import GameOverScene from "./scenes/GameOverScenes";
import { MenuScene } from "./scenes/MenuScene";
import { LoginMenuScene} from "./scenes/LoginMenuScene";
import { MenuGameScene } from "./scenes/menuGameScene";
import { RankingScene } from "./scenes/rankingScene";
import { RegisterScene } from "./scenes/RegisterScene";
import { LoginScene } from "./scenes/LoginScene";
import GameScene from "./scenes/GameScene";
import { HistoryScene } from "./scenes/historyScene";



const GameConfig: Phaser.Types.Core.GameConfig = {
  type: Phaser.AUTO,
  width: 800, // Largura do canvas Phaser
  height: 720,
  scale: {
    mode: Phaser.Scale.FIT,
    autoCenter: Phaser.Scale.CENTER_BOTH,
    width: 800,
    height: 720,
  },
  dom:{
    createContainer: true, // Permite que o Phaser crie um container para o DOM
  },
  parent: "game-container", 
  physics: {
    default: "arcade",
    arcade: {
      gravity: { x: 0, y: 0 },
      debug: false,
    },
  },


  scene: [PreloadScene, MenuScene, LoginMenuScene, LoginScene, RegisterScene, MenuGameScene, GameScene, RankingScene, GameOverScene, HistoryScene],


  
};


export default GameConfig;
