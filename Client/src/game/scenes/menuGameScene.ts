import { socket } from '../socket';  // ajuste conforme caminho do seu arquivo socket

export class MenuGameScene extends Phaser.Scene {
  private nickname!: string;

  constructor() {
    super('MenuGameScene');
    
  }

  create() {
    this.add.image(0, 0, 'fundo_menu').setOrigin(0, 0);
    this.nickname = localStorage.getItem('nickname') || 'Jogador';  

    this.add.text(400, 200, `Bem-vindo, ${this.nickname}!`, { 
      fontSize: '32px', 
      color: '#000000' 
    }).setOrigin(0.5);

    const playButton = this.add.text(400, 300, 'Jogar', { 
      fontSize: '28px', 
      color: '#000000' 
    }).setOrigin(0.5);

    const rankingButton = this.add.text(400, 400, 'Ranking', { 
      fontSize: '28px', 
      color: '#000000' 
    }).setOrigin(0.5);

    const historyButton = this.add.text(400, 500, 'Histórico', { 
      fontSize: '28px', 
      color: '#000000' 
    }).setOrigin(0.5);

    const sairButton = this.add.text(400, 600, 'Sair', { 
      fontSize: '28px', 
      color: '#000000' 
    }).setOrigin(0.5);

    // ✅ Criar partida pelo socket
    playButton.setInteractive().on('pointerdown', () => {
      this.criarPartidaViaSocket();
    });

    rankingButton.setInteractive().on('pointerdown', () => {
      this.scene.start('RankingScene', { previousScene: 'MenuGameScene' });
    });

    historyButton.setInteractive().on('pointerdown', () => {
      this.scene.start('HistoryScene');
    });

    sairButton.setInteractive().on('pointerdown', () => {
      localStorage.removeItem('token');
      localStorage.removeItem('nickname');
      this.scene.start('MenuScene');
    });
  }

criarPartidaViaSocket() {
  if (!socket.connected) {
    console.log('Socket não conectado, conectando...');
    socket.connect();
  }

  const token = localStorage.getItem('token') || '';

  socket.emit('createMatch', { token });

  socket.once('matchCreated', (data) => {
    console.log('Partida criada via socket:', data.matchId);
    this.scene.start('GameScene', { nickname: this.nickname, matchId: data.matchId });
  });

  socket.once('matchCreationError', (error) => {
    console.error('Erro ao criar partida via socket:', error.message);
    alert(error.message || 'Erro ao criar partida');
  });
}
  
}
