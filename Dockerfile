    version: '3.8'

services:
  server:
    build:
      context: ./server
      dockerfile: Dockerfile
    ports:
      - "3001:3001"
    environment:
      - PORT=3001
      - CLIENT_URL=http://localhost:3000
      - NODE_ENV=production
    restart: unless-stopped
    networks:
      - game-network

  client:
    build:
      context: ./client
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      - NEXT_PUBLIC_SOCKET_URL=http://localhost:3001
    depends_on:
      - server
    restart: unless-stopped
    networks:
      - game-network

networks:
  game-network:
    driver: bridge