import React, { useState, useRef, useEffect } from 'react';
import { MessageSquare, X, Send, HelpCircle, Globe } from 'lucide-react';

export default function FanAssistant({ onSendMessage }) {
  const [isOpen, setIsOpen] = useState(false);
  const [inputMsg, setInputMsg] = useState('');
  const [loading, setLoading] = useState(false);
  const [messages, setMessages] = useState([
    {
      sender: 'bot',
      text: 'Hello! I am your official FIFA World Cup 2026 Venue Assistant. Ask me anything about match schedules, gate access policies, stadium facilities, or food concessions. Type in any language (Spanish, German, etc.) and I will translate implicitly!'
    }
  ]);

  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isOpen]);

  const handleSend = async (e) => {
    e.preventDefault();
    if (!inputMsg.trim() || loading) return;

    const userText = inputMsg.trim();
    const currentHistory = [...messages];
    
    // Add user message to state
    setMessages(prev => [...prev, { sender: 'user', text: userText }]);
    setInputMsg('');
    setLoading(true);

    try {
      // Send chat history and message
      const response = await onSendMessage(userText, currentHistory);
      setMessages(prev => [...prev, { sender: 'bot', text: response }]);
    } catch (err) {
      console.error(err);
      setMessages(prev => [...prev, { sender: 'bot', text: 'Sorry, I am having trouble connecting to stadium telemetry. Please try again.' }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Floating launcher button */}
      <button className="fan-assistant-launcher" onClick={() => setIsOpen(!isOpen)}>
        {isOpen ? <X size={26} color="#fff" /> : <MessageSquare size={26} color="#fff" />}
      </button>

      {/* Floating drawer */}
      {isOpen && (
        <div className="glass-panel fan-drawer">
          {/* Header */}
          <div className="drawer-header">
            <div className="drawer-header-title">
              <MessageSquare size={18} style={{ color: 'var(--color-primary)' }} />
              <div>
                <h3 style={{ margin: 0, color: '#fff' }}>FIFA Fan Copilot</h3>
                <span style={{ fontSize: '0.65rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '3px' }}>
                  <Globe size={10} /> Auto-Translation Grounded Context
                </span>
              </div>
            </div>
            <button className="drawer-close" onClick={() => setIsOpen(false)}>
              <X size={18} />
            </button>
          </div>

          {/* Messages Pane */}
          <div className="fan-messages">
            {messages.map((msg, index) => (
              <div key={index} className={`fan-msg ${msg.sender}`}>
                {msg.text}
              </div>
            ))}
            {loading && (
              <div className="fan-msg bot" style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <div className="spinner" style={{ width: '12px', height: '12px', borderWidth: '2px' }} />
                <span>Gemini is translating & grounding...</span>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form onSubmit={handleSend} className="chat-drawer-input" style={{ display: 'flex', gap: '8px' }}>
            <input
              type="text"
              value={inputMsg}
              onChange={(e) => setInputMsg(e.target.value)}
              placeholder="Ask a question in any language..."
              className="chat-input"
              style={{ fontSize: '0.85rem', padding: '8px 12px' }}
              disabled={loading}
            />
            <button type="submit" className="btn" style={{ padding: '8px 12px' }} disabled={loading || !inputMsg.trim()}>
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </>
  );
}
