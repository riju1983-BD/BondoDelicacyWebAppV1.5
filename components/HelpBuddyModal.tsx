import React, { useState, useRef, useEffect } from 'react';
import { Icon } from './Icon';
import { ChatMessage } from '../types';
import { apiHelpBuddyChat, apiSaveHelpBuddyHistory, apiLoadHelpBuddyHistory } from '../services/apiService';

const Spinner: React.FC<{ className?: string }> = ({ className = "h-5 w-5 text-white" }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const TypingIndicator: React.FC = () => (
    <div className="flex space-x-2">
        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '0ms' }}></div>
        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '150ms' }}></div>
        <div className="w-2 h-2 bg-cyan-400 rounded-full animate-bounce" style={{ animationDelay: '300ms' }}></div>
    </div>
);

interface HelpBuddyModalProps {
    isOpen: boolean;
    onClose: () => void;
    restaurantId?: string; // Optional: pass from parent if you want to specify
}

const HelpBuddyModal: React.FC<HelpBuddyModalProps> = ({ isOpen, onClose, restaurantId }) => {
    const INITIAL_MESSAGE: ChatMessage = {
        id: '1',
        role: 'bot',
        content: "Hi! 👋 I'm the Bongo Help Buddy. How can I assist you today? I can answer questions about our menu or help you get a quote for a party.",
        timestamp: new Date().toISOString()
    };

    const [messages, setMessages] = useState<ChatMessage[]>([INITIAL_MESSAGE]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (isOpen) {
            // Load saved history when modal opens
            const savedHistory = apiLoadHelpBuddyHistory();
            if (savedHistory.length > 0) {
                setMessages(savedHistory);
            }
            
            // Focus input when modal opens
            setTimeout(() => inputRef.current?.focus(), 100);
        } else {
            // Save history when modal closes
            if (messages.length > 1) { // Only save if there's actual conversation
                apiSaveHelpBuddyHistory(messages);
            }
        }
    }, [isOpen]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedInput = userInput.trim();

        if (!trimmedInput || isLoading) return;

        // Validate message length
        if (trimmedInput.length > 1000) {
            setError('Message is too long. Please keep it under 1000 characters.');
            return;
        }

        // Clear any previous errors
        setError(null);

        // Add user message to chat
        const newUserMessage: ChatMessage = {
            id: self.crypto.randomUUID(),
            role: 'user',
            content: trimmedInput,
            timestamp: new Date().toISOString()
        };

        setMessages(prev => [...prev, newUserMessage]);
        setUserInput('');
        setIsLoading(true);

        try {
            // Prepare history for API (exclude welcome message and current message)
            const history = messages
                .filter(m => m.id !== '1') // Exclude initial welcome message
                .map(m => ({
                    role: m.role === 'bot' ? 'model' as const : m.role,
                    parts: m.content,
                    content: m.content
                }));

            console.log('📤 Sending message to Help Buddy...');

            // Call API with optional restaurantId from props
            const response = await apiHelpBuddyChat(
                history,
                trimmedInput,
                restaurantId // Pass through if provided
            );

            console.log('📥 Received response from Help Buddy');

            // Add bot response to chat
            const newBotMessage: ChatMessage = {
                id: self.crypto.randomUUID(),
                role: 'bot',
                content: response.parts,
                timestamp: response.metadata.timestamp,
                metadata: {
                    categoriesCount: response.metadata.menuContext.categoriesCount,
                    itemsCount: response.metadata.menuContext.itemsCount,
                    error: response.metadata.menuContext.hasError
                }
            };

            setMessages(prev => [...prev, newBotMessage]);

            // Log menu context info for debugging
            if (response.metadata.menuContext.categoriesCount > 0) {
                console.log('📊 Menu Context:', {
                    categories: response.metadata.menuContext.categoriesCount,
                    items: response.metadata.menuContext.itemsCount
                });
            }

            // Show warning if menu has error
            if (response.metadata.menuContext.hasError) {
                console.warn('⚠️ Menu data has errors');
            }

        } catch (error: any) {
            console.error('❌ Error sending message:', error);

            // Show user-friendly error message
            const errorMessage: ChatMessage = {
                id: self.crypto.randomUUID(),
                role: 'bot',
                content: `I'm sorry, ${error.message || "I'm having trouble connecting right now. Please try again in a moment."} 😔`,
                // timestamp: new Date().toISOString(),
                metadata: { error: true }
            };

            setMessages(prev => [...prev, errorMessage]);
            setError(error.message);

        } finally {
            setIsLoading(false);
            // Refocus input
            setTimeout(() => inputRef.current?.focus(), 100);
        }
    };

    const handleClearChat = () => {
        setMessages([INITIAL_MESSAGE]);
        setError(null);
        localStorage.removeItem('helpBuddyHistory');
    };

    const formatTimestamp = (timestamp?: string) => {
        if (!timestamp) return '';
        const date = new Date(timestamp);
        return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    };

    if (!isOpen) return null;

    return (
        <div
            className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center p-4 z-[100] sm:items-center animate-fade-in"
            onClick={onClose}
        >
            <div
                className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg h-[80vh] flex flex-col"
                onClick={e => e.stopPropagation()}
            >
                {/* Header */}
                <header className="flex justify-between items-center p-4 border-b border-gray-700 bg-gray-900 rounded-t-lg">
                    <div className="flex items-center gap-3">
                        <div className="relative">
                            <Icon type="chef-hat" className="w-6 h-6 text-cyan-400" />
                            <div className="absolute -bottom-1 -right-1 w-3 h-3 bg-green-500 rounded-full border-2 border-gray-900"></div>
                        </div>
                        <div>
                            <h2 className="text-xl font-serif text-white">Bongo Help Buddy</h2>
                            <p className="text-xs text-gray-400">Always here to help</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        {messages.length > 1 && (
                            <button
                                onClick={handleClearChat}
                                className="text-gray-400 hover:text-white text-sm px-2 py-1 rounded hover:bg-gray-700 transition-colors"
                                title="Clear chat"
                            >
                                Clear
                            </button>
                        )}
                        <button
                            onClick={onClose}
                            className="text-gray-400 hover:text-white text-2xl transition-colors"
                            aria-label="Close chat"
                        >
                            &times;
                        </button>
                    </div>
                </header>

                {/* Messages */}
                <main className="flex-1 p-4 overflow-y-auto space-y-4 bg-gray-800">
                    {messages.map((msg) => (
                        <div
                            key={msg.id}
                            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                        >
                            <div
                                className={`max-w-xs md:max-w-md p-3 rounded-lg shadow-md ${
                                    msg.role === 'user'
                                        ? 'bg-cyan-600 text-white rounded-br-none'
                                        : msg.metadata?.error
                                        ? 'bg-red-900 text-red-100 rounded-bl-none'
                                        : 'bg-gray-700 text-gray-200 rounded-bl-none'
                                }`}
                            >
                                <p className="text-sm whitespace-pre-wrap break-words">{msg.content}</p>
                                <span className="text-xs opacity-70 mt-1 block">
                                    {formatTimestamp(msg.timestamp)}
                                </span>
                            </div>
                        </div>
                    ))}

                    {/* Loading Indicator */}
                    {isLoading && (
                        <div className="flex justify-start">
                            <div className="max-w-xs md:max-w-md p-3 rounded-lg bg-gray-700 text-gray-200">
                                <TypingIndicator />
                            </div>
                        </div>
                    )}

                    {/* Error Display */}
                    {error && !isLoading && (
                        <div className="flex justify-center">
                            <div className="bg-red-900 text-red-200 px-4 py-2 rounded-md text-sm max-w-md text-center">
                                ⚠️ {error}
                            </div>
                        </div>
                    )}

                    <div ref={messagesEndRef} />
                </main>

                {/* Input Footer */}
                <footer className="p-4 border-t border-gray-700 bg-gray-900 rounded-b-lg">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                        <input
                            ref={inputRef}
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            placeholder="Ask about menu, parties, or anything else..."
                            className="flex-1 w-full bg-gray-700 text-white p-3 rounded-md border border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none transition-all"
                            maxLength={1000}
                            disabled={isLoading}
                        />
                        <button
                            type="submit"
                            disabled={isLoading || !userInput.trim()}
                            className="bg-cyan-600 text-white p-3 rounded-md hover:bg-cyan-500 disabled:bg-gray-600 disabled:cursor-not-allowed transition-colors"
                            aria-label="Send message"
                        >
                            {isLoading ? (
                                <Spinner className="w-6 h-6" />
                            ) : (
                                <Icon type="send" className="w-6 h-6" />
                            )}
                        </button>
                    </form>
                    <p className="text-xs text-gray-500 mt-2 text-center">
                        Powered by AI • {userInput.length}/1000 characters
                    </p>
                </footer>
            </div>
        </div>
    );
};

export default HelpBuddyModal;