import { useState } from 'react';
import { Send, Bot, User } from 'lucide-react';

export default function Chatbot() {
  const [messages, setMessages] = useState([
    { role: 'ai', content: 'Magandang araw! Ako si Gabayani, ang iyong AI Farm Consultant. May katanungan ka ba tungkol sa iyong palayan ngayong araw?' }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const handleSend = (e) => {
    e.preventDefault();
    if (!input.trim()) return;

    // Add user message
    const newMessages = [...messages, { role: 'user', content: input }];
    setMessages(newMessages);
    setInput('');
    setIsTyping(true);

    // Mock AI response (In real app, calls POST /api/chatbot/message)
    setTimeout(() => {
      setMessages([...newMessages, { 
        role: 'ai', 
        content: `Ayon sa huling tala ng GABAYANI para sa iyong farm sa Manila, may nakataas na moderate risk para sa pagbaha dahil sa inaasahang 20mm na ulan ngayong oras. Makabubuting suriin ang inyong mga dike at drainage canals.` 
      }]);
      setIsTyping(false);
    }, 2500);
  };

  return (
    <div className="container animate-fade-in" style={{ maxWidth: '800px', paddingTop: '6rem' }}>
      <div className="glass-panel" style={{ height: '70vh', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        
        {/* Header */}
        <div style={{ padding: '1.5rem', borderBottom: '1px solid var(--border-glass)', display: 'flex', alignItems: 'center', gap: '1rem', background: 'rgba(0,0,0,0.2)' }}>
          <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Bot size={24} color="white" />
          </div>
          <div>
            <h3 style={{ margin: 0, fontSize: '1.2rem' }}>Gabayani Consultant</h3>
            <p className="text-muted" style={{ fontSize: '0.85rem', margin: 0 }}>Powered by Gemini Pro</p>
          </div>
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
                maxWidth: '80%'
              }}>
                <p style={{ margin: 0, lineHeight: '1.5' }}>{msg.content}</p>
              </div>
            </div>
          ))}
          
          {isTyping && (
            <div style={{ display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--accent-secondary)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Bot size={16} color="white" />
              </div>
              <div className="text-muted" style={{ padding: '0.5rem 1rem' }}>Gabayani is typing...</div>
            </div>
          )}
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
