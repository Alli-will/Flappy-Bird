export class PlayerAnimation {
  

  constructor(scene: Phaser.Scene) {
    
    scene.anims.create({
      key: "player_flap",
      frames: scene.anims.generateFrameNumbers("player_1", {
        start: 0,
        end: 18,
      }),
      frameRate:24,
      repeat: -1,
    });
   

  }

 
}
