import { Player } from '../types/player';
import {socket} from '../socket'

export class RankingScene extends Phaser.Scene {
  private previousScene: string = 'MenuScene'; // padrão
  constructor() {
    super('RankingScene');
  }

  init(data: any) {
    if (data.previousScene) {
      this.previousScene = data.previousScene;
    }
  }

  create() {
    this.add.image(0, 0, 'fundo_menu').setOrigin(0, 0);

    // Título fixo
    this.add.text(400, 100, 'Ranking', { fontSize: '32px', color: '#000000' }).setOrigin(0.5);

    // Chama a função para carregar ranking async
    this.loadRanking();

    // Botão Voltar
    const voltarButton = this.add.text(
      400,
      500,
      'Voltar',
      { fontSize: '28px', color: '#00000' }
    ).setOrigin(0.5);

    voltarButton.setInteractive().on('pointerdown', () => {
      this.scene.start(this.previousScene);
    });
  }

  loadRanking() {

    if (!socket.connected) {
      socket.connect();
    }
    // Emite o evento para solicitar ranking
    socket.emit('requestRanking');
  
    // Escuta o evento de resposta com o ranking
    socket.once('rankingData', (data: any[]) => {
    console.log('Ranking recebido:', data);
    this.displayRanking(data);
    });
  
    // Escuta erro, caso tenha um canal de erro
    socket.once('rankingError', (msg: string) => {
      this.showError(msg);
    });
  }
  
  displayRanking(players: any[]) {
  players.sort((a, b) => b.score - a.score);

  const top10 = players.slice(0, 10);

  if (top10.length > 0) {
    top10.forEach((player, index) => {
      this.add.text(
        400,
        150 + index * 30,
        `${index + 1}. ${player.nickname ?? 'Sem nome'}: ${player.score ?? 0}`,
        { fontSize: '24px', color: '#000000' }
      ).setOrigin(0.5);
    });
  } else {
    this.add.text(
      400,
      150,
      'Nenhum dado de ranking disponível',
      { fontSize: '24px', color: '#00000' }
    ).setOrigin(0.5);
  }
}
  
  showError(msg: string) {
    this.add.text(
      400,
      150,
      `Erro ao carregar ranking: ${msg}`,
      { fontSize: '24px', color: '#00000' }
    ).setOrigin(0.5);
  }
}
