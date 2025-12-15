package mlclient

import (
	"bytes"
	"encoding/json"
	"fmt"
	"net/http"
	"time"
)

const pythonURL = "http://localhost:8080"

type AIClient struct {
	httpClient *http.Client
	baseUrl    string
}

type PredictionRequest struct {
	Voltages     []float64 `json:"voltages"`
	Threshold    float64   `json:"threshold"`
	IncludePlots bool      `json:"include_plots"`
}

type PredictionResponse struct {
	SohRaw         float64           `json:"soh_raw"`
	Soh            float64           `json:"soh"`
	Classification string            `json:"classification"`
	Equation       string            `json:"equation"`
	Plots          map[string]string `json:"plots"`
}

type ChatRequest struct {
	Message string `json:"message"`
}

type ChatResponse struct {
	Reply string `json:"reply"`
	Error string `json:"error,omitempty"`
}

func NewAIClient(url string) *AIClient {
	if url == "" {
		url = pythonURL
	}
	return &AIClient{
		httpClient: &http.Client{Timeout: 10 * time.Second},
		baseUrl:    url,
	}
}

// Methods

func (c *AIClient) Chat(msg string) (string, error) {
	reqBody := ChatRequest{Message: msg}
	jsonBody, _ := json.Marshal(reqBody)

	resp, err := c.httpClient.Post(c.baseUrl+"/chat", "application/json", bytes.NewBuffer(jsonBody))
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	var result ChatResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}
	return result.Reply, nil
}

func (c *AIClient) GetPrediction(voltages []float64) (*PredictionResponse, error) {
	reqBody := PredictionRequest{
		Voltages:     voltages,
		Threshold:    0.6,
		IncludePlots: true,
	}

	jsonBody, _ := json.Marshal(reqBody)
	resp, err := c.httpClient.Post(c.baseUrl+"/predict", "application/json", bytes.NewBuffer(jsonBody))

	if err != nil {
		return nil, fmt.Errorf("failed to contact AI service: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("AI service returned status: %d", resp.StatusCode)
	}

	var result PredictionResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode AI response: %w", err)
	}
	return &result, nil
}
