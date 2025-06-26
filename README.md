## Backend (Server)

### Requisitos
- Node.js (versão 16 ou superior)
- npm ou yarn

### Instalação e Execução
1. Abra o terminal e navegue até a pasta `Server`:
   ```sh
   cd Server
   ```
2. Instale as dependências:
   ```sh
   yarn install
   ```
3. Inicie o backend em modo desenvolvimento:
   ```sh
   yarn run dev
   ```
4. O backend estará disponível em [http://localhost:3000](http://localhost:3000) 

---

## Observações
- Sempre inicie o backend antes do frontend para evitar erros de conexão.
- Ajuste variáveis de ambiente se necessário.

---

# Como executar o Frontend (Client)

1. Certifique-se de ter o Node.js instalado (versão 16 ou superior).
2. No terminal, navegue até a pasta `Client`:
   ```sh
   cd Client
   ```
3. Instale as dependências:
   ```sh
   npm install
   ```
4. Inicie o frontend:
   ```sh
   npm start
   ```
5. Acesse [http://localhost:3001](http://localhost:3001) no navegador.

---

# Dicas
- Sempre inicie o backend antes do frontend para evitar erros de conexão.
- Se necessário, ajuste as configurações de porta ou variáveis de ambiente nos arquivos de configuração.

# Instância do MongoDB com Docker

Execute um dos comandos abaixo para subir uma instância do MongoDB usando Docker:

```
docker run -d \
  --name mongodb \
  -p 27017:27017 \
  -e MONGO_INITDB_ROOT_USERNAME=admin \
  -e MONGO_INITDB_ROOT_PASSWORD=1234 \
  -e MONGO_INITDB_DATABASE=teste \
  mongo
```

Ou, em uma linha só:

```
docker run -d --name mongodb2 -p 27017:27017 -e MONGO_INITDB_ROOT_USERNAME=admin -e MONGO_INITDB_ROOT_PASSWORD=1234 -e MONGO_INITDB_DATABASE=teste mongo
```

---