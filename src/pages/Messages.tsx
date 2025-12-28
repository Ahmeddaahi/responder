import { useEffect, useState, useMemo, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  MessageSquare,
  User,
  Bot,
  Trash2,
  MoreVertical,
  Search,
  ArrowLeft,
  CheckCheck,
  Ban,
  Send,
  Zap
} from "lucide-react";
import { ScrollArea } from "@/components/ui/scroll-area";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import QuickReplies from "@/components/QuickReplies";
import AppLayout from "@/components/AppLayout";
import { TableSkeleton } from "@/components/ui/custom-skeletons";
import type { User as AuthUser } from "@supabase/supabase-js";

interface Message {
  id: string;
  user_id: string;
  customer_id: string | null;
  message_text: string;
  ai_response: string;
  created_at: string | null;
  platform: string;
}

interface CustomerConversation {
  customerId: string;
  messages: Message[];
  platform: string;
  lastMessageTime: string | null;
  isBlocked?: boolean;
  mode: 'bot' | 'human';
}

// Format phone number for display
const formatPhoneNumber = (phone: string): string => {
  const cleaned = phone.replace(/[^\d+]/g, '');

  if (cleaned.startsWith('+')) {
    if (cleaned.length === 12 && cleaned.startsWith('+1')) {
      const number = cleaned.slice(2);
      return `+1 (${number.slice(0, 3)}) ${number.slice(3, 6)}-${number.slice(6)}`;
    }
    if (cleaned.length > 6) {
      return cleaned.replace(/(\+\d{1,3})(\d{3})(\d{3})(\d+)/, '$1 $2 $3 $4');
    }
    return cleaned;
  }

  if (cleaned.length === 10) {
    return `(${cleaned.slice(0, 3)}) ${cleaned.slice(3, 6)}-${cleaned.slice(6)}`;
  }

  return phone;
};

// Format customer ID for display
const formatCustomerId = (customerId: string | null, platform: string): string => {
  if (!customerId) return 'Unknown Customer';

  if (platform === 'whatsapp' || /^\+?\d+$/.test(customerId)) {
    return formatPhoneNumber(customerId);
  }

  return customerId;
};

// Format time for message bubbles
const formatMessageTime = (dateString: string | null) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
};

// Format date for conversation list
const formatConversationDate = (dateString: string | null) => {
  if (!dateString) return '';
  const date = new Date(dateString);
  const now = new Date();
  const diff = now.getTime() - date.getTime();
  const days = Math.floor(diff / (1000 * 60 * 60 * 24));

  if (days === 0) return formatMessageTime(dateString);
  if (days === 1) return 'Yesterday';
  if (days < 7) return date.toLocaleDateString([], { weekday: 'long' });
  return date.toLocaleDateString();
};

// Clean AI response by removing JSON content
const cleanAiResponse = (response: string): string => {
  if (!response) return '';

  // Remove everything after <|BOOKING_JSON|> marker (including the marker itself)
  const bookingJsonIndex = response.indexOf('<|BOOKING_JSON|>');
  if (bookingJsonIndex !== -1) {
    response = response.substring(0, bookingJsonIndex);
  }

  // Also remove any standalone JSON objects and arrays
  let cleaned = response
    // Remove JSON objects: {...}
    .replace(/\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g, '')
    // Remove JSON arrays: [...]
    .replace(/\[[^\[\]]*(?:\[[^\[\]]*\][^\[\]]*)*\]/g, '')
    // Remove extra whitespace and newlines
    .replace(/\s+/g, ' ')
    .trim();

  return cleaned || response; // Return original if cleaning results in empty string
};

const Messages = () => {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [plan, setPlan] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [deleteMessageId, setDeleteMessageId] = useState<string | null>(null);
  const [deleteCustomerId, setDeleteCustomerId] = useState<string | null>(null);
  const [blockCustomerId, setBlockCustomerId] = useState<string | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isBlocking, setIsBlocking] = useState(false);
  const [isSending, setIsSending] = useState(false);
  const [messageInput, setMessageInput] = useState("");
  const [blockedUsers, setBlockedUsers] = useState<Set<string>>(new Set());
  const [conversationModes, setConversationModes] = useState<Record<string, 'bot' | 'human'>>({});
  const [searchQuery, setSearchQuery] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
  }, []);



  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);

    if (!session) {
      navigate("/auth");
      return;
    }

    loadMessages(session.user.id);
    loadUserPlan(session.user.id);
  };

  const loadUserPlan = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('plan')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        setPlan(data.plan);
      }
    } catch (error) {
      console.error('Error loading plan:', error);
    }
  };

  const loadMessages = async (userId: string) => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('message_logs')
        .select('*')
        .eq('user_id', userId)
        .order('created_at', { ascending: false });

      if (error) throw error;
      console.log('Loaded messages from DB:', data?.length || 0);
      setMessages(data || []);

      // Load conversation modes
      const { data: modes, error: modesError } = await supabase
        .from('conversation_control')
        .select('customer_id, mode')
        .eq('user_id', userId);

      if (!modesError && modes) {
        const modeMap = modes.reduce((acc, curr) => {
          acc[curr.customer_id] = curr.mode;
          return acc;
        }, {} as Record<string, 'bot' | 'human'>);
        setConversationModes(modeMap);
      }

      // Also load blocked users
      await loadBlockedUsers();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const loadBlockedUsers = async () => {
    try {
      const { data, error } = await supabase
        .from('blocked_users')
        .select('user_identifier, platform');

      if (error) throw error;

      // Create a set of blocked user identifiers (customerId)
      const blocked = new Set<string>(data?.map(b => b.user_identifier) || []);
      setBlockedUsers(blocked);
    } catch (error: any) {
      console.error('Error loading blocked users:', error);
    }
  };

  // Set up real-time subscription for new messages
  useEffect(() => {
    if (!user) return;

    console.log('Attempting real-time subscription for user:', user.id);

    const channel = supabase
      .channel(`message_logs_${user.id}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'message_logs',
          filter: `user_id=eq.${user.id}`,
        },
        (payload) => {
          console.log('🔔 Real-time message update received:', payload);
          // Reload messages when any change occurs
          loadMessages(user.id);
        }
      )
      .subscribe((status) => {
        console.log('📡 Real-time subscription status:', status);
      });

    return () => {
      console.log('Cleaning up real-time subscription');
      supabase.removeChannel(channel);
    };
  }, [user]);

  const deleteMessage = async (messageId: string) => {
    if (!user) return;
    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('message_logs')
        .delete()
        .eq('id', messageId)
        .eq('user_id', user.id);

      if (error) throw error;
      await loadMessages(user.id);
      toast({ title: "Success", description: "Message deleted successfully" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete message",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteMessageId(null);
    }
  };

  const deleteCustomerConversation = async (customerId: string) => {
    if (!user) return;
    try {
      setIsDeleting(true);
      const { error } = await supabase
        .from('message_logs')
        .delete()
        .eq('customer_id', customerId)
        .eq('user_id', user.id);

      if (error) throw error;
      await loadMessages(user.id);
      if (selectedConversation === customerId) setSelectedConversation(null);
      toast({ title: "Success", description: "Conversation deleted successfully" });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to delete conversation",
        variant: "destructive",
      });
    } finally {
      setIsDeleting(false);
      setDeleteCustomerId(null);
    }
  };

  const blockCustomer = async (customerId: string) => {
    if (!user) return;
    try {
      setIsBlocking(true);

      // Get the platform for this customer
      const conversation = conversations.find(c => c.customerId === customerId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Insert into blocked_users table
      const { error } = await supabase
        .from('blocked_users')
        .insert({
          user_identifier: customerId,
          platform: conversation.platform,
          reason: 'Blocked by admin from Messages page',
        });

      if (error) {
        // If already blocked (unique constraint violation), that's okay
        if (error.code !== '23505') {
          throw error;
        }
      }

      // Reload blocked users list
      await loadBlockedUsers();

      toast({
        title: "Success",
        description: "Customer blocked successfully. The AI will not respond to their messages."
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to block customer",
        variant: "destructive",
      });
    } finally {
      setIsBlocking(false);
      setBlockCustomerId(null);
    }
  };

  const unblockCustomer = async (customerId: string) => {
    if (!user) return;
    try {
      setIsBlocking(true);

      // Get the platform for this customer
      const conversation = conversations.find(c => c.customerId === customerId);
      if (!conversation) {
        throw new Error('Conversation not found');
      }

      // Delete from blocked_users table
      const { error } = await supabase
        .from('blocked_users')
        .delete()
        .eq('user_identifier', customerId)
        .eq('platform', conversation.platform);

      if (error) throw error;

      // Reload blocked users list
      await loadBlockedUsers();

      toast({
        title: "Success",
        description: "Customer unblocked successfully. The AI will now respond to their messages."
      });
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to unblock customer",
        variant: "destructive",
      });
    } finally {
      setIsBlocking(false);
      setBlockCustomerId(null);
    }
  };


  const handleSendMessage = async () => {
    if (!user || !selectedConversation || !messageInput.trim() || isSending) return;

    const canSend = plan !== 'free';
    if (!canSend) {
      navigate("/pricing");
      return;
    }

    try {
      setIsSending(true);
      const conversation = conversations.find(c => c.customerId === selectedConversation);
      if (!conversation) throw new Error("Conversation not found");

      const { data: { session } } = await supabase.auth.getSession();

      const { data, error } = await supabase.functions.invoke('send-manual-message', {
        headers: {
          Authorization: `Bearer ${session?.access_token}`,
        },
        body: {
          customerId: selectedConversation,
          message: messageInput.trim(),
          platform: conversation.platform
        }
      });

      if (error) throw error;

      // Update local mode state as well since backend auto-switches to human
      setConversationModes(prev => ({
        ...prev,
        [selectedConversation]: 'human'
      }));

      setMessageInput("");
      toast({
        title: "Success",
        description: "Message sent safely",
      });

      // Manually reload messages for instant feedback
      console.log('Manually reloading messages after send...');
      await loadMessages(user.id);
    } catch (error: any) {
      console.error('Error sending message:', error);
      toast({
        title: "Error",
        description: error.message || "Failed to send message",
        variant: "destructive",
      });
    } finally {
      setIsSending(false);
    }
  };

  const toggleConversationMode = async (customerId: string, currentMode: 'bot' | 'human') => {
    if (!user) return;
    const newMode = currentMode === 'bot' ? 'human' : 'bot';

    try {
      console.log(`Switching mode for ${customerId} to ${newMode}`);
      const { error } = await supabase
        .from('conversation_control')
        .upsert({
          user_id: user.id,
          customer_id: customerId,
          platform: 'whatsapp',
          mode: newMode,
          updated_at: new Date().toISOString()
        }, {
          onConflict: 'user_id,customer_id,platform'
        });

      if (error) throw error;

      setConversationModes(prev => ({
        ...prev,
        [customerId]: newMode
      }));

      toast({
        title: "Mode Updated",
        description: `Conversation is now in ${newMode} mode`,
      });
    } catch (error: any) {
      console.error('Error toggling mode:', error);
      toast({
        title: "Error",
        description: "Failed to update conversation mode",
        variant: "destructive"
      });
    }
  };


  const conversations: CustomerConversation[] = useMemo(() => {
    return Object.entries(
      messages.reduce((acc, msg) => {
        if (!msg.customer_id) return acc;
        if (!acc[msg.customer_id]) acc[msg.customer_id] = [];
        acc[msg.customer_id].push(msg);
        return acc;
      }, {} as Record<string, Message[]>)
    )
      .map(([customerId, msgs]) => {
        const sortedMessages = [...msgs].sort((a, b) => {
          const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
          const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
          return timeB - timeA;
        });
        return {
          customerId,
          messages: sortedMessages,
          platform: msgs[0].platform,
          lastMessageTime: sortedMessages[0]?.created_at || null,
          isBlocked: blockedUsers.has(customerId),
          mode: conversationModes[customerId] || 'bot',
        };
      })
      .sort((a, b) => {
        const timeA = a.lastMessageTime ? new Date(a.lastMessageTime).getTime() : 0;
        const timeB = b.lastMessageTime ? new Date(b.lastMessageTime).getTime() : 0;
        return timeB - timeA;
      });
  }, [messages, blockedUsers, conversationModes]);

  const filteredConversations = useMemo(() => {
    if (!searchQuery) return conversations;
    return conversations.filter(conv =>
      formatCustomerId(conv.customerId, conv.platform).toLowerCase().includes(searchQuery.toLowerCase()) ||
      conv.messages.some(m => m.message_text?.toLowerCase().includes(searchQuery.toLowerCase()) || m.ai_response?.toLowerCase().includes(searchQuery.toLowerCase()))
    );
  }, [conversations, searchQuery]);

  const selectedMessages = useMemo(() => {
    const conv = conversations.find(c => c.customerId === selectedConversation);
    if (!conv) return [];

    console.log(`Rendering ${conv.messages.length} messages for ${selectedConversation}`);

    // Use spread to avoid mutating the original array
    const sorted = [...conv.messages].sort((a, b) => {
      const timeA = a.created_at ? new Date(a.created_at).getTime() : 0;
      const timeB = b.created_at ? new Date(b.created_at).getTime() : 0;
      return timeA - timeB;
    });

    console.log('Sorted messages (oldest first):', sorted.map(m => ({ id: m.id, text: m.message_text, ai: m.ai_response, time: m.created_at })));
    return sorted;
  }, [conversations, selectedConversation]);


  // Handle deep linking to specific chat
  useEffect(() => {
    const chatParam = searchParams.get('chat');
    if (chatParam && conversations.length > 0) {
      const targetConversation = conversations.find(c => c.customerId === chatParam);
      if (targetConversation) {
        setSelectedConversation(chatParam);
      }
    }
  }, [conversations, searchParams]);

  // Auto-scroll to bottom when messages change or conversation is selected
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [selectedMessages, selectedConversation]);

  if (loading) {
    return (
      <AppLayout>
        <div className="h-[calc(100dvh-5rem)] md:h-[calc(100vh-3.5rem)] flex flex-col md:flex-row gap-4 p-4">
          <div className="w-full md:w-[350px] lg:w-[400px]">
            <TableSkeleton />
          </div>
          <div className="hidden md:flex flex-1 border rounded-lg p-6">
            <div className="space-y-4 w-full">
              <div className="w-1/2 h-8 bg-muted rounded-md animate-pulse mb-4"></div>
              <div className="space-y-3">
                <div className="h-16 bg-muted rounded-md animate-pulse"></div>
                <div className="h-16 bg-muted rounded-md animate-pulse w-3/4 ml-auto"></div>
                <div className="h-16 bg-muted rounded-md animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="h-[calc(100dvh-5rem)] md:h-[calc(100vh-3.5rem)] flex flex-col md:flex-row bg-[hsl(var(--whatsapp-chat-bg))] overflow-hidden rounded-lg border border-border shadow-sm">
        {/* Sidebar - User List */}
        <div className={`${selectedConversation ? 'hidden md:flex' : 'flex'} w-full md:w-[350px] lg:w-[400px] flex-col border-r border-border bg-[hsl(var(--whatsapp-sidebar))] min-h-0`}>
          {/* Sidebar Header */}
          <div className="p-3 sm:p-4 border-b border-border flex justify-between items-center bg-[hsl(var(--whatsapp-sidebar))]">
            <h2 className="text-base sm:text-lg md:text-xl font-bold">Chats</h2>
            <div className="flex gap-2">
              <Button variant="ghost" size="icon" className="text-muted-foreground h-8 w-8">
                <MoreVertical className="h-4 w-4" />
              </Button>
            </div>
          </div>

          {/* Search Bar */}
          <div className="p-3 border-b border-border">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-3.5 w-3.5 text-muted-foreground" />
              <Input
                placeholder="Search..."
                className="pl-9 h-9 bg-muted/50 border-none focus-visible:ring-1 text-sm"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
            </div>
          </div>

          {/* Conversation List */}
          <ScrollArea className="flex-1">
            {filteredConversations.length === 0 ? (
              <div className="p-8 text-center text-muted-foreground">
                <p>No conversations found</p>
              </div>
            ) : (
              <div className="flex flex-col">
                {filteredConversations.map((conv) => {
                  const displayName = formatCustomerId(conv.customerId, conv.platform);
                  const lastMsg = conv.messages[0];
                  const isSelected = selectedConversation === conv.customerId;

                  return (
                    <div
                      key={conv.customerId}
                      onClick={() => setSelectedConversation(conv.customerId)}
                      className={`flex items-center gap-2 sm:gap-3 p-2 sm:p-3 cursor-pointer transition-colors hover:bg-muted/50 ${isSelected ? 'bg-muted' : ''
                        }`}
                    >
                      <div className="relative flex-shrink-0">
                        <div className="w-10 h-10 sm:w-12 sm:h-12 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-base sm:text-lg">
                          {displayName.charAt(0).toUpperCase()}
                        </div>
                        <div className={`absolute bottom-0 right-0 w-2.5 h-2.5 sm:w-3 sm:h-3 rounded-full border border-background ${conv.platform === 'whatsapp' ? 'bg-green-500' : 'bg-blue-500'
                          }`} />
                      </div>

                      <div className="flex-1 min-w-0 border-b border-border/50 pb-2 sm:pb-3">
                        <div className="flex justify-between items-baseline mb-1">
                          <div className="flex items-center gap-1 sm:gap-2 min-w-0">
                            <h3 className="font-medium truncate text-foreground text-sm">{displayName}</h3>
                            {conv.isBlocked && (
                              <Badge variant="destructive" className="text-[9px] sm:text-xs px-1.5 py-0.5">
                                <Ban className="w-2.5 h-2.5 mr-0.5" />
                                Blocked
                              </Badge>
                            )}
                          </div>
                          <span className="text-[10px] sm:text-xs text-muted-foreground flex-shrink-0 ml-1 sm:ml-2">
                            {formatConversationDate(conv.lastMessageTime)}
                          </span>
                        </div>
                        <div className="flex justify-between items-center">
                          <p className="text-xs text-muted-foreground truncate pr-2">
                            {lastMsg?.ai_response
                              ? `You: ${cleanAiResponse(lastMsg.ai_response).substring(0, 60)}${cleanAiResponse(lastMsg.ai_response).length > 60 ? '...' : ''}`
                              : lastMsg?.message_text?.substring(0, 60) + (lastMsg?.message_text && lastMsg.message_text.length > 60 ? '...' : '') || 'No text'}
                          </p>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className={`${!selectedConversation ? 'hidden md:flex' : 'flex'} flex-1 flex-col min-w-0 bg-[hsl(var(--whatsapp-chat-bg))] min-h-0`}>
          {selectedConversation ? (
            <>
              {/* Chat Header */}
              <div className="h-[56px] sm:h-[60px] px-3 sm:px-4 border-b border-border bg-[hsl(var(--whatsapp-sidebar))] flex items-center justify-between flex-shrink-0 z-10">
                <div className="flex items-center gap-2 sm:gap-3">
                  <Button
                    variant="ghost"
                    size="icon"
                    className="md:hidden mr-1"
                    onClick={() => setSelectedConversation(null)}
                  >
                    <ArrowLeft className="h-5 w-5" />
                  </Button>

                  <div className="w-8 h-8 sm:w-10 sm:h-10 rounded-full bg-primary/10 flex items-center justify-center text-primary font-semibold text-sm">
                    {formatCustomerId(selectedConversation, conversations.find(c => c.customerId === selectedConversation)?.platform || '').charAt(0).toUpperCase()}
                  </div>

                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1 sm:gap-2">
                      <span className="font-semibold text-sm truncate max-w-[100px] sm:max-w-[150px] md:max-w-[200px]">
                        {formatCustomerId(selectedConversation, conversations.find(c => c.customerId === selectedConversation)?.platform || '')}
                      </span>
                      {conversations.find(c => c.customerId === selectedConversation)?.isBlocked && (
                        <Badge variant="destructive" className="text-[10px] px-1.5 py-0.5">
                          <Ban className="w-2.5 h-2.5 mr-0.5" />
                          Blocked
                        </Badge>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] sm:text-xs text-muted-foreground truncate">
                        via {conversations.find(c => c.customerId === selectedConversation)?.platform}
                      </span>
                      {conversations.find(c => c.customerId === selectedConversation)?.mode === 'human' ? (
                        <Badge variant="secondary" className="text-[9px] px-1 py-0 bg-orange-100 text-orange-700 hover:bg-orange-100 border-orange-200">
                          <User className="w-2 h-2 mr-0.5" />
                          Human Mode active
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="text-[9px] px-1 py-0 bg-blue-100 text-blue-700 hover:bg-blue-100 border-blue-200">
                          <Bot className="w-2 h-2 mr-0.5" />
                          Bot Mode active
                        </Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex items-center gap-1 sm:gap-2">
                  {plan !== 'free' && (
                    <>
                      {conversations.find(c => c.customerId === selectedConversation)?.mode === 'human' ? (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1 border-blue-200 text-blue-600 hover:bg-blue-100"
                          onClick={() => toggleConversationMode(selectedConversation, 'human')}
                        >
                          <Bot className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Return to Bot</span>
                        </Button>
                      ) : (
                        <Button
                          variant="outline"
                          size="sm"
                          className="h-8 text-xs gap-1 border-orange-200 text-orange-600 hover:bg-orange-50"
                          onClick={() => toggleConversationMode(selectedConversation, 'bot')}
                        >
                          <User className="w-3.5 h-3.5" />
                          <span className="hidden sm:inline">Take Over</span>
                        </Button>
                      )}
                    </>
                  )}

                  <DropdownMenu>
                    <DropdownMenuTrigger asChild>
                      <Button variant="ghost" size="icon">
                        <MoreVertical className="h-5 w-5 text-muted-foreground" />
                      </Button>
                    </DropdownMenuTrigger>
                    <DropdownMenuContent align="end">
                      {conversations.find(c => c.customerId === selectedConversation)?.isBlocked ? (
                        <DropdownMenuItem
                          onClick={() => setBlockCustomerId(selectedConversation)}
                        >
                          <Ban className="mr-2 h-4 w-4" />
                          Unblock customer
                        </DropdownMenuItem>
                      ) : (
                        <DropdownMenuItem
                          onClick={() => setBlockCustomerId(selectedConversation)}
                        >
                          <Ban className="mr-2 h-4 w-4" />
                          Block customer
                        </DropdownMenuItem>
                      )}
                      <DropdownMenuItem
                        className="text-destructive focus:text-destructive"
                        onClick={() => setDeleteCustomerId(selectedConversation)}
                      >
                        <Trash2 className="mr-2 h-4 w-4" />
                        Delete chat
                      </DropdownMenuItem>
                    </DropdownMenuContent>
                  </DropdownMenu>
                </div>
              </div>

              {/* Messages List */}
              <div className="flex-1 overflow-y-auto p-4 bg-[hsl(var(--whatsapp-chat-bg))]">
                <div className="space-y-4 sm:space-y-6 max-w-3xl mx-auto">
                  {selectedMessages.map((msg, index) => {
                    const showDate = index === 0 ||
                      new Date(msg.created_at || '').toDateString() !==
                      new Date(selectedMessages[index - 1].created_at || '').toDateString();

                    return (
                      <div key={msg.id} className="flex flex-col gap-4">
                        {showDate && (
                          <div className="flex justify-center my-4">
                            <span className="bg-muted/60 text-muted-foreground text-xs px-3 py-1 rounded-lg shadow-sm">
                              {new Date(msg.created_at || '').toLocaleDateString(undefined, {
                                weekday: 'long',
                                year: 'numeric',
                                month: 'long',
                                day: 'numeric'
                              })}
                            </span>
                          </div>
                        )}

                        {/* Customer Message (Received) */}
                        {msg.message_text && msg.message_text !== "[Manual Reply]" && (
                          <div className="flex flex-col items-start gap-1">
                            <div className="flex items-center gap-2 ml-1">
                              <User className="w-2.5 h-2.5 text-muted-foreground" />
                              <span className="text-[10px] text-muted-foreground">Customer</span>
                            </div>
                            <div className="flex justify-start group w-full">
                              <div className="max-w-[90%] sm:max-w-[75%] md:max-w-[70%] bg-[hsl(var(--whatsapp-received))] rounded-lg rounded-tl-none p-2 sm:p-3 shadow-sm relative">
                                <p className="text-[13px] sm:text-sm whitespace-pre-wrap break-words pr-8 sm:pr-12 pb-1 text-foreground">
                                  {msg.message_text}
                                </p>
                                <span className="text-[9px] sm:text-[10px] text-muted-foreground absolute bottom-1 right-2">
                                  {formatMessageTime(msg.created_at)}
                                </span>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="absolute -right-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 hidden sm:block"
                                  onClick={() => setDeleteMessageId(msg.id)}
                                >
                                  <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}

                        {/* AI Response (Sent) */}
                        {msg.ai_response && (
                          <div className="flex flex-col items-end gap-1">
                            <div className="flex items-center gap-2 mr-1">
                              <span className="text-[10px] text-muted-foreground">AI Assistant</span>
                              <div className="w-3.5 h-3.5 rounded-full bg-primary/10 flex items-center justify-center">
                                <Bot className="w-2.5 h-2.5 text-primary" />
                              </div>
                            </div>
                            <div className="flex justify-end group w-full">
                              <div className="max-w-[90%] sm:max-w-[75%] md:max-w-[70%] bg-[hsl(var(--whatsapp-sent))] rounded-lg rounded-tr-none p-2 sm:p-3 shadow-sm relative">
                                <p className="text-[13px] sm:text-sm whitespace-pre-wrap break-words pr-8 sm:pr-16 pb-1 text-foreground">
                                  {cleanAiResponse(msg.ai_response)}
                                </p>
                                <div className="absolute bottom-1 right-2 flex items-center gap-1">
                                  <span className="text-[9px] sm:text-[10px] text-muted-foreground/80">
                                    {formatMessageTime(msg.created_at)}
                                  </span>
                                  <CheckCheck className="h-3 w-3 text-blue-500" />
                                </div>
                                <Button
                                  variant="ghost"
                                  size="icon"
                                  className="absolute -left-8 top-0 opacity-0 group-hover:opacity-100 transition-opacity h-6 w-6 hidden sm:block"
                                  onClick={() => setDeleteMessageId(msg.id)}
                                >
                                  <Trash2 className="h-3 w-3 text-muted-foreground hover:text-destructive" />
                                </Button>
                              </div>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                  <div ref={messagesEndRef} />
                </div>

                {selectedMessages.length === 0 && (
                  <div className="h-full flex flex-col items-center justify-center text-muted-foreground opacity-50">
                    <MessageSquare className="h-12 w-12 mb-2" />
                    <p>No messages in this conversation</p>
                  </div>
                )}
              </div>

              {/* Message Input Area */}
              <div className="p-3 sm:p-4 bg-[hsl(var(--whatsapp-sidebar))] border-t border-border mt-auto">
                <div className="flex items-center gap-1 sm:gap-2 bg-background rounded-lg border border-border px-2 sm:px-3 py-2">
                  <QuickReplies onSelect={(text) => {
                    setMessageInput(text);
                  }} />
                  <Input
                    id="message-input"
                    placeholder={plan !== 'free' ? "Type a message..." : "Pro Plan feature..."}
                    className="flex-1 border-none focus-visible:ring-0 px-0 text-sm"
                    disabled={plan === 'free'}
                    value={messageInput}
                    onChange={(e) => setMessageInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") {
                        handleSendMessage();
                      }
                    }}
                  />
                  <Button
                    size="icon"
                    className="h-8 w-8 shrink-0"
                    onClick={handleSendMessage}
                    disabled={isSending}
                  >
                    {plan !== 'free' ? (
                      isSending ? <div className="h-4 w-4 animate-spin rounded-full border-2 border-background border-t-transparent" /> : <Send className="h-4 w-4" />
                    ) : (
                      <Zap className="h-4 w-4 text-amber-500" />
                    )}
                  </Button>
                </div>
                {plan === 'free' && (
                  <p className="text-[10px] text-muted-foreground mt-2 text-center flex items-center justify-center gap-1">
                    <Zap className="h-2 w-2 text-amber-500" />
                    Manual replies are a Pro Plan feature.
                    <button
                      onClick={() => navigate("/pricing")}
                      className="text-primary font-bold hover:underline ml-1"
                    >
                      Upgrade Now
                    </button>
                  </p>
                )}
              </div>
            </>
          ) : (
            /* Empty State */
            <div className="flex-1 flex flex-col items-center justify-center bg-[hsl(var(--whatsapp-chat-bg))] border-l border-border text-center p-4 sm:p-8">
              <div className="w-32 h-32 sm:w-48 sm:h-48 bg-muted/30 rounded-full flex items-center justify-center mb-4 sm:mb-6">
                <Bot className="w-16 h-16 sm:w-24 sm:h-24 text-muted-foreground/20" />
              </div>
              <h2 className="text-lg sm:text-xl md:text-2xl font-light text-foreground mb-2">ReplyReady Bot</h2>
              <p className="text-xs sm:text-sm text-muted-foreground max-w-xs sm:max-w-md px-2 sm:px-4">
                Select a conversation from the sidebar to view message history and AI responses.
              </p>
              <div className="mt-4 sm:mt-6 flex items-center gap-2 text-xs text-muted-foreground">
                <div className="w-2 h-2 sm:w-3 sm:h-3 rounded-full bg-green-500"></div>
                <span>WhatsApp</span>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Delete Message Dialog */}
      <AlertDialog open={!!deleteMessageId} onOpenChange={(open) => !open && setDeleteMessageId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Message</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this message? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteMessageId && deleteMessage(deleteMessageId)}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Delete Conversation Dialog */}
      <AlertDialog open={!!deleteCustomerId} onOpenChange={(open) => !open && setDeleteCustomerId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Conversation</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete this entire conversation? All messages will be permanently removed.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => deleteCustomerId && deleteCustomerConversation(deleteCustomerId)}
              disabled={isDeleting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isDeleting ? "Deleting..." : "Delete"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Block/Unblock Customer Dialog */}
      <AlertDialog open={!!blockCustomerId} onOpenChange={(open) => !open && setBlockCustomerId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {conversations.find(c => c.customerId === blockCustomerId)?.isBlocked ? "Unblock Customer" : "Block Customer"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {conversations.find(c => c.customerId === blockCustomerId)?.isBlocked
                ? "Are you sure you want to unblock this customer? The AI will resume responding to their messages."
                : "Are you sure you want to block this customer? The AI will not respond to any of their messages."
              }
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isBlocking}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => {
                if (!blockCustomerId) return;
                const isCurrentlyBlocked = conversations.find(c => c.customerId === blockCustomerId)?.isBlocked;
                if (isCurrentlyBlocked) {
                  unblockCustomer(blockCustomerId);
                } else {
                  blockCustomer(blockCustomerId);
                }
              }}
              disabled={isBlocking}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {isBlocking
                ? (conversations.find(c => c.customerId === blockCustomerId)?.isBlocked ? "Unblocking..." : "Blocking...")
                : (conversations.find(c => c.customerId === blockCustomerId)?.isBlocked ? "Unblock Customer" : "Block Customer")
              }
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  );
};

export default Messages;
