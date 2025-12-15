import React, { useState } from 'react';
import { api, type PredictionResponse } from './services/api';
import { Gauge } from './components/Gauge';
import { ChatBox } from './components/ChatBox';
import { Activity, Zap } from 'lucide-react';
import './index.css'

// Random default values for testing
const DEFAULT_VOLTAGES = Array(21).fill(3.6).map(v => v + Math.random() * 0.1);

function App() {
  const [voltages, setVoltages] = useState<number[]>(DEFAULT_VOLTAGES);
  const [result, setResult] = useState<PredictionResponse | null>(null);
  const [loading, setLoading] = useState(false);

  const handlePredict = async () => {
    setLoading(true);
    try {
      const data = await api.getPrediction(voltages);
      setResult(data);
    } catch (err) {
      alert("Failed to get prediction from Go Backend");
    } finally {
      setLoading(false);
    }
  };

  const updateVoltage = (index: number, val: string) => {
    const newV = [...voltages];
    newV[index] = parseFloat(val) || 0;
    setVoltages(newV);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 font-sans p-6">
      
      {/* Header */}
      <header className="max-w-6xl mx-auto mb-8 flex items-center gap-3">
        <div className="p-3 bg-blue-600 rounded-lg shadow-lg shadow-blue-600/20">
          <Activity className="text-white" size={24} />
        </div>
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Battery SOH System</h1>
          <p className="text-slate-500 text-sm">AI-Powered Health Monitoring</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-6">
        
        {/* Left Column: Inputs (Cols 1-4) */}
        <div className="lg:col-span-4 space-y-6">
          <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
            <div className="flex items-center justify-between mb-4">
              <h2 className="font-semibold flex items-center gap-2">
                <Zap size={18} className="text-yellow-500"/> Cell Voltages (V)
              </h2>
              <button 
                onClick={() => setVoltages(DEFAULT_VOLTAGES.map(v => v + (Math.random()*0.2 - 0.1)))}
                className="text-xs text-blue-600 hover:underline"
              >
                Randomize
              </button>
            </div>
            
            <div className="grid grid-cols-3 gap-3">
              {voltages.map((v, i) => (
                <div key={i} className="flex flex-col">
                  <label className="text-[10px] text-slate-400 mb-1">U{i+1}</label>
                  <input
                    type="number"
                    step="0.01"
                    className="border border-slate-200 rounded px-2 py-1 text-sm focus:border-blue-500 outline-none transition"
                    value={v.toFixed(3)}
                    onChange={(e) => updateVoltage(i, e.target.value)}
                  />
                </div>
              ))}
            </div>

            <button
              onClick={handlePredict}
              disabled={loading}
              className="w-full mt-6 bg-slate-900 text-white py-3 rounded-lg font-medium hover:bg-slate-800 transition shadow-lg shadow-slate-900/20 disabled:opacity-50"
            >
              {loading ? "Calculating..." : "Analyze Health"}
            </button>
          </div>
        </div>

        {/* Middle Column: Results (Cols 5-8) */}
        <div className="lg:col-span-4 space-y-6">
          {result ? (
            <>
              <Gauge value={result.soh} label={result.classification} />
              
              <div className="bg-white p-6 rounded-xl shadow-sm border border-slate-200">
                <h3 className="font-semibold mb-4 text-sm text-slate-500 uppercase tracking-wider">Model Analysis</h3>
                {result.plots.performance && (
                   <img 
                     src={`data:image/png;base64,${result.plots.performance}`} 
                     alt="SOH Chart" 
                     className="w-full rounded-lg border border-slate-100"
                   />
                )}
                <div className="mt-4 p-3 bg-slate-50 rounded text-xs text-slate-500 font-mono break-all">
                  {result.equation.substring(0, 50)}...
                </div>
              </div>
            </>
          ) : (
            <div className="h-full flex flex-col items-center justify-center text-slate-400 bg-white/50 rounded-xl border-2 border-dashed border-slate-200">
              <Activity size={48} className="mb-2 opacity-20" />
              <p>Run analysis to see results</p>
            </div>
          )}
        </div>

        {/* Right Column: AI Chat (Cols 9-12) */}
        <div className="lg:col-span-4">
          <ChatBox />
        </div>

      </main>
    </div>
  );
}

export default App;