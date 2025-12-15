import axios from 'axios';

const API_URL = 'http://localhost:8080/api';

export interface PredictionResponse {
  soh: number;
  soh_raw: number;
  classification: string;
  equation: string;
  plots: {
    performance?: string; 
  };
}

export const api = {
  /**
   * Sends the 21 voltage readings to the Go backend.
   */
  getPrediction: async (voltages: number[]): Promise<PredictionResponse> => {
    const response = await axios.post(`${API_URL}/predict`, {
      voltages, 
      threshold: 0.6,
      include_plots: true
    });
    return response.data;
  },

  chat: async (message: string): Promise<string> => {
    const response = await axios.post(`${API_URL}/chat`, { message });
    return response.data.reply;
  }
};