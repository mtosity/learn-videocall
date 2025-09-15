# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

Video call application similar to Google Meet, built with React frontend, Go backend, and Redis for real-time communication using WebRTC technology.

## Project Structure

```
├── frontend/          # React TypeScript app
├── backend/           # Go signaling server
├── docker-compose.yml # Development services
├── article.md         # Technical documentation
└── CLAUDE.md          # This file
```

## Commands

### Prerequisites
- Node.js (for frontend)
- Go 1.21+ (for backend)
- Docker & Docker Compose (for Redis)

### Development Setup

```bash
# Start Redis service
docker-compose up redis -d

# Frontend development
cd frontend
npm install
npm start        # Starts React dev server on http://localhost:3000

# Backend development  
cd backend
go mod tidy      # Install Go dependencies
go run .         # Starts Go server on http://localhost:8080

# Full stack with Docker
docker-compose up  # Starts all services
```

### Testing
```bash
# Frontend tests
cd frontend
npm test

# Backend tests (when implemented)
cd backend
go test ./...
```

## Development Setup

- **Package Manager**: npm (frontend)
- **Frontend**: React 18 with TypeScript
- **Backend**: Go with Gorilla WebSocket and Mux
- **Database**: Redis for real-time data and pub/sub
- **Containerization**: Docker Compose

## Architecture

### Core Components
- **Frontend** (`frontend/src/`): React components for video interface
- **Signaling Server** (`backend/handlers.go`): WebSocket-based signaling
- **Room Management** (`backend/main.go`): REST API for room operations
- **Redis Integration** (`backend/redis.go`): Real-time data and messaging

### Key Technologies
- **WebRTC**: Peer-to-peer audio/video communication
- **WebSocket**: Real-time signaling between peers
- **Redis Pub/Sub**: Scalable messaging and session management
- **Gorilla WebSocket**: Go WebSocket implementation
- **CORS**: Cross-origin resource sharing for frontend-backend communication

### API Endpoints
- `POST /api/rooms` - Create new room
- `GET /api/rooms/{roomId}` - Get room information
- `WS /ws` - WebSocket signaling endpoint

### WebSocket Message Types
- `join-room` - Join a video call room
- `offer` - WebRTC offer (SDP)
- `answer` - WebRTC answer (SDP)
- `ice-candidate` - ICE candidate for NAT traversal
- `leave-room` - Leave video call room

## Important Notes

- WebRTC requires HTTPS in production (getUserMedia security requirement)
- Redis is required for real-time features and scalability
- Go backend handles WebRTC signaling, not media streaming (P2P)
- Frontend needs WebRTC adapter for cross-browser compatibility
- STUN/TURN servers needed for NAT traversal in production

## Troubleshooting

- **"getUserMedia not found"**: Ensure HTTPS or localhost
- **WebSocket connection failed**: Check backend server is running
- **Redis connection error**: Ensure Redis is running (docker-compose up redis)
- **CORS errors**: Check allowed origins in backend CORS configuration

## Next Development Steps

See `article.md` for detailed technical documentation and implementation roadmap.