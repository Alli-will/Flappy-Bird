import { io, Socket } from 'socket.io-client';

const SERVER_URL = 'http://localhost:3000';

export const socket: Socket = io(SERVER_URL, {
  autoConnect: false,
});

// Conecta o socket se ainda não estiver conectado
export function connectSocket() {
  if (!socket.connected) {
    socket.connect();
  }
}

// Login via socket
export function socketLogin(nickname: string, password: string) {
  connectSocket();

  // Aguarda conexão antes de emitir login
  socket.once('connect', () => {
    socket.emit('login', { nickname, password });
  });

  socket.once('loginSuccess', (data: { token: string }) => {
    localStorage.setItem('token', data.token);
    localStorage.setItem('nickname', nickname);
    console.log('Login via socket bem-sucedido!');

    // Agora pode usar o socket normalmente para outros eventos
  });

  socket.once('loginError', (error: { message: string }) => {
    alert(error.message || 'Erro ao logar via socket');
  });
}
