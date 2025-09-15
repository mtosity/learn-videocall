package main

import (
	"context"
	"encoding/json"
	"log"
	"time"

	"github.com/go-redis/redis/v8"
)

type RedisManager struct {
	client *redis.Client
	ctx    context.Context
}

func NewRedisManager() *RedisManager {
	rdb := redis.NewClient(&redis.Options{
		Addr:     "localhost:6379", // Redis server address
		Password: "",               // No password set
		DB:       0,                // Use default DB
	})

	ctx := context.Background()
	
	// Test connection
	_, err := rdb.Ping(ctx).Result()
	if err != nil {
		log.Printf("Redis connection failed: %v", err)
		return nil
	}

	log.Println("Redis connected successfully")
	return &RedisManager{
		client: rdb,
		ctx:    ctx,
	}
}

// Store room information in Redis
func (r *RedisManager) StoreRoom(roomID string, roomData map[string]interface{}) error {
	data, err := json.Marshal(roomData)
	if err != nil {
		return err
	}

	return r.client.Set(r.ctx, "room:"+roomID, data, 24*time.Hour).Err()
}

// Get room information from Redis
func (r *RedisManager) GetRoom(roomID string) (map[string]interface{}, error) {
	data, err := r.client.Get(r.ctx, "room:"+roomID).Result()
	if err != nil {
		return nil, err
	}

	var roomData map[string]interface{}
	err = json.Unmarshal([]byte(data), &roomData)
	return roomData, err
}

// Store user session information
func (r *RedisManager) StoreUserSession(userID, roomID string, sessionData map[string]interface{}) error {
	data, err := json.Marshal(sessionData)
	if err != nil {
		return err
	}

	// Store with expiration
	return r.client.Set(r.ctx, "user:"+userID+":room:"+roomID, data, 2*time.Hour).Err()
}

// Publish real-time updates to subscribers
func (r *RedisManager) PublishUpdate(channel string, data interface{}) error {
	jsonData, err := json.Marshal(data)
	if err != nil {
		return err
	}

	return r.client.Publish(r.ctx, channel, jsonData).Err()
}

// Subscribe to real-time updates
func (r *RedisManager) Subscribe(channel string) *redis.PubSub {
	return r.client.Subscribe(r.ctx, channel)
}

// Add user to room set
func (r *RedisManager) AddUserToRoom(roomID, userID string) error {
	return r.client.SAdd(r.ctx, "room:"+roomID+":users", userID).Err()
}

// Remove user from room set
func (r *RedisManager) RemoveUserFromRoom(roomID, userID string) error {
	return r.client.SRem(r.ctx, "room:"+roomID+":users", userID).Err()
}

// Get all users in a room
func (r *RedisManager) GetRoomUsers(roomID string) ([]string, error) {
	return r.client.SMembers(r.ctx, "room:"+roomID+":users").Result()
}

// Clean up expired rooms and sessions
func (r *RedisManager) CleanupExpiredData() {
	// This would typically be run as a background job
	// For now, it's a placeholder for cleanup logic
	log.Println("Running Redis cleanup...")
}