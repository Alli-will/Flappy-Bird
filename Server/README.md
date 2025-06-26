# Como executar o Backend (Server)

1. Certifique-se de ter o Node.js instalado (versão 16 ou superior).
2. No terminal, navegue até a pasta `Server`:
   ```sh
   cd Server
   ```
3. Instale as dependências:
   ```sh
   yarn install
   ```
4. Inicie o backend em modo desenvolvimento:
   ```sh
   yarn run dev
   ```
5. O backend estará disponível em [http://localhost:3001](http://localhost:3001) (ou porta configurada).

---

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

# Dicas
- Sempre inicie o backend antes do frontend para evitar erros de conexão.
- Se necessário, ajuste as configurações de porta ou variáveis de ambiente nos arquivos de configuração.
