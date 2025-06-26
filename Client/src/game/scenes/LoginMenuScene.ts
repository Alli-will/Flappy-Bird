import { socketLogin } from '../socket';
export class LoginMenuScene extends Phaser.Scene {

  nicknameInput!: Phaser.GameObjects.DOMElement;
  passInput!: Phaser.GameObjects.DOMElement;

  constructor() {
    super('LoginMenuScene');
    
  }

  

  create() {
    this.add.image(0, 0, 'fundo_menu').setOrigin(0, 0);

    this.add.text(400, 150, 'Bem-vindo', { fontSize: '32px', color: '#000000' }).setOrigin(0.5);
    const entrarBtn = this.add.text(400, 250, 'Entrar', { fontSize: '28px', color: '#000000' }).setOrigin(0.5).setInteractive();
    const cadastrarBtn = this.add.text(400, 320, 'Cadastrar', { fontSize: '28px', color: '##000000' }).setOrigin(0.5).setInteractive();
    const voltarBtn = this.add.text(400, 390, 'Voltar', { fontSize: '28px', color: '#000000' }).setOrigin(0.5).setInteractive();


    entrarBtn.on('pointerdown', () => this.scene.start('LoginScene'));
    cadastrarBtn.on('pointerdown', () => this.scene.start('RegisterScene'));
    voltarBtn.on('pointerdown', () => this.scene.start('MenuScene'));

    

  }

  
}
