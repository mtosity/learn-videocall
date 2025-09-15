package main

import (
	"log"
	"net/http"
	"os"

	"github.com/gorilla/mux"
	"github.com/rs/cors"
)

func main() {
	port := os.Getenv("PORT")
	if port == "" {
		port = "8080"
	}

	r := mux.NewRouter()
	
	// WebSocket endpoint for signaling
	r.HandleFunc("/ws", handleWebSocket)
	
	// REST API endpoints
	r.HandleFunc("/api/rooms", createRoom).Methods("POST")
	r.HandleFunc("/api/rooms/{roomId}", getRoomInfo).Methods("GET")
	
	// Enable CORS
	c := cors.New(cors.Options{
		AllowedOrigins: []string{"http://localhost:3000"}, // React dev server
		AllowedMethods: []string{"GET", "POST", "PUT", "DELETE", "OPTIONS"},
		AllowedHeaders: []string{"*"},
		AllowCredentials: true,
	})

	handler := c.Handler(r)
	
	log.Printf("Server starting on port %s", port)
	log.Fatal(http.ListenAndServe(":"+port, handler))
}