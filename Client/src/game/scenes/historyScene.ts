import { Player } from '../types/player';
import { socket } from '../socket';

export class HistoryScene extends Phaser.Scene {
  constructor() {
    super('HistoryScene');
    
  }

  create() {
    this.add.image(0, 0, 'fundo_menu').setOrigin(0, 0);
    this.add.text(400, 100, 'Histórico', { fontSize: '32px', color: '#222222' }).setOrigin(0.5);

    this.carregarHistoricoViaSocket();

    // Botão Voltar
    const voltarButton = this.add.text(
      400,
      500,
      'Voltar',
      { fontSize: '28px', color: '#f00' }
    ).setOrigin(0.5);

    voltarButton.setInteractive().on('pointerdown', () => {
      this.scene.start('MenuGameScene');
    });
  }

  carregarHistoricoViaSocket() {
    const token = localStorage.getItem('token') || '';

    if (!socket.connected) {
      console.log('Socket não conectado, conectando...');
      socket.connect();
    }

    socket.emit('getHistory', { token });

    socket.once('historyData', (data: Player[]) => {
      console.log('Histórico recebido via socket:', data);

      let players = Array.isArray(data) ? data : [];

      players.sort((a, b) => {
        const scoreA = this.getScore(a);
        const scoreB = this.getScore(b);
        return scoreB - scoreA;
      });

      const top10 = players.slice(0, 10);

      if (top10.length > 0) {
        top10.forEach((player: Player, index: number) => {
          const score = this.getScore(player);
          const nickname = player.user?.nickname ?? 'Sem nome';

          this.add.text(
            400,
            150 + index * 30,
            `${index + 1}. ${nickname}: ${score}`,
            { fontSize: '24px', color: '#222222' }
          ).setOrigin(0.5);
        });
      } else {
        this.add.text(
          400,
          150,
          'Nenhum dado de histórico disponível',
          { fontSize: '24px', color: '#ff0' }
        ).setOrigin(0.5);
      }
    });

    socket.once('historyError', (error) => {
      console.error('Erro ao carregar histórico via socket:', error.message);

      this.add.text(
        400,
        150,
        'Erro ao carregar histórico',
        { fontSize: '24px', color: '#f00' }
      ).setOrigin(0.5);
    });
  }

  /** 
   * Função utilitária para pegar o score do player de forma segura.
   */
  private getScore(player: any): number {
    return player?.maxScore ?? player?.score ?? player?.statistics?.maxScore ?? 0;
  }
}
