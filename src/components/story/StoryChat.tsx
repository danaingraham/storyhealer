"use client";

import { useState, useRef, useEffect } from "react";
import { X, Send, Minimize2, Maximize2, MessageCircle, Loader2 } from "lucide-react";

interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
}

interface StoryChatProps {
  story: any;
  currentPage: number;
  onClose: () => void;
  onStoryUpdate: () => void;
}

export function StoryChat({ story, currentPage, onClose, onStoryUpdate }: StoryChatProps) {
  const [isMinimized, setIsMinimized] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputValue, setInputValue] = useState("");
  const [isProcessing, setIsProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setError(null);
    loadConversationHistory();
  }, [currentPage]);

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  const loadConversationHistory = async () => {
    try {
      console.log(`Loading conversation history for story ${story.id}, page ${currentPage}`);
      const response = await fetch(`/api/stories/${story.id}/conversations/${currentPage}`);
      if (response.ok) {
        const data = await response.json();
        console.log("Loaded conversation data:", data);
        // Convert timestamp strings back to Date objects
        const messagesWithDates = (data.messages || []).map((msg: any) => ({
          ...msg,
          timestamp: new Date(msg.timestamp)
        }));
        setMessages(messagesWithDates);
        console.log(`Loaded ${messagesWithDates.length} messages`);
      } else {
        console.log("No conversation history found, starting fresh");
        setMessages([]);
      }
    } catch (error) {
      console.error("Failed to load conversation history:", error);
      setMessages([]);
    }
  };

  const saveConversationHistory = async (newMessages: Message[]) => {
    try {
      console.log(`Saving ${newMessages.length} messages for story ${story.id}, page ${currentPage}`);
      const response = await fetch(`/api/stories/${story.id}/conversations/${currentPage}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: newMessages }),
      });
      
      if (response.ok) {
        console.log("Successfully saved conversation history");
      } else {
        console.error("Failed to save conversation - server error:", response.status);
      }
    } catch (error) {
      console.error("Failed to save conversation:", error);
    }
  };

  const handleSendMessage = async () => {
    if (!inputValue.trim() || isProcessing) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: "user",
      content: inputValue.trim(),
      timestamp: new Date(),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputValue("");
    setIsProcessing(true);

    try {
      const response = await fetch(`/api/stories/${story.id}/chat`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: userMessage.content,
          pageNumber: currentPage,
          conversationHistory: messages,
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to process message");
      }

      const data = await response.json();

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: data.response,
        timestamp: new Date(),
      };

      const updatedMessages = [...newMessages, assistantMessage];
      setMessages(updatedMessages);
      saveConversationHistory(updatedMessages);

      // Refresh story if changes were made
      if (data.storyUpdated) {
        console.log("Story was updated, refreshing...");
        // Force immediate refresh
        setTimeout(() => {
          onStoryUpdate();
        }, 500); // Small delay to ensure database write is complete
      } else {
        console.log("No story updates made");
      }
    } catch (error) {
      console.error("Chat error:", error);
      
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "Sorry, I'm having trouble processing your request right now. Please try again.",
        timestamp: new Date(),
      };

      const updatedMessages = [...newMessages, errorMessage];
      setMessages(updatedMessages);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  if (isMinimized) {
    return (
      <div className="fixed bottom-4 right-4 z-50">
        <button
          onClick={() => setIsMinimized(false)}
          className="bg-pink-500 text-white p-3 rounded-full shadow-lg hover:bg-pink-600 transition-colors"
        >
          <MessageCircle className="h-6 w-6" />
        </button>
      </div>
    );
  }

  return (
    <div className="fixed bottom-4 right-4 w-96 h-[500px] bg-white rounded-lg shadow-2xl border z-50 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b bg-gradient-to-r from-pink-500 to-purple-500 text-white rounded-t-lg">
        <div>
          <h3 className="font-semibold">Story Editor</h3>
          <p className="text-sm opacity-90">Page {currentPage}</p>
        </div>
        <div className="flex items-center space-x-2">
          <button
            onClick={() => setIsMinimized(true)}
            className="p-1 hover:bg-white/20 rounded"
          >
            <Minimize2 className="h-4 w-4" />
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-white/20 rounded"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {messages.length === 0 && (
          <div className="text-center text-gray-500 py-8">
            <MessageCircle className="h-8 w-8 mx-auto mb-3 opacity-50" />
            <p className="text-sm">
              Hi! I can help you edit this story. Try saying:
            </p>
            <div className="mt-3 space-y-1 text-xs">
              <p>"Make her hair longer"</p>
              <p>"Change the text to be more exciting"</p>
              <p>"Add a friendly dog to this scene"</p>
            </div>
          </div>
        )}

        {messages.map((message) => (
          <div
            key={message.id}
            className={`flex ${message.role === "user" ? "justify-end" : "justify-start"}`}
          >
            <div
              className={`max-w-[80%] p-3 rounded-lg ${
                message.role === "user"
                  ? "bg-pink-500 text-white"
                  : "bg-gray-100 text-gray-800"
              }`}
            >
              <p className="text-sm">{message.content}</p>
              <p className={`text-xs mt-1 opacity-70`}>
                {(() => {
                  try {
                    const date = message.timestamp instanceof Date 
                      ? message.timestamp 
                      : new Date(message.timestamp);
                    return date.toLocaleTimeString([], {
                      hour: "2-digit",
                      minute: "2-digit",
                    });
                  } catch (e) {
                    return "Just now";
                  }
                })()}
              </p>
            </div>
          </div>
        ))}

        {isProcessing && (
          <div className="flex justify-start">
            <div className="bg-gray-100 p-3 rounded-lg">
              <Loader2 className="h-4 w-4 animate-spin" />
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t">
        <div className="flex space-x-2">
          <textarea
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
            onKeyPress={handleKeyPress}
            placeholder="How would you like to edit this page?"
            className="flex-1 p-2 border border-gray-300 rounded-lg resize-none focus:ring-2 focus:ring-pink-500 focus:border-transparent text-sm"
            rows={2}
            disabled={isProcessing}
          />
          <button
            onClick={handleSendMessage}
            disabled={!inputValue.trim() || isProcessing}
            className="p-2 bg-pink-500 text-white rounded-lg hover:bg-pink-600 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <Send className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}