import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
  Bot,
  MessageSquare,
  Check,
  ArrowRight,
  Phone,
  Send,
  Clock,
  AlertCircle,
  Settings,
  Calendar,
  Zap,
  TrendingUp
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import type { User } from "@supabase/supabase-js";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

type Plan = 'free' | 'starter' | 'enterprise' | 'custom';

interface Subscription {
  plan: Plan;
  platform: string | null;
  messages_used: number;
  message_limit: number;
  bookings_used: number;
  bookings_limit: number;
  is_active: boolean;
  started_at: string | null;
  last_upgrade_popup_shown?: string | null;
}

interface Agent {
  platform: string;
  is_active: boolean;
}

interface PendingPayment {
  id: string;
  requested_plan: string;
  created_at: string;
}

interface BookingConfigSummary {
  business_type: string;
  is_active: boolean | null;
  updated_at: string | null;
}

interface Booking {
  id: string;
  customer_name: string | null;
  customer_id: string;
  customer_phone: string | null;
  customer_email: string | null;
  booking_type: string;
  status: string;
  platform: string;
  check_in_date: string | null;
  check_out_date: string | null;
  room_type: string | null;
  number_of_guests: number | null;
  reservation_date: string | null;
  reservation_time: string | null;
  number_of_people: number | null;
  table_preference: string | null;
  appointment_date: string | null;
  appointment_time: string | null;
  department: string | null;
  doctor_name: string | null;
  reason_for_visit: string | null;
  notes: string | null;
  created_at: string | null;
}

const Dashboard = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [agents, setAgents] = useState<Agent[]>([]);
  const [showUpgradePopup, setShowUpgradePopup] = useState(false);
  const [pendingPayments, setPendingPayments] = useState<PendingPayment[]>([]);
  const [bookingConfig, setBookingConfig] = useState<BookingConfigSummary | null>(null);
  const [bookings, setBookings] = useState<Booking[]>([]);
  const [totalMessages, setTotalMessages] = useState(0);
  const [weeklyBookingsCount, setWeeklyBookingsCount] = useState(0);
  const [conversionRate, setConversionRate] = useState(0);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (!session) {
        navigate("/auth");
      }
    });

    return () => subscription.unsubscribe();
  }, [navigate]);

  useEffect(() => {
    if (user) {
      loadDashboardData();
    }
  }, [user]);

  const loadDashboardData = async () => {
    setIsRefreshing(true);
    await Promise.all([
      loadSubscription(),
      loadAgents(),
      loadPendingPayments(),
      loadBookingConfig(),
      loadRecentBookings(),
      loadMetrics(),
    ]);
    setIsRefreshing(false);
  };

  const loadMetrics = async () => {
    if (!user) return;

    try {
      // Get total messages count
      const { count: msgCount, error: msgError } = await supabase
        .from('message_logs')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id);

      if (!msgError) {
        setTotalMessages(msgCount || 0);
      }

      // Get weekly bookings count (all platforms, last 7 days)
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);

      const { count: bCount, error: bError } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .gte('created_at', sevenDaysAgo.toISOString());

      if (!bError) {
        setWeeklyBookingsCount(bCount || 0);
      }

      // Calculate Conversion Rate: (Confirmed Bookings / Unique Customers) * 100
      // 1. Get unique customers count from message logs
      const { data: customerData, error: customerError } = await supabase
        .from('message_logs')
        .select('customer_id')
        .eq('user_id', user.id);

      // 2. Get total confirmed bookings
      const { count: confirmedCount, error: confirmedError } = await supabase
        .from('bookings')
        .select('*', { count: 'exact', head: true })
        .eq('user_id', user.id)
        .eq('status', 'confirmed');

      if (!customerError && !confirmedError && customerData) {
        const uniqueCustomers = new Set(customerData.map(log => log.customer_id)).size;

        if (uniqueCustomers > 0) {
          const rate = ((confirmedCount || 0) / uniqueCustomers) * 100;
          setConversionRate(Math.min(100, Math.round(rate)));
        } else {
          setConversionRate(0);
        }
      }
    } catch (error) {
      console.error('Error loading metrics:', error);
    }
  };

  useEffect(() => {
    if (user) {
      loadSubscription();
      loadAgents();
      loadPendingPayments();
    }
  }, [user]);

  // Check if user has exhausted messages and show upgrade popup
  useEffect(() => {
    if (subscription && subscription.messages_used >= subscription.message_limit) {
      setShowUpgradePopup(true);
      markUpgradePopupAsShown();
    }
  }, [subscription]);

  const markUpgradePopupAsShown = async () => {
    if (!user || !subscription) return;

    try {
      // We'll mark that the popup was shown in state for now
      // When the migration is run and the column exists, we can update it properly
      console.debug('Upgrade popup shown to user');
    } catch (error) {
      console.debug('Error marking upgrade popup as shown:', error);
    }
  };

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);
    setLoading(false);

    if (!session) {
      navigate("/auth");
    }
  };

  const loadSubscription = async () => {
    if (!user) return;

    try {
      // First, ensure profile exists (required for subscription foreign key)
      const { data: profile, error: profileError } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (profileError) {
        console.error('Error checking profile:', profileError);
      }

      // If profile doesn't exist, try to create it (trigger should handle this, but just in case)
      if (!profile) {
        const { error: createProfileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || null,
          });

        if (createProfileError) {
          // 409 means it already exists (trigger created it) - this is fine
          if (createProfileError.code === '23505' || createProfileError.message.includes('duplicate') || createProfileError.message.includes('409')) {
            console.log('Profile already exists (created by trigger)');
          } else {
            console.error('Error creating profile:', createProfileError);
          }
        }
      }

      // Load subscription data
      let { data, error } = await supabase
        .from('subscriptions')
        .select('plan, platform, messages_used, message_limit, bookings_used, bookings_limit, is_active, started_at')
        .eq('user_id', user.id)
        .maybeSingle();

      if (error && error.code === 'PGRST204') {
        // Fallback if booking columns don't exist yet
        const { data: fallbackData, error: fallbackError } = await supabase
          .from('subscriptions')
          .select('plan, platform, messages_used, message_limit, is_active, started_at')
          .eq('user_id', user.id)
          .maybeSingle();

        if (fallbackError) throw fallbackError;

        if (fallbackData) {
          data = {
            ...fallbackData,
            bookings_used: 0,
            bookings_limit: fallbackData.plan === 'free' ? 5 : 50
          } as any;
        }
      } else if (error) {
        throw error;
      }

      // If subscription doesn't exist, user needs to choose a plan
      if (!data) {
        console.log('No subscription found - user needs to choose a plan');
        // Redirect to pricing page to choose a plan
        navigate("/pricing");
        return;
      } else {
        setSubscription(data);
      }
    } catch (error: any) {
      console.error('Error loading subscription:', error);
    }
  };

  const loadAgents = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('agents')
        .select('platform, is_active')
        .eq('user_id', user.id);

      if (error) throw error;

      setAgents(data || []);
    } catch (error: any) {
      console.error('Error loading agents:', error);
    }
  };

  const loadPendingPayments = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from('payment_requests')
        .select('id, requested_plan, created_at')
        .eq('user_id', user.id)
        .eq('status', 'pending')
        .order('created_at', { ascending: false });

      if (error) throw error;

      setPendingPayments(data || []);
    } catch (error: any) {
      console.error('Error loading pending payments:', error);
    }
  };

  const loadBookingConfig = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("booking_configurations")
        .select("business_type, is_active, updated_at")
        .eq("user_id", user.id)
        .eq("is_active", true)
        .maybeSingle();

      if (error && error.code !== "PGRST116") {
        throw error;
      }

      if (data) {
        setBookingConfig({
          business_type: data.business_type,
          is_active: data.is_active,
          updated_at: data.updated_at,
        });
      } else {
        setBookingConfig(null);
      }
    } catch (error: any) {
      console.error("Error loading booking configuration:", error);
    }
  };

  const loadRecentBookings = async () => {
    if (!user) return;

    try {
      const { data, error } = await supabase
        .from("bookings")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(10);

      if (error) {
        throw error;
      }

      setBookings(data || []);
    } catch (error: any) {
      console.error("Error loading bookings:", error);
    }
  };

  const selectPlan = async (plan: Plan, messageLimit: number, price: string) => {
    if (!user) return;

    try {
      // Ensure profile exists first
      const { data: profile } = await supabase
        .from('profiles')
        .select('id')
        .eq('id', user.id)
        .maybeSingle();

      if (!profile) {
        const { error: profileError } = await supabase
          .from('profiles')
          .insert({
            id: user.id,
            email: user.email || '',
            full_name: user.user_metadata?.full_name || null,
          });

        if (profileError) {
          console.error('Error creating profile:', profileError);
        }
      }

      // For free plan, use upsert to create or update
      if (plan === 'free') {
        const { error } = await supabase
          .from('subscriptions')
          .upsert({
            user_id: user.id,
            plan,
            message_limit: messageLimit,
            is_active: true,
            started_at: new Date().toISOString()
          }, {
            onConflict: 'user_id'
          });

        if (error) throw error;

        toast({
          title: "Plan Selected!",
          description: `You're now on the ${plan} plan.`,
        });

        await loadSubscription();
        // Redirect to settings page after selecting free plan
        navigate("/settings");
      } else {
        // For paid plans, also redirect to settings page
        // In a real implementation, you would handle payment processing here
        toast({
          title: "Plan Selected!",
          description: `You've selected the ${plan} plan. Please complete the payment process.`,
        });

        // Redirect to settings page after selecting paid plan
        navigate("/settings");
      }
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const getBookingTypeLabel = (type: string) => {
    switch (type) {
      case "hotel":
        return "Hotel";
      case "restaurant":
        return "Restaurant";
      case "hospital":
        return "Hospital / Clinic";
      case "custom":
        return "Custom";
      default:
        return type;
    }
  };

  if (loading) {
    return (
      <AppLayout>
        <div className="min-h-screen flex items-center justify-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <>
        {/* Upgrade Popup */}
        <Dialog open={showUpgradePopup} onOpenChange={setShowUpgradePopup}>
          <DialogContent className="sm:max-w-md">
            <DialogHeader>
              <DialogTitle>Upgrade Your Plan</DialogTitle>
              <DialogDescription>
                You've reached your message limit. Upgrade to continue using the service.
              </DialogDescription>
            </DialogHeader>
            <div className="flex flex-col gap-4 mt-4">
              <p>You've used all {subscription?.message_limit} messages in your current plan.</p>
              <Button onClick={() => navigate("/pricing")}>
                Upgrade Now
              </Button>
              <Button variant="outline" onClick={() => setShowUpgradePopup(false)}>
                Maybe Later
              </Button>
            </div>
          </DialogContent>
        </Dialog>

        <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
          {/* Pending Payment Banner */}
          {pendingPayments.length > 0 && (
            <div className="mb-6 sm:mb-8">
              <Card className="p-4 sm:p-6 bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border-yellow-500/30">
                <div className="flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4">
                  <div className="p-2 sm:p-3 bg-yellow-500/20 rounded-full flex-shrink-0">
                    <Clock className="w-5 h-5 sm:w-6 sm:h-6 text-yellow-600" />
                  </div>
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h2 className="text-lg sm:text-xl font-bold">Payment Pending</h2>
                      <AlertCircle className="w-4 h-4 text-yellow-600" />
                    </div>
                    <p className="text-sm sm:text-base text-muted-foreground">
                      Your upgrade to <span className="font-semibold text-yellow-700 capitalize">
                        {pendingPayments[0].requested_plan === 'starter' ? 'Pro' : pendingPayments[0].requested_plan === 'enterprise' ? 'Business' : pendingPayments[0].requested_plan}
                      </span> plan is being verified by our team.
                    </p>
                    <p className="text-xs sm:text-sm text-muted-foreground mt-1">
                      This usually takes up to <span className="font-semibold">15 minutes</span>. You will be notified once verified.
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    <div className="animate-pulse w-2 h-2 bg-yellow-500 rounded-full"></div>
                    <span className="text-xs sm:text-sm font-medium text-yellow-700">Processing...</span>
                  </div>
                </div>
              </Card>
            </div>
          )}

          {/* Header section with refresh button */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold">Dashboard</h1>
              <p className="text-muted-foreground text-sm sm:text-base">
                Welcome back! Here's what's happening with your AI assistant.
              </p>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={loadDashboardData}
              disabled={isRefreshing}
              className="w-fit"
            >
              <Clock className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              {isRefreshing ? "Refreshing..." : "Refresh Data"}
            </Button>
          </div>

          {/* Metrics Overview Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
            <Card className="p-5 flex flex-col justify-between bg-gradient-to-br from-blue-500/5 to-cyan-500/5 border-blue-500/10 hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <MessageSquare className="w-5 h-5 text-blue-600" />
                </div>
                <Badge variant="outline" className="text-[10px] font-normal border-blue-200">Total Interactions</Badge>
              </div>
              <div>
                <h3 className="text-2xl font-bold">{totalMessages}</h3>
                <p className="text-xs text-muted-foreground mt-1">Messages handled by AI</p>
              </div>
            </Card>

            <Card className="p-5 flex flex-col justify-between bg-gradient-to-br from-purple-500/5 to-pink-500/5 border-purple-500/10 hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Clock className="w-5 h-5 text-purple-600" />
                </div>
                <Badge variant="outline" className="text-[10px] font-normal border-purple-200">Last 7 Days</Badge>
              </div>
              <div>
                <h3 className="text-2xl font-bold">{weeklyBookingsCount}</h3>
                <p className="text-xs text-muted-foreground mt-1">Bookings this week</p>
              </div>
            </Card>

            <Card className="p-5 flex flex-col justify-between bg-gradient-to-br from-orange-500/5 to-yellow-500/5 border-orange-500/10 hover:shadow-md transition-all">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-orange-500/10 rounded-lg">
                  <TrendingUp className="w-5 h-5 text-orange-600" />
                </div>
                <Badge variant="outline" className="text-[10px] font-normal border-orange-200">Conversion Rate</Badge>
              </div>
              <div>
                <h3 className="text-2xl font-bold">{conversionRate}%</h3>
                <p className="text-xs text-muted-foreground mt-1">Customers that booked</p>
              </div>
            </Card>

            <Card className="p-5 flex flex-col justify-between bg-gradient-to-br from-emerald-500/5 to-green-500/5 border-emerald-500/10 hover:shadow-md transition-all sm:col-span-2 lg:col-span-3">
              <div className="flex justify-between items-start mb-4">
                <div className="p-2 bg-emerald-500/10 rounded-lg">
                  <Badge variant="outline" className="p-0 border-none">
                    <Check className="w-5 h-5 text-emerald-600" />
                  </Badge>
                </div>
                <Badge variant="outline" className={`text-[10px] font-normal border-emerald-200 capitalize`}>
                  {subscription?.plan === 'starter' ? 'Pro' : subscription?.plan === 'enterprise' ? 'Business' : subscription?.plan === 'free' ? 'Free Trial' : subscription?.plan}
                </Badge>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Messages</span>
                    <span className="text-[10px] font-medium">{subscription?.messages_used} / {subscription?.message_limit}</span>
                  </div>
                  <div className="w-full bg-emerald-500/10 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-emerald-500 h-full transition-all duration-500"
                      style={{ width: `${Math.min(100, ((subscription?.messages_used || 0) / (subscription?.message_limit || 1)) * 100)}%` }}
                    />
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-1">
                    <span className="text-[10px] uppercase font-bold text-muted-foreground">Bookings</span>
                    <span className="text-[10px] font-medium">{subscription?.bookings_used} / {subscription?.bookings_limit}</span>
                  </div>
                  <div className="w-full bg-emerald-500/10 h-1.5 rounded-full overflow-hidden">
                    <div
                      className="bg-green-500 h-full transition-all duration-500"
                      style={{ width: `${Math.min(100, ((subscription?.bookings_used || 0) / (subscription?.bookings_limit || 1)) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>

              {subscription?.plan !== 'enterprise' && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="mt-4 w-full h-8 text-[10px] bg-emerald-500/10 text-emerald-600 hover:bg-emerald-500/20 font-bold border border-emerald-500/20"
                  onClick={() => navigate("/pricing")}
                >
                  <Zap className="w-3 h-3 mr-1" />
                  Upgrade Now
                </Button>
              )}
            </Card>
          </div>


          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Area: Recent Activity */}
            <div className="lg:col-span-2 flex flex-col gap-6">
              {/* Recent Bookings Card */}
              <Card className="bg-gradient-card border-border shadow-sm flex flex-col h-full">
                <div className="p-6 border-b border-border/50 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-primary/10 rounded-lg">
                      <Calendar className="w-5 h-5 text-primary" />
                    </div>
                    <div>
                      <h2 className="text-lg font-bold">Recent Bookings</h2>
                      <p className="text-xs text-muted-foreground">Latest customer reservations</p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => navigate("/bookings")} className="text-xs">
                    View All <ArrowRight className="w-3 h-3 ml-1" />
                  </Button>
                </div>

                <div className="flex-1 overflow-hidden">
                  {bookings.length === 0 ? (
                    <div className="p-12 text-center flex flex-col items-center gap-4">
                      <div className="p-4 bg-muted rounded-full">
                        <Calendar className="w-8 h-8 text-muted-foreground/40" />
                      </div>
                      <div>
                        <p className="text-muted-foreground font-medium">No bookings yet</p>
                        <p className="text-xs text-muted-foreground mt-1 max-w-[200px] mx-auto">
                          Once customers start booking via WhatsApp, they'll appear here.
                        </p>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => navigate("/knowledge")}
                        className="mt-2"
                      >
                        Setup Booking Flow
                      </Button>
                    </div>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-sm">
                        <thead>
                          <tr className="border-b border-border text-[10px] uppercase tracking-wider text-muted-foreground">
                            <th className="text-left font-medium py-3 px-6">Customer</th>
                            <th className="text-left font-medium py-3 px-6">Service</th>
                            <th className="text-left font-medium py-3 px-6">Platform</th>
                            <th className="text-left font-medium py-3 px-6 text-right">Status</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-border/50">
                          {bookings.slice(0, 5).map((booking) => (
                            <tr
                              key={booking.id}
                              className="hover:bg-muted/30 transition-colors group cursor-pointer"
                              onClick={() => navigate("/bookings")}
                            >
                              <td className="py-4 px-6">
                                <div className="flex flex-col">
                                  <span className="font-semibold">{booking.customer_name || "Guest"}</span>
                                  <span className="text-[10px] text-muted-foreground">{booking.customer_phone || booking.customer_id}</span>
                                </div>
                              </td>
                              <td className="py-4 px-6">
                                <Badge variant="secondary" className="px-2 py-0 h-5 text-[10px] capitalize font-normal">
                                  {getBookingTypeLabel(booking.booking_type)}
                                </Badge>
                              </td>
                              <td className="py-4 px-6">
                                <div className="flex items-center gap-2">
                                  <div className={`w-1.5 h-1.5 rounded-full ${booking.platform === 'whatsapp' ? 'bg-green-500' : 'bg-blue-500'}`} />
                                  <span className="text-xs capitalize">{booking.platform}</span>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-right">
                                <div className="flex items-center justify-end gap-2">
                                  <Button
                                    variant="ghost"
                                    size="icon"
                                    className="h-6 w-6 text-muted-foreground hover:text-primary hover:bg-primary/10"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      navigate(`/messages?chat=${booking.customer_id}`);
                                    }}
                                    title="View Messages"
                                  >
                                    <MessageSquare className="w-3 h-3" />
                                  </Button>
                                  <Badge
                                    className={`text-[10px] font-medium h-5 ${booking.status === "confirmed"
                                      ? "bg-green-500/10 text-green-600 border-green-500/20"
                                      : booking.status === "cancelled"
                                        ? "bg-red-500/10 text-red-600 border-red-500/20"
                                        : "bg-orange-500/10 text-orange-600 border-orange-500/20"
                                      }`}
                                    variant="outline"
                                  >
                                    {booking.status}
                                  </Badge>
                                </div>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>
              </Card>
            </div>

            {/* Sidebar Area: Quick Setup & Status */}
            <div className="flex flex-col gap-6">
              {subscription?.plan !== 'enterprise' && (
                <Card className="p-4 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border-indigo-500/20 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 p-2 opacity-10 group-hover:scale-110 transition-transform">
                    <Zap className="w-12 h-12 text-indigo-600" />
                  </div>
                  <div className="relative z-10">
                    <Badge className="mb-2 bg-indigo-500 text-white border-none text-[8px] h-4">PRO TIP</Badge>
                    <h4 className="text-xs font-bold mb-1">Boost Your Efficiency</h4>
                    <p className="text-[10px] text-muted-foreground mb-3">
                      Pro users get access to 1-click CSV exports and manual reply overrides.
                    </p>
                    <Button
                      variant="link"
                      className="p-0 h-auto text-[10px] text-indigo-600 font-bold hover:no-underline"
                      onClick={() => navigate("/pricing")}
                    >
                      See Pro Features <ArrowRight className="w-2 h-2 ml-1" />
                    </Button>
                  </div>
                </Card>
              )}
              {/* Platform Status */}
              <Card className="p-6 bg-gradient-to-br from-card to-card/50 border-border">
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                  <Bot className="w-4 h-4 text-primary" />
                  Agent Status
                </h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                    <div className="flex items-center gap-3">
                      <div className={`w-2 h-2 rounded-full ${agents.find(a => a.platform === 'whatsapp' && a.is_active) ? 'bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]' : 'bg-gray-300'}`} />
                      <span className="text-sm font-medium">WhatsApp</span>
                    </div>
                    {agents.find(a => a.platform === 'whatsapp' && a.is_active) ? (
                      <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px]">Online</Badge>
                    ) : (
                      <Button variant="ghost" size="sm" onClick={() => navigate("/settings")} className="h-6 text-[10px] p-0 text-primary">Connect</Button>
                    )}
                  </div>
                  <div className="flex items-center justify-between p-3 rounded-lg bg-muted/30 border border-border/50">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 rounded-full bg-green-500 shadow-[0_0_8px_rgba(34,197,94,0.4)]" />
                      <span className="text-sm font-medium">Web Chat</span>
                    </div>
                    <Badge className="bg-green-500/10 text-green-600 border-green-500/20 text-[10px]">Online</Badge>
                  </div>
                </div>
              </Card>

              {/* Quick Actions / Checklist */}
              <Card className="p-6 bg-primary/5 border-primary/10">
                <h3 className="text-sm font-bold mb-4 flex items-center gap-2">
                  <Check className="w-4 h-4 text-primary" />
                  Getting Started
                </h3>
                <div className="space-y-3">
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${agents.length > 0 ? 'bg-green-500 text-white' : 'bg-primary/20 text-primary'}`}>
                      {agents.length > 0 ? <Check className="w-3 h-3" /> : "1"}
                    </div>
                    <span className={`text-xs ${agents.length > 0 ? 'text-muted-foreground line-through' : 'font-medium'}`}>Connect your first platform</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${bookingConfig ? 'bg-green-500 text-white' : 'bg-primary/20 text-primary'}`}>
                      {bookingConfig ? <Check className="w-3 h-3" /> : "2"}
                    </div>
                    <span className={`text-xs ${bookingConfig ? 'text-muted-foreground line-through' : 'font-medium'}`}>Configure booking details</span>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] ${totalMessages > 0 ? 'bg-green-500 text-white' : 'bg-primary/20 text-primary'}`}>
                      {totalMessages > 0 ? <Check className="w-3 h-3" /> : "3"}
                    </div>
                    <span className={`text-xs ${totalMessages > 0 ? 'text-muted-foreground line-through' : 'font-medium'}`}>Receive your first message</span>
                  </div>
                </div>
                {!bookingConfig && (
                  <Button
                    onClick={() => navigate("/knowledge")}
                    className="w-full mt-6 bg-primary hover:opacity-90 text-xs h-9"
                  >
                    Complete Setup
                    <ArrowRight className="w-3 h-3 ml-2" />
                  </Button>
                )}
              </Card>

              {/* Quick Links */}
              <div className="grid grid-cols-2 gap-3">
                <Button
                  variant="outline"
                  className="h-20 flex flex-col gap-2 bg-background border-border hover:bg-muted/50"
                  onClick={() => navigate("/messages")}
                >
                  <MessageSquare className="w-5 h-5 text-blue-500" />
                  <span className="text-[10px] font-medium">Messages</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-20 flex flex-col gap-2 bg-background border-border hover:bg-muted/50"
                  onClick={() => navigate("/settings")}
                >
                  <Settings className="w-5 h-5 text-orange-500" />
                  <span className="text-[10px] font-medium">Settings</span>
                </Button>
              </div>
            </div>
          </div>
        </div>
      </>
    </AppLayout>
  );
};

export default Dashboard;