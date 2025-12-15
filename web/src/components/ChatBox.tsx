import React, { useState } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { api } from '../services/api';

export const ChatBox: React.FC = () => {
  const [input, setInput] = useState("");
  const [messages, setMessages] = useState<{role: 'user'|'ai', text: string}[]>([
    {role: 'ai', text: "Hello! I am your Battery AI. Ask me about SOH or battery health."}
  ]);
  const [loading, setLoading] = useState(false);

  const handleSend = async () => {
    if (!input.trim()) return;
    
    const userMsg = input;
    setInput("");
    setMessages(prev => [...prev, {role: 'user', text: userMsg}]);
    setLoading(true);

    try {
      const reply = await api.chat(userMsg);
      setMessages(prev => [...prev, {role: 'ai', text: reply}]);
    } catch (error) {
      setMessages(prev => [...prev, {role: 'ai', text: "Error connecting to AI."}]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex flex-col h-[500px] bg-white rounded-xl shadow-sm border border-slate-200 overflow-hidden">
      <div className="p-4 bg-slate-50 border-b border-slate-200 font-semibold text-slate-700">
        AI Assistant
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {messages.map((m, i) => (
          <div key={i} className={`flex ${m.role === 'user' ? 'justify-end' : 'justify-start'}`}>
            <div className={`max-w-[80%] p-3 rounded-lg text-sm flex gap-2 ${
              m.role === 'user' ? 'bg-blue-600 text-white' : 'bg-slate-100 text-slate-800'
            }`}>
              {m.role === 'ai' ? <Bot size={16} className="mt-1" /> : <User size={16} className="mt-1"/>}
              <span>{m.text}</span>
            </div>
          </div>
        ))}
        {loading && <div className="text-xs text-slate-400 ml-2">Thinking...</div>}
      </div>

      <div className="p-3 border-t border-slate-200 flex gap-2">
        <input 
          className="flex-1 border rounded-md px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
          value={input}
          onChange={(e) => setInput(e.target.value)}
          placeholder="Ask a question..."
          onKeyDown={(e) => e.key === 'Enter' && handleSend()}
        />
        <button 
          onClick={handleSend}
          className="bg-blue-600 text-white p-2 rounded-md hover:bg-blue-700 transition"
        >
          <Send size={18} />
        </button>
      </div>
    </div>
  );
};