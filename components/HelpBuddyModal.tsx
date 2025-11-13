
import React, { useState, useRef, useEffect } from 'react';
import { Icon } from './Icon';
import { ChatMessage } from '../types';
import { apiHelpBuddyChat } from '../services/apiService';

const Spinner: React.FC<{className?: string}> = ({ className = "h-5 w-5 text-white" }) => (
    <svg className={`animate-spin ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

interface HelpBuddyModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const HelpBuddyModal: React.FC<HelpBuddyModalProps> = ({ isOpen, onClose }) => {
    const [messages, setMessages] = useState<ChatMessage[]>([
        { id: '1', role: 'bot', content: "Hi! I'm the Bongo Help Buddy. How can I assist you today? I can answer questions about our menu or help you get a quote for a party." }
    ]);
    const [userInput, setUserInput] = useState('');
    const [isLoading, setIsLoading] = useState(false);
    const messagesEndRef = useRef<HTMLDivElement>(null);

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(scrollToBottom, [messages]);
    
    useEffect(() => {
        if (!isOpen) {
            // Reset state when closed, but keep the initial welcome message
            setMessages([{ id: '1', role: 'bot', content: "Hi! I'm the Bongo Help Buddy. How can I assist you today? I can answer questions about our menu or help you get a quote for a party." }]);
        }
    }, [isOpen]);

    const handleSendMessage = async (e: React.FormEvent) => {
        e.preventDefault();
        const trimmedInput = userInput.trim();
        if (!trimmedInput || isLoading) return;

        const newUserMessage: ChatMessage = { id: self.crypto.randomUUID(), role: 'user', content: trimmedInput };
        setMessages(prev => [...prev, newUserMessage]);
        setUserInput('');
        setIsLoading(true);

        try {
            const history = messages.map(m => ({ role: m.role, parts: m.content }));
            const response = await apiHelpBuddyChat(history, trimmedInput);
            
            // This is where the function call logic would go.
            // For this mock, we just display the text response.
            // In a real scenario, you'd check response.functionCalls and execute them.
            
            const newBotMessage: ChatMessage = { id: self.crypto.randomUUID(), role: 'bot', content: response.parts };
            setMessages(prev => [...prev, newBotMessage]);

        } catch (error) {
            const errorMessage: ChatMessage = {
                id: self.crypto.randomUUID(),
                role: 'bot',
                content: "I'm sorry, I'm having a little trouble connecting right now. Please try again in a moment."
            };
            setMessages(prev => [...prev, errorMessage]);
        } finally {
            setIsLoading(false);
        }
    };
    
    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end justify-center p-4 z-[100] sm:items-center animate-fade-in" onClick={onClose}>
            <div className="bg-gray-800 rounded-lg shadow-xl w-full max-w-lg h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
                <header className="flex justify-between items-center p-4 border-b border-gray-700">
                    <div className="flex items-center gap-3">
                        <Icon type="chef-hat" className="w-6 h-6 text-cyan-400"/>
                        <h2 className="text-xl font-serif text-white">Bongo Help Buddy</h2>
                    </div>
                    <button onClick={onClose} className="text-gray-400 hover:text-white text-2xl">&times;</button>
                </header>
                <main className="flex-1 p-4 overflow-y-auto space-y-4">
                    {messages.map((msg, index) => (
                        <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                            <div className={`max-w-xs md:max-w-md p-3 rounded-lg ${msg.role === 'user' ? 'bg-cyan-600 text-white' : 'bg-gray-700 text-gray-200'}`}>
                                <p className="text-sm">{msg.content}</p>
                            </div>
                        </div>
                    ))}
                    {isLoading && (
                         <div className="flex justify-start">
                             <div className="max-w-xs md:max-w-md p-3 rounded-lg bg-gray-700 text-gray-200">
                                <Spinner className="w-5 h-5 text-cyan-400" />
                             </div>
                         </div>
                    )}
                    <div ref={messagesEndRef} />
                </main>
                <footer className="p-4 border-t border-gray-700">
                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                        <input
                            type="text"
                            value={userInput}
                            onChange={(e) => setUserInput(e.target.value)}
                            placeholder="Ask a question or request a quote..."
                            className="flex-1 w-full bg-gray-700 text-white p-3 rounded-md border border-gray-600 focus:ring-2 focus:ring-cyan-500 focus:outline-none"
                        />
                        <button type="submit" disabled={isLoading} className="bg-cyan-600 text-white p-3 rounded-md hover:bg-cyan-500 disabled:bg-gray-500">
                           <Icon type="send" className="w-6 h-6"/>
                        </button>
                    </form>
                </footer>
            </div>
        </div>
    );
};

export default HelpBuddyModal;
