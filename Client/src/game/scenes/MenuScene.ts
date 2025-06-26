export class MenuScene extends Phaser.Scene {
  constructor() {
    super('MenuScene');
  }

  create() {
    this.add.image(0, 0, 'fundo_menu').setOrigin(0, 0);
    const playButton = this.add.text(400, 300, 'Jogar sem Login', { fontSize: '32px', color: '#000000' }).setOrigin(0.5);
    const loginButton = this.add.text(400, 200, 'Login', { fontSize: '32px', color: '#000000' }).setOrigin(0.5);
    const rankingButton = this.add.text(400, 400, 'Ranking', { fontSize: '32px', color: '#000000' }).setOrigin(0.5);

    playButton.setInteractive().on('pointerdown', () => this.scene.start('GameScene'));
    loginButton.setInteractive().on('pointerdown', () => this.scene.start('LoginMenuScene'));
    rankingButton.setInteractive().on('pointerdown', () => this.scene.start('RankingScene', { previousScene: 'MenuScene' }));
  }
}
