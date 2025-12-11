package main

import (
	"battery-backend/internal/mlclient"
	"encoding/json"
	"log"
	"net/http"

	"github.com/go-chi/chi/v5"
	"github.com/go-chi/chi/v5/middleware"
	"github.com/go-chi/cors"
)

func main() {

	ai := mlclient.newAIClient("http://localhost:8080")

	r := chi.NewRouter()

	r.Use(middleware.Logger)
	r.Use(middleware.Recoverer)

	r.Use(cors.Handler(cors.Options{
		AllowedOrigins: []string{"*"},
		AllowedMethods: []string{"GET", "POST", "OPTIONS"},
		AllowedHeaders: []string{"Accept", "Authorization", "Content-Type"},
	}))

	r.Get("/health", func(w http.ResponseWriter, r *http.Request) {
		w.Write([]byte("Backend is running"))
	})

	r.Post("/api/predict", func(w http.ResponseWriter, r *http.Request) {

		var req mlclient.predictionRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid request", 400)
			return
		}

		result, err := ai.getPrediction(req.Voltages)
		if err != nil {
			log.Println("AI Error: ", err)
			http.Error(w, "AI Failed", 500)
			return
		}
		// (TODO: Later we will save 'result' to MySQL here before responding)
		json.NewEncoder(w).Encode(result)
	})

	r.Post("/api/chat", func(w http.ResponseWriter, r *http.Request) {
		var req mlclient.ChatRequest
		if err := json.NewDecoder(r.Body).Decode(&req); err != nil {
			http.Error(w, "Invalid JSON", 400)
			return
		}

		reply, err := ai.Chat(req.Message)
		if err != nil {
			http.Error(w, "Chat Error", 500)
			return
		}

		json.NewEncoder(w).Encode(map[string]string{"reply": reply})
	})

	log.Println("Go Server starting on :8080...")
	http.ListenAndServe(":8080", r)
}
