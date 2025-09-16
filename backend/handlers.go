package main

import (
	"crypto/rand"
	"encoding/hex"
	"encoding/json"
	"fmt"
	"log"
	"net/http"
	"time"

	"github.com/gorilla/mux"
	"github.com/gorilla/websocket"
)

var upgrader = websocket.Upgrader{
	CheckOrigin: func(r *http.Request) bool {
		return true // Allow connections from any origin in development
	},
}

type Room struct {
	ID          string                           `json:"id"`
	Clients     map[*websocket.Conn]*ClientInfo  `json:"-"`
	Broadcast   chan []byte                      `json:"-"`
	Register    chan *websocket.Conn             `json:"-"`
	Unregister  chan *websocket.Conn             `json:"-"`
	CreatedAt   time.Time                        `json:"createdAt"`
}

type ClientInfo struct {
	ID       string    `json:"id"`
	Name     string    `json:"name"`
	Conn     *websocket.Conn `json:"-"`
	JoinedAt time.Time `json:"joinedAt"`
}

type Message struct {
	Type     string      `json:"type"`
	Data     interface{} `json:"data"`
	RoomID   string      `json:"roomId,omitempty"`
	ClientID string      `json:"clientId,omitempty"`
	ClientName string    `json:"clientName,omitempty"`
	TargetID string      `json:"targetId,omitempty"`
}

var rooms = make(map[string]*Room)

func handleWebSocket(w http.ResponseWriter, r *http.Request) {
	conn, err := upgrader.Upgrade(w, r, nil)
	if err != nil {
		log.Println("WebSocket upgrade error:", err)
		return
	}
	defer conn.Close()

	for {
		var msg Message
		err := conn.ReadJSON(&msg)
		if err != nil {
			log.Println("WebSocket read error:", err)
			break
		}

		handleMessage(conn, msg)
	}
}

func handleMessage(conn *websocket.Conn, msg Message) {
	switch msg.Type {
	case "join-room":
		joinRoom(conn, msg.RoomID, msg.ClientID, msg.ClientName)
	case "offer":
		relayMessage(msg)
	case "answer":
		relayMessage(msg)
	case "ice-candidate":
		relayMessage(msg)
	case "leave-room":
		leaveRoom(conn, msg.RoomID)
	}
}

func joinRoom(conn *websocket.Conn, roomID string, clientID string, clientName string) {
	if room, exists := rooms[roomID]; exists {
		registerClientToRoom(room, conn, clientID, clientName)
	} else {
		// Create new room if it doesn't exist
		room := &Room{
			ID:         roomID,
			Clients:    make(map[*websocket.Conn]*ClientInfo),
			Broadcast:  make(chan []byte),
			Register:   make(chan *websocket.Conn),
			Unregister: make(chan *websocket.Conn),
			CreatedAt:  time.Now(),
		}
		rooms[roomID] = room
		go room.run()
		registerClientToRoom(room, conn, clientID, clientName)
	}
}

func registerClientToRoom(room *Room, conn *websocket.Conn, clientID string, clientName string) {
	clientInfo := &ClientInfo{
		ID:       clientID,
		Name:     clientName,
		Conn:     conn,
		JoinedAt: time.Now(),
	}

	// Send existing participants to the new client
	for existingClient, existingClientInfo := range room.Clients {
		if existingClient != conn {
			existingUserMsg := Message{
				Type:       "existing-user",
				ClientID:   existingClientInfo.ID,
				ClientName: existingClientInfo.Name,
				RoomID:     room.ID,
			}
			data, _ := json.Marshal(existingUserMsg)
			err := conn.WriteMessage(websocket.TextMessage, data)
			if err != nil {
				log.Printf("WebSocket write error sending existing user to new client: %v", err)
			}
		}
	}

	// Add the new client to the room
	room.Clients[conn] = clientInfo
	log.Printf("Client %s (%s) joined room %s. Total clients: %d", clientInfo.Name, clientInfo.ID, room.ID, len(room.Clients))

	// Notify existing clients about new user
	userJoinedMsg := Message{
		Type:       "user-joined",
		ClientID:   clientInfo.ID,
		ClientName: clientInfo.Name,
		RoomID:     room.ID,
	}
	data, _ := json.Marshal(userJoinedMsg)
	for otherClient := range room.Clients {
		if otherClient != conn {
			err := otherClient.WriteMessage(websocket.TextMessage, data)
			if err != nil {
				log.Printf("WebSocket write error: %v", err)
				otherClient.Close()
				delete(room.Clients, otherClient)
			}
		}
	}
}

func leaveRoom(conn *websocket.Conn, roomID string) {
	if room, exists := rooms[roomID]; exists {
		room.Unregister <- conn
	}
}

func relayMessage(msg Message) {
	if room, exists := rooms[msg.RoomID]; exists {
		data, _ := json.Marshal(msg)

		// If TargetID is specified, send only to that client
		if msg.TargetID != "" {
			for client, clientInfo := range room.Clients {
				if clientInfo.ID == msg.TargetID {
					err := client.WriteMessage(websocket.TextMessage, data)
					if err != nil {
						log.Printf("WebSocket write error: %v", err)
						client.Close()
						delete(room.Clients, client)
					}
					return
				}
			}
		} else {
			// Broadcast to all clients if no target specified
			room.Broadcast <- data
		}
	}
}

func (r *Room) run() {
	for {
		select {
		case client := <-r.Unregister:
			if clientInfo, ok := r.Clients[client]; ok {
				log.Printf("Client %s left room %s. Total clients: %d", clientInfo.ID, r.ID, len(r.Clients)-1)
				
				// Notify other clients about user leaving
				userLeftMsg := Message{
					Type:     "user-left",
					ClientID: clientInfo.ID,
					RoomID:   r.ID,
				}
				data, _ := json.Marshal(userLeftMsg)
				for otherClient := range r.Clients {
					if otherClient != client {
						err := otherClient.WriteMessage(websocket.TextMessage, data)
						if err != nil {
							log.Printf("WebSocket write error: %v", err)
						}
					}
				}
				
				delete(r.Clients, client)
				client.Close()
			}

		case message := <-r.Broadcast:
			for client := range r.Clients {
				err := client.WriteMessage(websocket.TextMessage, message)
				if err != nil {
					log.Printf("WebSocket write error: %v", err)
					client.Close()
					delete(r.Clients, client)
				}
			}
		}
	}
}

func createRoom(w http.ResponseWriter, r *http.Request) {
	// Generate unique room ID
	roomID := generateRoomID()
	
	room := &Room{
		ID:         roomID,
		Clients:    make(map[*websocket.Conn]*ClientInfo),
		Broadcast:  make(chan []byte),
		Register:   make(chan *websocket.Conn),
		Unregister: make(chan *websocket.Conn),
		CreatedAt:  time.Now(),
	}
	
	rooms[roomID] = room
	go room.run()
	
	w.Header().Set("Content-Type", "application/json")
	w.Header().Set("Access-Control-Allow-Origin", "*")
	json.NewEncoder(w).Encode(map[string]string{"roomId": roomID})
	log.Printf("Created room: %s", roomID)
}

func getRoomInfo(w http.ResponseWriter, r *http.Request) {
	vars := mux.Vars(r)
	roomID := vars["roomId"]
	
	if room, exists := rooms[roomID]; exists {
		w.Header().Set("Content-Type", "application/json")
		json.NewEncoder(w).Encode(map[string]interface{}{
			"id": room.ID,
			"clientCount": len(room.Clients),
		})
	} else {
		http.Error(w, "Room not found", http.StatusNotFound)
	}
}

func generateRoomID() string {
	// Generate a cryptographically secure random room ID
	bytes := make([]byte, 6)
	rand.Read(bytes)
	return fmt.Sprintf("room-%s", hex.EncodeToString(bytes))
}

func generateClientID() string {
	// Generate a unique client ID
	bytes := make([]byte, 4)
	rand.Read(bytes)
	return fmt.Sprintf("client-%s", hex.EncodeToString(bytes))
}