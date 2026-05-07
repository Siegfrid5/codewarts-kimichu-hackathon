import { useState, useEffect, useRef } from 'react';
import { Send, Bot, User, Leaf } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3000';

export default function Chatbot() {
  const { apiCall } = useAuth();
  const [messages, setMessages] = useState([
    { role: 'ai', content: 'Magandang araw! Ako si GaBayAni, ang iyong AI Farm Consultant. May katanungan ka ba tungkol sa iyong palayan ngayong araw?' }
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
    <div className="container animate-fade-in" style={{ maxWidth: '800px', paddingTop: '32px', paddingBottom: '48px' }}>
      {/* Page header */}
      <div style={{ marginBottom: '24px' }}>
        <span className="eyebrow" style={{ marginBottom: '4px', display: 'block' }}>AI Consultant</span>
        <h2 style={{ margin: 0 }}>GaBayAni Consultant</h2>
      </div>

      <div style={{ 
        background: 'var(--canvas)',
        border: '1px solid var(--hairline)',
        borderRadius: 'var(--rounded-xl)', 
        boxShadow: 'var(--shadow-float)',
        height: '70vh', 
        display: 'flex', 
        flexDirection: 'column', 
        overflow: 'hidden' 
      }}>
        
        {/* Header */}
        <div style={{ 
          padding: '20px 24px', 
          borderBottom: '1px solid var(--hairline)', 
          display: 'flex', 
          alignItems: 'center', 
          gap: '12px', 
          background: 'var(--primary)',
          borderRadius: 'var(--rounded-xl) var(--rounded-xl) 0 0'
        }}>
          <div style={{ 
            width: '44px', 
            height: '44px', 
            borderRadius: 'var(--rounded-full)', 
            background: 'rgba(255,255,255,0.2)', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            flexShrink: 0
          }}>
            <Leaf size={24} color="white" />
          </div>
          <div style={{ flex: 1 }}>
            <h3 style={{ margin: 0, fontSize: '18px', color: 'var(--on-primary)', fontWeight: 700 }}>GaBayAni Consultant</h3>
            <p style={{ fontSize: '13px', margin: 0, color: 'rgba(255,255,255,0.7)', fontWeight: 500 }}>Powered by Gemini Pro • Live Farm Data</p>
          </div>
          {farms.length > 1 && (
            <select
              value={selectedFarmId || ''}
              onChange={(e) => setSelectedFarmId(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.15)',
                border: '1px solid rgba(255,255,255,0.25)',
                color: 'var(--on-primary)',
                padding: '8px 12px',
                borderRadius: 'var(--rounded-md)',
                fontSize: '13px',
                fontFamily: 'Plus Jakarta Sans, sans-serif',
                fontWeight: 500,
                cursor: 'pointer',
                backdropFilter: 'blur(4px)'
              }}
            >
              {farms.map(farm => (
                <option key={farm.id} value={farm.id} style={{ color: 'var(--ink)' }}>
                  {farm.municipality} Farm
                </option>
              ))}
            </select>
          )}
        </div>

        {/* Chat Area */}
        <div style={{ 
          flex: 1, 
          overflowY: 'auto', 
          padding: '24px', 
          display: 'flex', 
          flexDirection: 'column', 
          gap: '20px',
          background: 'var(--surface-1)'
        }}>
          {messages.map((msg, idx) => (
            <div key={idx} style={{ 
              display: 'flex', 
              gap: '12px', 
              alignItems: 'flex-start',
              flexDirection: msg.role === 'user' ? 'row-reverse' : 'row'
            }}>
              <div style={{ 
                width: '36px', 
                height: '36px', 
                borderRadius: 'var(--rounded-full)', 
                flexShrink: 0,
                background: msg.role === 'user' ? 'var(--primary)' : 'var(--accent)',
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center'
              }}>
                {msg.role === 'user' 
                  ? <User size={18} color="white" /> 
                  : <Leaf size={18} color="white" />
                }
              </div>
              <div style={{ 
                background: msg.role === 'user' ? 'var(--primary)' : 'var(--canvas)',
                color: msg.role === 'user' ? 'var(--on-primary)' : 'var(--ink)',
                border: msg.role === 'user' ? 'none' : '1px solid var(--hairline)',
                padding: '14px 18px',
                borderRadius: 'var(--rounded-lg)',
                borderTopRightRadius: msg.role === 'user' ? 'var(--rounded-xs)' : 'var(--rounded-lg)',
                borderTopLeftRadius: msg.role === 'ai' ? 'var(--rounded-xs)' : 'var(--rounded-lg)',
                maxWidth: '75%',
                whiteSpace: 'pre-wrap',
                boxShadow: msg.role === 'user' ? 'none' : 'var(--shadow-whisper)'
              }}>
                <p style={{ margin: 0, lineHeight: 1.6, fontSize: '15px' }}>{msg.content}</p>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
              <div style={{ 
                width: '36px', 
                height: '36px', 
                borderRadius: 'var(--rounded-full)', 
                background: 'var(--accent)', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Leaf size={18} color="white" />
              </div>
              <div style={{ 
                background: 'var(--canvas)',
                border: '1px solid var(--hairline)',
                padding: '14px 18px',
                borderRadius: 'var(--rounded-lg)',
                borderTopLeftRadius: 'var(--rounded-xs)',
                boxShadow: 'var(--shadow-whisper)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px'
              }}>
                <div style={{ display: 'flex', gap: '4px' }}>
                  {[0, 1, 2].map(i => (
                    <div key={i} style={{
                      width: '8px',
                      height: '8px',
                      borderRadius: '50%',
                      background: 'var(--primary)',
                      opacity: 0.4,
                      animation: `typingDot 1.2s ease-in-out ${i * 0.2}s infinite`
                    }} />
                  ))}
                </div>
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Area */}
        <div style={{ 
          padding: '16px 24px', 
          borderTop: '1px solid var(--hairline)', 
          background: 'var(--canvas)' 
        }}>
          <form onSubmit={handleSend} style={{ display: 'flex', gap: '12px' }}>
            <input 
              type="text" 
              className="form-input" 
              placeholder="Ask about weather, pests, or fertilizers..." 
              value={input}
              onChange={(e) => setInput(e.target.value)}
              style={{ 
                flex: 1,
                borderRadius: 'var(--rounded-pill)',
                paddingLeft: '20px',
                paddingRight: '20px'
              }}
            />
            <button 
              type="submit" 
              className="btn btn-primary" 
              disabled={!input.trim() || isTyping}
              style={{
                padding: '12px 20px',
                minHeight: '48px',
                borderRadius: 'var(--rounded-pill)'
              }}
            >
              <Send size={18} />
            </button>
          </form>
        </div>

      </div>

      {/* Typing animation keyframes */}
      <style>{`
        @keyframes typingDot {
          0%, 60%, 100% { transform: translateY(0); opacity: 0.4; }
          30% { transform: translateY(-6px); opacity: 1; }
        }
      `}</style>
    </div>
  );
}
