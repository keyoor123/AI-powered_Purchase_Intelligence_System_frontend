// src/pages/AiAssistantPage.tsx
import React, { useState, useRef, useEffect } from 'react';
import { api, ChatResponse } from '../services/api.ts';
import { Send, Database } from 'lucide-react';

interface ChatMessage {
  id: string;
  sender: 'user' | 'assistant';
  text: string;
  timestamp: Date;
  context?: ChatResponse['extracted_parameters'];
}

const formatMessageText = (text: string) => {
  if (!text) return '';
  const paragraphs = text.split('\n');
  return paragraphs.map((para, paraIdx) => {
    const parts = para.split(/(\*\*.*?\*\*)/g);
    const elements = parts.map((part, partIdx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={partIdx}>{part.slice(2, -2)}</strong>;
      }
      return part;
    });
    return (
      <p key={paraIdx} style={{ margin: paraIdx > 0 ? '0.5rem 0 0 0' : '0', color: 'inherit' }}>
        {elements}
      </p>
    );
  });
};

const AiAssistantPage: React.FC = () => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: 'm1',
      sender: 'assistant',
      text: 'Hello! I am your AI Procurement Assistant. Ask me about suppliers, pricing trends, savings opportunities, or negotiation targets.',
      timestamp: new Date()
    }
  ]);
  const [input, setInput] = useState('');
  const [selectedContext, setSelectedContext] = useState<ChatResponse['extracted_parameters'] | null>(null);
  const [loading, setLoading] = useState(false);
  const [actualProducts, setActualProducts] = useState<string[]>([]);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const loadProducts = async () => {
      try {
        const prodDetails = await api.getProductDetails();
        if (prodDetails && prodDetails.length > 0) {
          setActualProducts(prodDetails.map(p => p.product_name));
        }
      } catch (err) {
        console.error('Failed to fetch actual products for presets', err);
      }
    };
    loadProducts();
  }, []);

  useEffect(() => {
    // Scroll chat to bottom when message arrives
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [messages]);

  const handleSend = async (textToSend: string) => {
    if (!textToSend.trim()) return;

    const userMsg: ChatMessage = {
      id: Math.random().toString(),
      sender: 'user',
      text: textToSend,
      timestamp: new Date()
    };
    
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setLoading(true);

    try {
      // Call the unified backend AI chat endpoint
      const response = await api.chat(textToSend);
      
      const assistantMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: 'assistant',
        text: response.response,
        timestamp: new Date(),
        context: response.extracted_parameters
      };

      setMessages(prev => [...prev, assistantMsg]);
      setSelectedContext(response.extracted_parameters);
    } catch (err) {
      console.error(err);
      
      const assistantMsg: ChatMessage = {
        id: Math.random().toString(),
        sender: 'assistant',
        text: 'Failed to communicate with the AI Chat assistant. Please make sure the backend server is running and your OpenRouter API key is configured.',
        timestamp: new Date()
      };
      
      setMessages(prev => [...prev, assistantMsg]);
    } finally {
      setLoading(false);
    }
  };

  const dynamicPresets = [
    { 
      label: actualProducts[0] ? `Cheapest suppliers for "${actualProducts[0]}"` : 'Cheapest suppliers', 
      queryType: 'cheapest_dealer', 
      productName: actualProducts[0] 
    },
    { 
      label: 'Negotiation targets', 
      queryType: 'negotiation_targets' 
    },
    { 
      label: actualProducts[0] ? `Price increases for "${actualProducts[0]}"` : 'Price increases', 
      queryType: 'price_increase', 
      productName: actualProducts[0] 
    },
    { 
      label: 'Monthly spend summary', 
      queryType: 'monthly_spend' 
    }
  ];

  const handlePresetClick = (preset: typeof dynamicPresets[0]) => {
    let questionText = `Find the ${preset.queryType.replace('_', ' ')}`;
    if (preset.productName) {
      questionText += ` for "${preset.productName}"`;
    }
    handleSend(questionText);
  };

  const hasContextDetails = selectedContext && (selectedContext.product_name || selectedContext.dealer_a || selectedContext.dealer_b);

  return (
    <div className={`chat-container ${hasContextDetails ? 'has-sources' : ''} animate-fade-in`}>
      {/* Messages Pane */}
      <div className="chat-messages-area">
        <div className="chat-messages-scroll" ref={scrollRef}>
          {messages.map((msg) => (
            <div 
              key={msg.id} 
              className={`chat-bubble ${msg.sender}`}
              onClick={() => msg.context && setSelectedContext(msg.context)}
              style={{ cursor: msg.context ? 'pointer' : 'default' }}
            >
              {formatMessageText(msg.text)}
              {msg.context && (msg.context.product_name || msg.context.dealer_a || msg.context.dealer_b) && (
                <div style={{ marginTop: '0.4rem', display: 'flex', gap: '0.25rem', alignItems: 'center', fontSize: '0.75rem', opacity: 0.8, color: msg.sender === 'user' ? 'white' : 'var(--primary)' }}>
                  <Database size={12} />
                  <span>Click to view citations sources</span>
                </div>
              )}
            </div>
          ))}

          {loading && (
            <div className="chat-bubble assistant animate-pulse" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <div className="loading-spinner" style={{ width: 14, height: 14, borderWidth: 2 }} />
              <span>Compiling procurement context...</span>
            </div>
          )}
        </div>

        {/* Presets Row */}
        <div className="chat-presets">
          {dynamicPresets.map((preset) => (
            <button
              key={preset.label}
              className="chat-preset-btn"
              onClick={() => handlePresetClick(preset)}
              disabled={loading}
            >
              {preset.label}
            </button>
          ))}
        </div>

        {/* Input box */}
        <form 
          className="chat-input-area"
          onSubmit={(e) => {
            e.preventDefault();
            if (input.trim()) handleSend(input);
          }}
        >
          <div className="chat-input-wrapper" style={{ position: 'relative', flexGrow: 1 }}>
            <input
              type="text"
              placeholder="Ask a question about your purchase data (e.g. negotiation targets or supplier shift estimates)..."
              value={input}
              onChange={(e) => setInput(e.target.value)}
              className="input-field"
              style={{ paddingRight: '3rem' }}
              disabled={loading}
            />
            <button 
              type="submit" 
              className="btn btn-primary" 
              style={{ position: 'absolute', right: '4px', top: '50%', transform: 'translateY(-50%)', padding: '0.4rem 0.6rem', height: 'auto' }}
              disabled={loading || !input.trim()}
            >
              <Send size={14} />
            </button>
          </div>
        </form>
      </div>

      {/* Citations Drawer Panel */}
      {hasContextDetails && selectedContext && (
        <div className="chat-sources-drawer glass-panel">
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderBottom: '1px solid var(--border-color)', paddingBottom: '0.75rem' }}>
            <h3 style={{ fontSize: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <Database size={16} style={{ color: 'var(--primary)' }} />
              Citations Sources
            </h3>
            <button 
              style={{ background: 'none', border: 'none', color: 'var(--text-muted)', cursor: 'pointer', fontSize: '0.85rem' }}
              onClick={() => setSelectedContext(null)}
            >
              Hide
            </button>
          </div>

          <div className="sources-list animate-slide-up">
            {selectedContext.product_name && (
              <div className="source-item">
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Product Target</span>
                <h4 style={{ fontSize: '0.95rem', margin: '0.1rem 0' }}>{selectedContext.product_name}</h4>
              </div>
            )}

            {selectedContext.dealer_a && (
              <div className="source-item animate-slide-up" style={{ animationDelay: '0.1s' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Supplier A</span>
                <h4 style={{ fontSize: '0.95rem', margin: '0.1rem 0' }}>{selectedContext.dealer_a}</h4>
              </div>
            )}

            {selectedContext.dealer_b && (
              <div className="source-item animate-slide-up" style={{ animationDelay: '0.2s' }}>
                <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', textTransform: 'uppercase' }}>Supplier B</span>
                <h4 style={{ fontSize: '0.95rem', margin: '0.1rem 0' }}>{selectedContext.dealer_b}</h4>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default AiAssistantPage;
