import React, { useState, useRef, useEffect } from "react";
import { api } from "../api";
import { 
  MessageSquare, 
  Send, 
  Bot, 
  User, 
  Loader, 
  Sparkles, 
  Hash,
  AlertCircle
} from "lucide-react";

const EXAMPLE_QUESTIONS = [
  "How do I report a pothole?",
  "What's the status of my complaint?",
  "How long until my complaint is resolved?",
  "Which department handles water issues?",
];

export default function AIAssistant() {
  const [query, setQuery] = useState("");
  const [complaintId, setComplaintId] = useState("");
  const [conversation, setConversation] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const chatEndRef = useRef(null);
  const inputRef = useRef(null);

  // Auto-scroll to the latest message
  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [conversation, isLoading]);

  const handleSubmit = async (questionOverride) => {
    const questionText = (questionOverride || query).trim();
    if (!questionText || isLoading) return;

    const cidValue = complaintId.trim() || null;

    // Add user message to conversation
    const userMessage = {
      type: "user",
      text: questionText,
      complaintId: cidValue,
      timestamp: new Date(),
    };

    setConversation((prev) => [...prev, userMessage]);
    setQuery("");
    setIsLoading(true);

    try {
      const response = await api.askAssistant(questionText, cidValue);
      const botMessage = {
        type: "bot",
        text: response.answer,
        timestamp: new Date(),
      };
      setConversation((prev) => [...prev, botMessage]);
    } catch (err) {
      const errorMessage = {
        type: "error",
        text:
          err?.message ||
          "Sorry, something went wrong. Please try again in a moment.",
        timestamp: new Date(),
      };
      setConversation((prev) => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
      // Re-focus the input
      if (inputRef.current) {
        inputRef.current.focus();
      }
    }
  };

  const handleChipClick = (question) => {
    setQuery(question);
    handleSubmit(question);
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSubmit();
    }
  };

  const formatTime = (date) => {
    return date.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
  };

  return (
    <div className="ai-assistant-container" id="ai-assistant-page">
      {/* Page Header */}
      <div className="page-header">
        <h1 className="page-title" id="ai-assistant-title" style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "12px" }}>
          <div className="ai-assistant-icon-glow">
            <Sparkles size={28} />
          </div>
          AI Assistant
        </h1>
        <p className="page-subtitle">
          Ask questions about civic services, complaint processes, or check on a specific complaint.
        </p>
      </div>

      {/* Chat Card */}
      <div className="ai-chat-card card" id="ai-chat-card">
        {/* Complaint ID Input */}
        <div className="ai-complaint-id-section" id="ai-complaint-id-section">
          <label className="ai-complaint-id-label" htmlFor="ai-complaint-id-input">
            <Hash size={14} />
            Complaint ID
            <span className="ai-optional-tag">Optional</span>
          </label>
          <input
            type="text"
            id="ai-complaint-id-input"
            className="form-input ai-complaint-id-input"
            placeholder="e.g. GRV-2026-0042"
            value={complaintId}
            onChange={(e) => setComplaintId(e.target.value)}
            disabled={isLoading}
          />
          <p className="ai-complaint-id-hint">
            Enter a complaint ID to ask specific questions about it, or leave blank for general help.
          </p>
        </div>

        {/* Conversation Area */}
        <div className="ai-chat-area" id="ai-chat-messages">
          {conversation.length === 0 && !isLoading ? (
            <div className="ai-empty-state">
              <div className="ai-empty-icon">
                <Bot size={40} />
              </div>
              <h3>How can I help you today?</h3>
              <p>Ask me anything about civic services, complaint procedures, or the status of your grievance.</p>
            </div>
          ) : (
            <div className="ai-messages-list">
              {conversation.map((msg, idx) => (
                <div
                  key={idx}
                  className={`ai-message-row ${msg.type === "user" ? "ai-message-user" : "ai-message-bot"}`}
                >
                  <div className={`ai-message-avatar ${msg.type === "user" ? "ai-avatar-user" : msg.type === "error" ? "ai-avatar-error" : "ai-avatar-bot"}`}>
                    {msg.type === "user" ? (
                      <User size={16} />
                    ) : msg.type === "error" ? (
                      <AlertCircle size={16} />
                    ) : (
                      <Bot size={16} />
                    )}
                  </div>
                  <div className={`ai-message-bubble ${msg.type === "user" ? "ai-bubble-user" : msg.type === "error" ? "ai-bubble-error" : "ai-bubble-bot"}`}>
                    {msg.type === "user" && msg.complaintId && (
                      <div className="ai-bubble-complaint-tag">
                        <Hash size={11} />
                        {msg.complaintId}
                      </div>
                    )}
                    <div className="ai-bubble-text">{msg.text}</div>
                    <div className="ai-bubble-time">{formatTime(msg.timestamp)}</div>
                  </div>
                </div>
              ))}

              {/* Loading indicator */}
              {isLoading && (
                <div className="ai-message-row ai-message-bot">
                  <div className="ai-message-avatar ai-avatar-bot">
                    <Bot size={16} />
                  </div>
                  <div className="ai-message-bubble ai-bubble-bot ai-bubble-thinking">
                    <div className="ai-thinking-dots">
                      <Loader size={14} className="ai-spinner" />
                      <span>Thinking...</span>
                    </div>
                  </div>
                </div>
              )}

              <div ref={chatEndRef} />
            </div>
          )}
        </div>

        {/* Example Chips */}
        {conversation.length === 0 && (
          <div className="ai-chips-section" id="ai-example-chips">
            <div className="ai-chips-label">Try asking:</div>
            <div className="ai-chips-row">
              {EXAMPLE_QUESTIONS.map((q, i) => (
                <button
                  key={i}
                  className="ai-chip"
                  onClick={() => handleChipClick(q)}
                  disabled={isLoading}
                  id={`ai-chip-${i}`}
                >
                  <MessageSquare size={13} />
                  {q}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Input Area */}
        <div className="ai-input-section" id="ai-input-section">
          <div className="ai-input-wrapper">
            <input
              ref={inputRef}
              type="text"
              className="form-input ai-text-input"
              placeholder="Type your question..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={handleKeyDown}
              disabled={isLoading}
              id="ai-question-input"
              autoComplete="off"
            />
            <button
              className="btn btn-primary ai-ask-btn"
              onClick={() => handleSubmit()}
              disabled={isLoading || !query.trim()}
              id="ai-ask-button"
            >
              {isLoading ? <Loader size={18} className="ai-spinner" /> : <Send size={18} />}
              Ask
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
