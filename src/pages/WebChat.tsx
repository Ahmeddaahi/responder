import { useState, useEffect, useRef } from "react";
import { useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Send, Bot, User, Loader2 } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

interface Message {
    id: string;
    role: 'user' | 'assistant';
    content: string;
    created_at: string;
}

const WebChat = () => {
    const { userId } = useParams();
    const [message, setMessage] = useState("");
    const [messages, setMessages] = useState<Message[]>([]);
    const [loading, setLoading] = useState(false);
    const [customerId, setCustomerId] = useState<string>("");
    const [businessName, setBusinessName] = useState<string>("AI Assistant");
    const [widgetColor, setWidgetColor] = useState<string>("#25D366");
    const messagesEndRef = useRef<HTMLDivElement>(null);
    const inputRef = useRef<HTMLInputElement>(null);
    const { toast } = useToast();

    useEffect(() => {
        // Initialize or get customer ID from localStorage
        let id = localStorage.getItem("resbonder_customer_id");
        if (!id) {
            id = `web_${Math.random().toString(36).substring(2, 15)}`;
            localStorage.setItem("resbonder_customer_id", id);
        }
        setCustomerId(id);

        // Load business name
        loadBusinessName();

        // Load message history for this customer if any
        loadHistory(id);
    }, [userId]);

    const loadBusinessName = async () => {
        if (!userId) return;
        try {
            const { data, error } = await supabase
                .from('booking_configurations')
                .select('business_name, widget_color')
                .eq('user_id', userId)
                .maybeSingle();

            if (data?.business_name) {
                setBusinessName(data.business_name);
            }
            if (data?.widget_color) {
                setWidgetColor(data.widget_color);
            }
        } catch (error) {
            console.error("Error loading business name:", error);
        }
    };

    const scrollToBottom = () => {
        messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
    };

    useEffect(() => {
        scrollToBottom();
    }, [messages]);

    useEffect(() => {
        if (!loading) {
            inputRef.current?.focus();
        }
    }, [loading]);

    const loadHistory = async (cId: string) => {
        if (!userId) return;

        try {
            const { data, error } = await supabase
                .from('message_logs')
                .select('*')
                .eq('user_id', userId)
                .eq('customer_id', cId)
                .order('created_at', { ascending: true });

            if (error) throw error;

            if (data) {
                const history: Message[] = [];
                data.forEach(log => {
                    history.push({
                        id: `${log.id}_user`,
                        role: 'user',
                        content: log.message_text,
                        created_at: log.created_at
                    });
                    history.push({
                        id: `${log.id}_bot`,
                        role: 'assistant',
                        content: log.ai_response,
                        created_at: log.created_at
                    });
                });
                setMessages(history);
            }
        } catch (error) {
            console.error("Error loading chat history:", error);
        }
    };

    const sendMessage = async () => {
        if (!message.trim() || !userId || loading) return;

        const userMsg: Message = {
            id: Date.now().toString(),
            role: 'user',
            content: message,
            created_at: new Date().toISOString()
        };

        setMessages(prev => [...prev, userMsg]);
        setMessage("");
        setLoading(true);

        try {
            const { data, error } = await supabase.functions.invoke('ai-chat', {
                body: {
                    userId,
                    message: userMsg.content,
                    platform: 'web',
                    customerId: customerId
                }
            });

            if (error) throw error;

            const botMsg: Message = {
                id: (Date.now() + 1).toString(),
                role: 'assistant',
                content: data.response || "I'm sorry, I couldn't process that.",
                created_at: new Date().toISOString()
            };

            setMessages(prev => [...prev, botMsg]);
        } catch (error: any) {
            toast({
                title: "Error",
                description: "Failed to send message. Please try again.",
                variant: "destructive",
            });
            console.error("Chat error:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="flex flex-col h-screen bg-background border border-border rounded-lg overflow-hidden shadow-xl max-w-md mx-auto">
            {/* Header */}
            <div
                className="p-4 flex items-center gap-3 shrink-0 text-white"
                style={{ backgroundColor: widgetColor }}
            >
                <div className="p-2 bg-white/10 rounded-full">
                    <Bot className="w-5 h-5 text-white" />
                </div>
                <div>
                    <h2 className="font-bold text-sm">{businessName}</h2>
                    <div className="flex items-center gap-1.5 mt-0.5">
                        <div className="w-1.5 h-1.5 rounded-full bg-green-400 animate-pulse" />
                        <span className="text-[10px] opacity-80 uppercase tracking-wider font-semibold">Online</span>
                    </div>
                </div>
            </div>

            {/* Messages */}
            <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-muted/5">
                {messages.length === 0 && (
                    <div className="h-full flex flex-col items-center justify-center text-center p-6 space-y-3">
                        <div className="p-4 bg-primary/5 rounded-full">
                            <Bot className="w-8 h-8 text-primary/40" />
                        </div>
                        <p className="text-sm text-muted-foreground font-medium">How can I help you today?</p>
                    </div>
                )}
                {messages.map((msg) => (
                    <div
                        key={msg.id}
                        className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
                    >
                        <div
                            className={`max-w-[85%] p-3 rounded-2xl text-sm ${msg.role === 'user'
                                ? 'text-white rounded-tr-none shadow-sm'
                                : 'bg-card border border-border rounded-tl-none shadow-sm'
                                }`}
                            style={msg.role === 'user' ? { backgroundColor: widgetColor } : {}}
                        >
                            {msg.content}
                        </div>
                    </div>
                ))}
                {loading && (
                    <div className="flex justify-start">
                        <div className="bg-card border border-border p-3 rounded-2xl rounded-tl-none shadow-sm flex items-center gap-2">
                            <Loader2 className="w-4 h-4 animate-spin" style={{ color: widgetColor }} />
                            <span className="text-xs text-muted-foreground">AI is typing...</span>
                        </div>
                    </div>
                )}
                <div ref={messagesEndRef} />
            </div>

            {/* Input */}
            <div className="p-4 border-t border-border bg-card shrink-0">
                <form
                    className="flex gap-2"
                    onSubmit={(e) => {
                        e.preventDefault();
                        sendMessage();
                    }}
                >
                    <Input
                        ref={inputRef}
                        placeholder="Type your message..."
                        value={message}
                        onChange={(e) => setMessage(e.target.value)}
                        className="flex-1 text-sm bg-muted/30 focus-visible:ring-primary/20"
                        disabled={loading}
                    />
                    <Button
                        type="submit"
                        size="icon"
                        disabled={loading || !message.trim()}
                        className="shrink-0 rounded-full hover:opacity-90 transition-opacity"
                        style={{ backgroundColor: widgetColor }}
                    >
                        <Send className="w-4 h-4 text-white" />
                    </Button>
                </form>
                <div className="mt-2 text-center">
                    <p className="text-[9px] text-muted-foreground">Powered by Resbonder AI</p>
                </div>
            </div>
        </div>
    );
};

export default WebChat;
