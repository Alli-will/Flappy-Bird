import { socket } from '../socket';  // ajuste o caminho conforme sua estrutura

export class LoginScene extends Phaser.Scene {
  nicknameInput!: Phaser.GameObjects.DOMElement;
  passInput!: Phaser.GameObjects.DOMElement;

  constructor() {
    super('LoginScene');
  }

  create() {
    this.add.image(0, 0, 'fundo_menu').setOrigin(0, 0);

    this.add.text(400, 270, 'Login', { fontSize: '32px', color: '#000000' }).setOrigin(0.5);

    const nicknameInputElement = document.createElement('input');
    nicknameInputElement.type = 'text';
    nicknameInputElement.placeholder = 'nickname';
    nicknameInputElement.style.fontSize = '20px';
    this.nicknameInput = this.add.dom(400, 340, nicknameInputElement);

    const passInputElement = document.createElement('input');
    passInputElement.type = 'password';
    passInputElement.placeholder = 'senha';
    passInputElement.style.fontSize = '20px';
    this.passInput = this.add.dom(400, 390, passInputElement);

    const entrarBtn = this.add.text(400, 450, 'Entrar', { fontSize: '24px', color: '#000000' }).setOrigin(0.5).setInteractive();
    const voltarBtn = this.add.text(400, 500, 'Voltar', { fontSize: '24px', color: '#000000' }).setOrigin(0.5).setInteractive();

    // Registrar listeners uma vez no create
    socket.on('loginSuccess', (data: { token: string }) => {
      localStorage.setItem('token', data.token);
      const nickname = (this.nicknameInput?.node as HTMLInputElement)?.value || '';
      localStorage.setItem('nickname', nickname);
      this.scene.start('MenuGameScene');
    });

    socket.on('loginError', (error: { message: string }) => {
      alert(error.message || 'Erro ao logar');
    });

    entrarBtn.on('pointerdown', () => {
      const nickname = (this.nicknameInput?.node as HTMLInputElement)?.value || '';
      const senha = (this.passInput?.node as HTMLInputElement)?.value || '';

      if (!nickname || !senha) {
        alert('Por favor, preencha todos os campos!');
        return;
      }

      this.fazerLogin(nickname, senha);
    });

    voltarBtn.on('pointerdown', () => this.scene.start('LoginMenuScene'));
  }

  fazerLogin(nickname: string, senha: string) {
    console.log('Enviando login...', { nickname, senha });
    if (!socket.connected) {
      socket.once('connect', () => {
        console.log('Socket conectado!');
        socket.emit('login', { nickname, password: senha });
      });
      socket.connect();
    } else {
      socket.emit('login', { nickname, password: senha });
    }
  }

  // Opcional: remover os listeners quando sair da cena para evitar duplicação
  shutdown() {
    socket.off('loginSuccess');
    socket.off('loginError');
  }
}
