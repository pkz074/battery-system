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

type predictionRequest struct {
	Voltages     []float64 `json:"voltages"`
	Threshold    float64   `json:"threshold"`
	IncludePlots bool      `json:"include_plots"`
}

type predictionResponse struct {
	SohRaw         float64           `json:"soh_raw"`
	Soh            float64           `json:"soh"`
	Classification string            `json:"classification"`
	Equation       string            `json:"equation"`
	Plots          map[string]string `json:"plots"`
}

type chatRequest struct {
	Message string `json:"message"`
}

type chatResponse struct {
	Reply string `json:"reply"`
	Error string `json:"error,omitempty"`
}

func newAIClient(url string) *AIClient {
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
	reqBody := chatRequest{Message: msg}
	jsonBody, _ := json.Marshal(reqBody)

	resp, err := c.httpClient.Post(c.baseUrl+"/chat", "applications/json", bytes.NewBuffer(jsonBody))
	if err != nil {
		return "", err
	}
	defer resp.Body.Close()
	var result chatResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return "", err
	}
	return result.Reply, nil
}

func (c *AIClient) getPrediction(voltages []float64) (*predictionResponse, error) {
	reqBody := predictionRequest{
		Voltages:     voltages,
		Threshold:    0.6,
		IncludePlots: true,
	}

	jsonBody, _ := json.Marshal(reqBody)
	resp, err := c.httpClient.Post(c.baseUrl+"/predict", "applications/json", bytes.NewBuffer(jsonBody))

	if err != nil {
		return nil, fmt.Errorf("failed to contact AI service: %w", err)
	}
	defer resp.Body.Close()

	if resp.StatusCode != http.StatusOK {
		return nil, fmt.Errorf("AI service returned status: %d", resp.StatusCode)
	}

	var result predictionResponse
	if err := json.NewDecoder(resp.Body).Decode(&result); err != nil {
		return nil, fmt.Errorf("failed to decode AI response: %w", err)
	}
	return &result, nil
}
