import { socket } from '../socket';  // ajuste o caminho conforme sua estrutura

export class RegisterScene extends Phaser.Scene {
  nicknameInput!: Phaser.GameObjects.DOMElement;
  passInput!: Phaser.GameObjects.DOMElement;

  constructor() {
    super('RegisterScene');
  }

  create() {
    this.add.image(0, 0, 'fundo_menu').setOrigin(0, 0);

    this.add.text(400, 200, 'Cadastrar', { fontSize: '32px', color: '#000000' }).setOrigin(0.5);

    const nicknameInputElement = document.createElement('input');
    nicknameInputElement.type = 'text';
    nicknameInputElement.placeholder = 'nickname';
    nicknameInputElement.style.fontSize = '20px';
    nicknameInputElement.style.padding = '10px 8px';
    nicknameInputElement.style.width = '220px';
    nicknameInputElement.style.borderRadius = '6px';
    nicknameInputElement.style.marginBottom = '10px';
    nicknameInputElement.style.background = '#000000';
    nicknameInputElement.style.color = '#f00';
    nicknameInputElement.style.border = '1px solid #333';
    this.nicknameInput = this.add.dom(400, 300, nicknameInputElement);

    const passInputElement = document.createElement('input');
    passInputElement.type = 'password';
    passInputElement.placeholder = 'senha';
    passInputElement.style.fontSize = '20px';
    passInputElement.style.padding = '10px 8px';
    passInputElement.style.width = '220px';
    passInputElement.style.borderRadius = '6px';
    passInputElement.style.background = '#000';
    passInputElement.style.color = '#fff';
    passInputElement.style.border = '1px solid #333';
    this.passInput = this.add.dom(400, 350, passInputElement);

    const cadastrarBtn = this.add.text(400, 410, 'Cadastrar', { fontSize: '24px', color: '#000000' }).setOrigin(0.5).setInteractive();
    const voltarBtn = this.add.text(400, 460, 'Voltar', { fontSize: '24px', color: '#000000' }).setOrigin(0.5).setInteractive();

    // Listeners de resposta do servidor
    socket.on('registerSuccess', () => {
      alert('Cadastrado com sucesso!');
      this.scene.start('LoginMenuScene');
    });

    socket.on('registerError', (error: { message: string }) => {
      alert(error.message || 'Erro ao cadastrar');
    });

    cadastrarBtn.on('pointerdown', () => {
      const nickname = (this.nicknameInput.node as HTMLInputElement).value;
      const senha = (this.passInput.node as HTMLInputElement).value;

      if (!nickname || !senha) {
        alert('Por favor, preencha todos os campos!');
        return;
      }

      this.fazerCadastro(nickname, senha);
    });

    voltarBtn.on('pointerdown', () => this.scene.start('LoginMenuScene'));
  }

  fazerCadastro(nickname: string, senha: string) {
    console.log('Enviando cadastro...', { nickname, senha });
    if (!socket.connected) {
      socket.once('connect', () => {
        console.log('Socket conectado!');
        socket.emit('register', { nickname, password: senha });
      });
      socket.connect();
    } else {
      socket.emit('register', { nickname, password: senha });
    }
  }

  shutdown() {
    socket.off('registerSuccess');
    
    socket.off('registerError');
  }
}
