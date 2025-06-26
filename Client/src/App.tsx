import React, { useEffect, useRef } from "react";
import Phaser from "phaser";
import GameConfig from "./game/GameConfig";
import { io, Socket } from "socket.io-client";

// Configuração global do socket
let socket: Socket | null = null;

export function initSocket(matchId: string): Socket {
  // Se já existe uma conexão ativa, retorna a existente
  if (socket?.connected) {
    return socket;
  }

  socket = io("http://localhost:3000", {
    path: "/socket.io", // Note a barra no final
    transports: ["websocket"], // Tentar WebSocket primeiro
    reconnectionAttempts: 5,
    reconnectionDelay: 1000,
    timeout: 20000,
    query: { matchId },
   // withCredentials: true,
    // Configurações adicionais para debug
    forceNew: true,
    autoConnect: true
  });

  // Eventos para debug
  socket.on("connect", () => {
    console.log("✅ Conectado ao servidor. ID:", socket?.id);
    socket?.emit("join-match", matchId);
  });

  socket.on("disconnect", (reason) => {
    console.log("⚠️ Desconectado:", reason);
    if (reason === "io server disconnect") {
      socket?.connect();
    }
  });

  socket.on("connect_error", (err) => {
    console.error("❌ Erro de conexão:", err.message);
    console.error("Detalhes:", {
      name: err.name
    });
  });

  socket.on("error", (err) => {
    console.error("🔥 Erro no socket:", err);
  });

  return socket;
}

export function getSocket(): Socket | null {
  return socket;
}

export function disconnectSocket(): void {
  if (socket) {
    socket.removeAllListeners();
    socket.disconnect();
    socket = null;
  }
}

const Game: React.FC = () => {
  const gameRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (!gameRef.current) return;
    const game = new Phaser.Game({
      ...GameConfig,
      parent: gameRef.current,
    });
    return () => {
      game.destroy(true);
      disconnectSocket();
    };
  }, []);
  return <div ref={gameRef} id="game-container" />;
};

export default Game;