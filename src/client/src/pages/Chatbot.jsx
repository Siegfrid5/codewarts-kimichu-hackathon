import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Chatbot() {
  const { apiCall } = useAuth();
  const [messages, setMessages] = useState([
    { role: 'ai', content: 'Magandang araw! Ako si Gabayani, ang iyong AI Farm Consultant. May katanungan ka ba tungkol sa iyong palayan ngayong araw?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [farms, setFarms] = useState([]);
  const [selectedFarmId, setSelectedFarmId] = useState(null);
  const chatEndRef = useRef(null);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isTyping]);

  // Fetch user's farms on mount
  useEffect(() => {
    const fetchFarms = async () => {
      try {
        const response = await apiCall(`${API_BASE_URL}/api/farms/my-farms`);
        const data = await response.json();
        if (data.success && data.data?.farms?.length > 0) {
          setFarms(data.data.farms);
          setSelectedFarmId(data.data.farms[0].id);
        }
      } catch (err) {
        console.error('Error fetching farms for chatbot:', err);
      }
    };
    fetchFarms();
  }, [apiCall]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!input.trim() || isTyping) return;

    if (!selectedFarmId) {
      setMessages(prev => [...prev, 
        { role: 'user', content: input },
        { role: 'ai', content: 'Please register a farm first so I can give you contextual advice about your specific location and conditions.' }
      ]);
      setInput('');
      return;
    }

    // Add user message
    const userMessage = input;
    setMessages(prev => [...prev, { role: 'user', content: userMessage }]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await apiCall(`${API_BASE_URL}/api/chatbot/message`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          farm_id: selectedFarmId,
          message: userMessage,
        }),
      });

      const data = await response.json();

      if (data.success) {
        setMessages(prev => [...prev, { role: 'ai', content: data.data.reply }]);
      } else {
        setMessages(prev => [...prev, { role: 'ai', content: `Sorry, I encountered an error: ${data.error?.message || 'Unknown error'}` }]);
      }
    } catch (err) {
      console.error('Chatbot error:', err);
      setMessages(prev => [...prev, { role: 'ai', content: 'Pasensya na, may problema sa connection. Subukan muli mamaya.' }]);
    } finally {
      setIsTyping(false);
    }
  };

  return (
    <div className="container animate-fade-in" style={{ maxWidth: '800px', paddingTop: '6rem' }}>
      <div className="glass-panel" style={{ height: '70vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={24} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Gabayani Consultant</h3>
            <p className="text-muted" style={{ fontSize: '0.85rem', margin: 0 }}>Powered by Gemini Pro • Live Farm Data</p>
          </div>
          {farms.length > 1 && (
            <select
              value={selectedFarmId || ''}
              onChange={(e) => setSelectedFarmId(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid var(--border-glass)',
                color: 'var(--text-primary)',
                padding: '0.5rem',
                borderRadius: '8px',
                fontSize: '0.85rem',
              }}
            >
              {farms.map(farm => (
                <option key={farm.id} value={farm.id}>
                  {farm.municipality} Farm
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Chat Area */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '2rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          {messages.map((msg, idx) => (
            <div key={idx} style={{ 
              display: 'flex', 
              gap: '1rem', 
              alignItems: 'flex-start',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
            }}>
              <div style={{ 
                width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                background: msg.role === 'user' ? 'var(--accent-primary)' : 'var(--accent-secondary)',
                display: 'flex', alignItems: 'center', justifyContent: 'center'
              }}>
                {msg.role === 'user' ? <User size={16} color="white" /> : <Bot size={16} color="white" />}
              </div>
              <div style={{ 
                background: msg.role === 'user' ? 'rgba(16, 185, 129, 0.2)' : 'rgba(255,255,255,0.05)',
                border: `1px solid ${msg.role === 'user' ? 'rgba(16, 185, 129, 0.4)' : 'var(--border-glass)'}`,
                padding: '1rem',
                borderRadius: '12px',
                borderTopRightRadius: msg.role === 'user' ? '0' : '12px',
                borderTopLeftRadius: msg.role === 'ai' ? '0' : '12px',
                maxWidth: '80%',
                whiteSpace: 'pre-wrap',
              }}>
                <p style={{ margin: 0, lineHeight: '1.6' }}>{msg.content}</p>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={16} color="white" />
              </div>
              <div className="text-muted" style={{ padding: '0.5rem 1rem' }}>Gabayani is thinking...</div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ padding: '1.5rem', borderTop: '1px solid var(--border-glass)', background: 'rgba(0,0,0,0.2)' }}>
          <form onSubmit={handleSend} style={{ display: 'flex', gap: '1rem' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Ask about weather, pests, or fertilizers..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{ flex: 1, background: 'rgba(255,255,255,0.05)' }}
            />
            <button type="submit" className="btn btn-primary" disabled={!input.trim() || isTyping}>
              <Send size={18} />
            </button>
          </form>
        </div>

      </div>
    </div>
  );
}
