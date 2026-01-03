import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Edit, CheckCircle, XCircle, Clock, Save, Bot, LogOut, Users, TrendingUp, MessageSquare, DollarSign, Menu, LayoutDashboard, CreditCard, ShieldCheck } from "lucide-react";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger, DropdownMenuSeparator } from "@/components/ui/dropdown-menu";
import type { User } from "@supabase/supabase-js";

interface UserData {
  id: string;
  email: string;
  plan: string;
  platform: string;
  messages_used: number;
  message_limit: number;
  bookings_used: number;
  bookings_limit: number;
  is_active: boolean;
}

const Admin = () => {
  const [user, setUser] = useState<User | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [users, setUsers] = useState<UserData[]>([]);
  const [paymentRequests, setPaymentRequests] = useState<any[]>([]);
  const [managedSetups, setManagedSetups] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [completingSetup, setCompletingSetup] = useState<any | null>(null);
  const [setupCreds, setSetupCreds] = useState({
    phoneNumberId: "",
    metaAppId: "",
    metaToken: "",
  });
  const [stats, setStats] = useState({
    totalUsers: 0,
    activeSubscriptions: 0,
    totalMessages: 0,
    monthlyRevenue: 0,
    pendingPayments: 0,
  });
  const [editingUser, setEditingUser] = useState<UserData | null>(null);
  const [newPlan, setNewPlan] = useState<string>("");
  const [newMessageLimit, setNewMessageLimit] = useState<number>(0);
  const [newBookingLimit, setNewBookingLimit] = useState<number>(0);

  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkAdminAccess();
  }, []);

  const checkAdminAccess = async () => {
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      navigate("/auth");
      return;
    }

    setUser(session.user);

    // Check if user has admin role
    const { data: roleData } = await supabase
      .from('user_roles')
      .select('role')
      .eq('user_id', session.user.id)
      .eq('role', 'admin')
      .maybeSingle();

    if (!roleData) {
      toast({
        title: "Access Denied",
        description: "You don't have admin permissions",
        variant: "destructive",
      });
      navigate("/dashboard");
      return;
    }

    setIsAdmin(true);
    loadAdminData();
  };

  const loadAdminData = async () => {
    try {
      // Load all users with their subscriptions
      const { data: subsData, error: subsError } = await supabase
        .from('subscriptions')
        .select(`
          user_id,
          plan,
          platform,
          messages_used,
          message_limit,
          bookings_used,
          bookings_limit,
          is_active,
          profiles (email)
        `);

      if (subsError) throw subsError;

      const usersData = subsData.map((sub: any) => ({
        id: sub.user_id,
        email: sub.profiles?.email || 'N/A',
        plan: sub.plan,
        platform: sub.platform || 'Not selected',
        messages_used: sub.messages_used,
        message_limit: sub.message_limit,
        bookings_used: sub.bookings_used || 0,
        bookings_limit: sub.bookings_limit || 0,
        is_active: sub.is_active,
      }));

      setUsers(usersData);

      // Calculate stats
      const totalMessages = usersData.reduce((sum: number, u: UserData) => sum + u.messages_used, 0);
      const activeSubscriptions = usersData.filter((u: UserData) => u.is_active).length;

      // Calculate monthly revenue
      const planPrices: Record<string, number> = {
        free: 0,
        starter: 19,
        enterprise: 49,
        custom: 0,
      };

      const monthlyRevenue = usersData.reduce((sum: number, u: UserData) => {
        return sum + (planPrices[u.plan] || 0);
      }, 0);

      // Load payment requests
      const { data: paymentsData, error: paymentsError } = await supabase
        .from('payment_requests')
        .select(`
          *,
          profiles (email)
        `)
        .order('created_at', { ascending: false });

      if (paymentsError) {
        console.error('Failed to load payment requests:', paymentsError);
      } else {
        setPaymentRequests(paymentsData || []);
      }

      const pendingPayments = (paymentsData || []).filter((p: any) => p.status === 'pending').length;

      setStats({
        totalUsers: usersData.length,
        activeSubscriptions,
        totalMessages,
        monthlyRevenue,
        pendingPayments,
      });

      // Load managed setups
      const { data: managedData, error: managedError } = await supabase
        .from('managed_setups')
        .select('*')
        .order('created_at', { ascending: false });

      if (managedError) {
        console.error('Failed to load managed setups:', managedError);
      } else {
        // Fetch user emails separately
        const setupsWithEmails = await Promise.all(
          (managedData || []).map(async (setup: any) => {
            const { data: profile } = await supabase
              .from('profiles')
              .select('email')
              .eq('id', setup.user_id)
              .single();

            return {
              ...setup,
              profiles: profile
            };
          })
        );
        setManagedSetups(setupsWithEmails);
      }
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

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/");
  };

  const changePlan = async (userId: string, oldPlan: string, plan: string, messageLimit: number, bookingLimit: number) => {
    try {
      const { error } = await supabase
        .from('subscriptions')
        .update({
          plan: plan as any,
          message_limit: messageLimit,
          bookings_limit: bookingLimit,
        })
        .eq('user_id', userId);

      if (error) throw error;

      // Log admin action
      await supabase
        .from('admin_actions')
        .insert({
          admin_user_id: user?.id,
          target_user_id: userId,
          action_type: 'plan_change',
          old_value: `${oldPlan} (${users.find(u => u.id === userId)?.message_limit})`,
          new_value: `${plan} (${messageLimit})`,
        });

      // Send email notification to user
      try {
        let userEmail = users.find(u => u.id === userId)?.email;

        if (!userEmail) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', userId)
            .maybeSingle();
          userEmail = profile?.email;
        }

        if (userEmail) {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const functionUrl = `${supabaseUrl}/functions/v1/send-plan-verification-email`;

          await fetch(functionUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              email: userEmail,
              plan: plan,
            }),
          });
        }
      } catch (emailError: any) {
        console.error('❌ Error sending plan verification email:', emailError);
      }

      toast({
        title: "Plan Updated",
        description: `Successfully updated ${plan} plan with ${messageLimit} messages.`,
      });

      setEditingUser(null);
      setNewBookingLimit(0);
      loadAdminData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const verifyPayment = async (paymentId: string, userId: string, requestedPlan: string) => {
    try {
      const messageLimits: Record<string, number> = {
        free: 50,
        starter: 1000,
        enterprise: 10000,
        custom: 50,
      };

      const bookingLimits: Record<string, number> = {
        free: 5,
        starter: 50,
        enterprise: 9999,
        custom: 5,
      };

      // Get billing cycle from payment request
      const paymentRequest = paymentRequests.find(p => p.id === paymentId);
      const billingCycle = paymentRequest?.billing_cycle || 'monthly';

      // Update payment request status
      const { error: paymentError } = await supabase
        .from('payment_requests')
        .update({
          status: 'verified',
          verified_by: user?.id,
          verified_at: new Date().toISOString(),
          notification_shown: false
        })
        .eq('id', paymentId);

      if (paymentError) throw paymentError;

      // Update user subscription
      const { error: subError } = await supabase
        .from('subscriptions')
        .update({
          plan: requestedPlan as any,
          message_limit: messageLimits[requestedPlan] || 50,
          bookings_limit: bookingLimits[requestedPlan] || 5,
          is_active: true,
          started_at: new Date().toISOString(),
          billing_cycle: billingCycle
        })
        .eq('user_id', userId);

      if (subError) throw subError;

      // Log admin action
      await supabase
        .from('admin_actions' as any)
        .insert({
          admin_user_id: user?.id,
          target_user_id: userId,
          action_type: 'plan_change',
          old_value: 'payment_verified',
          new_value: requestedPlan,
        });

      // Send email notification
      try {
        let userEmail = paymentRequests.find(p => p.id === paymentId)?.profiles?.email;
        if (!userEmail) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('email')
            .eq('id', userId)
            .maybeSingle();
          userEmail = profile?.email;
        }

        if (userEmail) {
          const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
          const functionUrl = `${supabaseUrl}/functions/v1/send-plan-verification-email`;

          await fetch(functionUrl, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
              'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
            },
            body: JSON.stringify({
              email: userEmail,
              plan: requestedPlan,
            }),
          });
        }
      } catch (emailError: any) {
        console.error('❌ Error sending plan verification email:', emailError);
      }

      toast({
        title: "Payment Verified!",
        description: `User upgraded to ${requestedPlan} plan successfully.`,
      });

      loadAdminData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };

  const rejectPayment = async (paymentId: string, reason: string) => {
    try {
      const { error } = await supabase
        .from('payment_requests')
        .update({
          status: 'rejected',
          verified_by: user?.id,
          verified_at: new Date().toISOString(),
          rejection_reason: reason,
        })
        .eq('id', paymentId);

      if (error) throw error;

      toast({
        title: "Payment Rejected",
        description: "Payment request has been rejected.",
      });

      loadAdminData();
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message,
        variant: "destructive",
      });
    }
  };
  const completeManagedSetup = async () => {
    if (!completingSetup) return;

    try {
      setLoading(true);
      const { phoneNumberId, metaAppId, metaToken } = setupCreds;

      if (!phoneNumberId || !metaAppId || !metaToken) {
        toast({
          title: "Missing Information",
          description: "Please fill in all credentials",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';
      const webhookUrl = `${supabaseUrl}/functions/v1/whatsapp-webhook`;

      // Update user agents table
      const { error: agentError } = await supabase
        .from('agents')
        .upsert({
          user_id: completingSetup.user_id,
          platform: 'whatsapp',
          phone_number: completingSetup.phone_number,
          phone_number_id: phoneNumberId,
          meta_app_id: metaAppId,
          meta_token: metaToken,
          webhook_url: webhookUrl,
          is_active: true,
        }, {
          onConflict: 'user_id,platform'
        });

      if (agentError) throw agentError;

      // Update managed setup status
      const { error: setupError } = await supabase
        .from('managed_setups')
        .update({ status: 'completed', updated_at: new Date().toISOString() })
        .eq('id', completingSetup.id);

      if (setupError) throw setupError;

      // Notify user via Edge Function
      try {
        await supabase.functions.invoke("managed-setup-notification", {
          body: {
            task: "complete",
            userId: completingSetup.user_id,
            email: completingSetup.profiles?.email
          },
        });
      } catch (notifError) {
        console.error("Completion notification error:", notifError);
      }

      toast({
        title: "Setup Completed!",
        description: `WhatsApp configuration applied for ${completingSetup.profiles?.email}`,
      });

      setCompletingSetup(null);
      setSetupCreds({ phoneNumberId: "", metaAppId: "", metaToken: "" });
      loadAdminData();
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

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
      </div>
    );
  }

  if (!isAdmin) return null;

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-md">
        <div className="container mx-auto px-4 py-3 flex justify-between items-center">
          <div className="flex items-center gap-2 min-w-0">
            <div className="p-1.5 bg-primary/10 rounded-lg">
              <Bot className="w-6 h-6 sm:w-7 sm:h-7 text-primary" />
            </div>
            <span className="text-lg sm:text-xl font-bold bg-gradient-primary bg-clip-text text-transparent truncate">
              Resbonder Admin
            </span>
          </div>

          <div className="flex items-center gap-2">
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={() => navigate("/admin/crypto-payments")} className="text-sm">
                <CreditCard className="w-4 h-4 mr-2" />
                Crypto Payments
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate("/admin/payments")} className="text-sm">
                <ShieldCheck className="w-4 h-4 mr-2" />
                Verify Payments
              </Button>
              <Button variant="ghost" size="sm" onClick={() => navigate("/dashboard")} className="text-sm">
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Dashboard
              </Button>
            </div>

            {/* Mobile/Tablet Menu */}
            <div className="lg:hidden">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <Button variant="outline" size="icon" className="h-9 w-9">
                    <Menu className="h-5 w-5" />
                  </Button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end" className="w-56">
                  <DropdownMenuItem onClick={() => navigate("/admin/crypto-payments")}>
                    <CreditCard className="w-4 h-4 mr-2" />
                    Crypto Payments
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/admin/payments")}>
                    <ShieldCheck className="w-4 h-4 mr-2" />
                    Verify Payments
                  </DropdownMenuItem>
                  <DropdownMenuItem onClick={() => navigate("/dashboard")}>
                    <LayoutDashboard className="w-4 h-4 mr-2" />
                    Dashboard
                  </DropdownMenuItem>
                  <DropdownMenuSeparator />
                  <DropdownMenuItem onClick={handleLogout} className="text-destructive">
                    <LogOut className="w-4 h-4 mr-2" />
                    Logout
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>

            {/* Logout Button (Desktop) */}
            <div className="hidden sm:block">
              <Button variant="ghost" size="icon" onClick={handleLogout} className="h-9 w-9 text-muted-foreground hover:text-destructive">
                <LogOut className="w-4 h-4" />
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* Editing Dialog */}
      <AlertDialog open={!!editingUser} onOpenChange={(open) => !open && setEditingUser(null)}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle className="text-lg sm:text-xl">Edit User Subscription</AlertDialogTitle>
            <AlertDialogDescription className="text-sm">
              Modify plan and message limits for {editingUser?.email}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Select Plan</Label>
              <Select
                value={newPlan}
                onValueChange={(value) => {
                  setNewPlan(value);
                  const msgLimits: Record<string, number> = {
                    free: 50,
                    starter: 1000,
                    enterprise: 10000,
                    custom: editingUser?.message_limit || 50
                  };
                  const bkgLimits: Record<string, number> = {
                    free: 5,
                    starter: 50,
                    enterprise: 9999,
                    custom: editingUser?.bookings_limit || 5
                  };
                  setNewMessageLimit(msgLimits[value]);
                  setNewBookingLimit(bkgLimits[value]);
                }}
              >
                <SelectTrigger className="w-full">
                  <SelectValue placeholder="Select plan" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="free">Free (50 messages)</SelectItem>
                  <SelectItem value="starter">Pro (1000 messages)</SelectItem>
                  <SelectItem value="enterprise">Business (10000 messages)</SelectItem>
                  <SelectItem value="custom">Custom (Admin defined)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Message Limit</Label>
              <Input
                type="number"
                value={newMessageLimit}
                onChange={(e) => setNewMessageLimit(parseInt(e.target.value) || 0)}
                disabled={newPlan !== 'custom'}
              />
              <p className="text-[10px] text-muted-foreground">
                {newPlan === 'custom'
                  ? "You can set any message limit for custom plans."
                  : `Limits for ${newPlan} are fixed.`}
              </p>
            </div>

            <div className="space-y-2">
              <Label>Bookings Limit</Label>
              <Input
                type="number"
                value={newBookingLimit}
                onChange={(e) => setNewBookingLimit(parseInt(e.target.value) || 0)}
                disabled={newPlan !== 'custom'}
              />
              <p className="text-[10px] text-muted-foreground">
                {newPlan === 'custom'
                  ? "You can set any booking limit for custom plans."
                  : `Limits for ${newPlan} are fixed.`}
              </p>
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel className="text-sm">Cancel</AlertDialogCancel>
            <Button
              className="text-sm"
              onClick={() => editingUser && changePlan(editingUser.id, editingUser.plan, newPlan, newMessageLimit, newBookingLimit)}
            >
              <Save className="w-4 h-4 mr-2" />
              Save Changes
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
      {/* Managed Setup Completion Dialog */}
      <AlertDialog open={!!completingSetup} onOpenChange={(open) => !open && setCompletingSetup(null)}>
        <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
          <AlertDialogHeader>
            <AlertDialogTitle>Complete WhatsApp Setup</AlertDialogTitle>
            <AlertDialogDescription>
              Enter Meta credentials for {completingSetup?.profiles?.email}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <div className="py-4 space-y-4">
            <div className="space-y-2">
              <Label>Phone Number ID</Label>
              <Input
                placeholder="815809944955466"
                value={setupCreds.phoneNumberId}
                onChange={(e) => setSetupCreds({ ...setupCreds, phoneNumberId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Meta App ID</Label>
              <Input
                placeholder="Your Meta App ID"
                value={setupCreds.metaAppId}
                onChange={(e) => setSetupCreds({ ...setupCreds, metaAppId: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <Label>Meta Access Token</Label>
              <Input
                placeholder="EAAG..."
                value={setupCreds.metaToken}
                onChange={(e) => setSetupCreds({ ...setupCreds, metaToken: e.target.value })}
              />
            </div>
          </div>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <Button onClick={completeManagedSetup} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Apply & Complete
            </Button>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Stats */}
      <div className="container mx-auto px-4 py-6 sm:py-8">
        <div className="flex flex-col gap-1 mb-6 sm:mb-8">
          <h1 className="text-2xl sm:text-3xl font-bold tracking-tight">Platform Overview</h1>
          <p className="text-sm text-muted-foreground">Manage your users and monitor system performance.</p>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-4 mb-8">
          <Card className="p-5 bg-gradient-to-br from-card to-card/50 border-border/50 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-primary/10 rounded-xl">
                <Users className="w-6 h-6 text-primary" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Users</p>
                <p className="text-2xl font-bold">{stats.totalUsers}</p>
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-card to-card/50 border-border/50 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-accent/10 rounded-xl">
                <TrendingUp className="w-6 h-6 text-accent" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Active Subs</p>
                <p className="text-2xl font-bold">{stats.activeSubscriptions}</p>
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-card to-card/50 border-border/50 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-secondary/10 rounded-xl">
                <MessageSquare className="w-6 h-6 text-secondary" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Total Msgs</p>
                <p className="text-2xl font-bold">{stats.totalMessages.toLocaleString()}</p>
              </div>
            </div>
          </Card>

          <Card className="p-5 bg-gradient-to-br from-card to-card/50 border-border/50 shadow-sm">
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-emerald-500/10 rounded-xl">
                <DollarSign className="w-6 h-6 text-emerald-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Revenue</p>
                <p className="text-2xl font-bold">${stats.monthlyRevenue}</p>
              </div>
            </div>
          </Card>

          <Card
            className="p-5 bg-gradient-to-br from-card to-card/50 border-border/50 shadow-sm cursor-pointer hover:border-yellow-500/50 transition-all active:scale-95"
            onClick={() => navigate("/admin/payments")}
          >
            <div className="flex items-center gap-4">
              <div className="p-2.5 bg-yellow-500/10 rounded-xl">
                <Clock className="w-6 h-6 text-yellow-500" />
              </div>
              <div>
                <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Pending</p>
                <p className="text-2xl font-bold">{stats.pendingPayments}</p>
              </div>
            </div>
          </Card>
        </div>

        {/* Payment Requests */}
        {paymentRequests.filter(p => p.status === 'pending').length > 0 && (
          <Card className="mb-8 border-border/50 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-border/50 bg-muted/30">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <Clock className="w-5 h-5 text-yellow-500" />
                Pending Payment Requests
              </h2>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User Email</TableHead>
                    <TableHead>Plan Path</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paymentRequests.filter(p => p.status === 'pending').map((payment: any) => (
                    <TableRow key={payment.id}>
                      <TableCell className="font-medium">{payment.profiles?.email || 'N/A'}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2 text-xs">
                          <span className="text-muted-foreground capitalize">{payment.current_plan}</span>
                          <span className="text-muted-foreground">→</span>
                          <span className="font-semibold text-accent capitalize">{payment.requested_plan}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-semibold">${payment.amount}</TableCell>
                      <TableCell className="text-muted-foreground">{new Date(payment.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button
                            size="sm"
                            className="bg-emerald-500 hover:bg-emerald-600 text-white"
                            onClick={() => verifyPayment(payment.id, payment.user_id, payment.requested_plan)}
                          >
                            <CheckCircle className="w-4 h-4 mr-1.5" />
                            Verify
                          </Button>
                          <Button
                            size="sm"
                            variant="destructive"
                            onClick={() => rejectPayment(payment.id, 'Payment not confirmed')}
                          >
                            <XCircle className="w-4 h-4 mr-1.5" />
                            Reject
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-border/50">
              {paymentRequests.filter(p => p.status === 'pending').map((payment: any) => (
                <div key={payment.id} className="p-4 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold truncate max-w-[200px]">{payment.profiles?.email || 'N/A'}</p>
                      <p className="text-xs text-muted-foreground">{new Date(payment.created_at).toLocaleDateString()}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-bold">${payment.amount}</p>
                      <p className="text-[10px] text-accent font-semibold uppercase">{payment.requested_plan} Plan</p>
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <Button
                      size="sm"
                      className="bg-emerald-500 hover:bg-emerald-600 text-white w-full"
                      onClick={() => verifyPayment(payment.id, payment.user_id, payment.requested_plan)}
                    >
                      <CheckCircle className="w-4 h-4 mr-1.5" />
                      Verify
                    </Button>
                    <Button
                      size="sm"
                      variant="destructive"
                      className="w-full"
                      onClick={() => rejectPayment(payment.id, 'Payment not confirmed')}
                    >
                      <XCircle className="w-4 h-4 mr-1.5" />
                      Reject
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Managed Setup Requests */}
        {managedSetups.filter(s => s.status === 'pending').length > 0 && (
          <Card className="mb-8 border-border/50 overflow-hidden">
            <div className="p-4 sm:p-6 border-b border-border/50 bg-muted/30">
              <h2 className="text-lg font-semibold flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-primary" />
                Pending Managed Setups
              </h2>
            </div>

            {/* Desktop Table View */}
            <div className="hidden md:block overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>User Email</TableHead>
                    <TableHead>Business Name</TableHead>
                    <TableHead>Phone Number</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {managedSetups.filter(s => s.status === 'pending').map((setup: any) => (
                    <TableRow key={setup.id}>
                      <TableCell className="font-medium">{setup.profiles?.email || 'N/A'}</TableCell>
                      <TableCell>{setup.business_name}</TableCell>
                      <TableCell>{setup.phone_number}</TableCell>
                      <TableCell className="text-muted-foreground">{new Date(setup.created_at).toLocaleDateString()}</TableCell>
                      <TableCell className="text-right">
                        <Button
                          size="sm"
                          className="bg-primary hover:bg-primary/90 text-white"
                          onClick={() => setCompletingSetup(setup)}
                        >
                          <CheckCircle className="w-4 h-4 mr-1.5" />
                          Complete Setup
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            {/* Mobile Card View */}
            <div className="md:hidden divide-y divide-border/50">
              {managedSetups.filter(s => s.status === 'pending').map((setup: any) => (
                <div key={setup.id} className="p-4 space-y-4">
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <p className="text-sm font-semibold truncate max-w-[200px]">{setup.profiles?.email || 'N/A'}</p>
                      <p className="text-xs font-medium text-primary">{setup.business_name}</p>
                      <p className="text-xs text-muted-foreground">{setup.phone_number}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs text-muted-foreground">{new Date(setup.created_at).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <Button
                    size="sm"
                    className="bg-primary hover:bg-primary/90 text-white w-full"
                    onClick={() => setCompletingSetup(setup)}
                  >
                    <CheckCircle className="w-4 h-4 mr-1.5" />
                    Complete Setup
                  </Button>
                </div>
              ))}
            </div>
          </Card>
        )}

        {/* Users Table */}
        <Card className="border-border/50 overflow-hidden">
          <div className="p-4 sm:p-6 border-b border-border/50 bg-muted/30 flex justify-between items-center">
            <h2 className="text-lg font-semibold flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" />
              All Users
            </h2>
            <div className="text-xs text-muted-foreground bg-card px-2 py-1 rounded border border-border/50">
              Total: {users.length}
            </div>
          </div>

          {/* Desktop Table View */}
          <div className="hidden md:block overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>User</TableHead>
                  <TableHead>Plan</TableHead>
                  <TableHead>Platform</TableHead>
                  <TableHead>Usage (Msgs / Bookings)</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {users.map((userData) => (
                  <TableRow key={userData.id}>
                    <TableCell>
                      <div className="flex flex-col">
                        <span className="font-medium text-sm">{userData.email}</span>
                        <span className="text-[10px] text-muted-foreground font-mono">{userData.id.substring(0, 8)}...</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize text-sm font-medium">
                        {userData.plan === 'starter' ? 'Pro' : userData.plan === 'enterprise' ? 'Business' : userData.plan}
                      </span>
                    </TableCell>
                    <TableCell>
                      <span className="capitalize text-xs text-muted-foreground">{userData.platform}</span>
                    </TableCell>
                    <TableCell>
                      <div className="flex flex-col gap-3">
                        {/* Messages Usage */}
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between items-center text-[10px] text-muted-foreground mr-2">
                            <span>Messages</span>
                            <span className="font-medium text-foreground">
                              {userData.messages_used} / {userData.message_limit}
                            </span>
                          </div>
                          <div className="w-24 h-1 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary"
                              style={{ width: `${Math.min((userData.messages_used / userData.message_limit) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                        {/* Bookings Usage */}
                        <div className="flex flex-col gap-1">
                          <div className="flex justify-between items-center text-[10px] text-muted-foreground mr-2">
                            <span>Bookings</span>
                            <span className="font-medium text-foreground">
                              {userData.bookings_used} / {userData.bookings_limit}
                            </span>
                          </div>
                          <div className="w-24 h-1 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-accent"
                              style={{ width: `${Math.min((userData.bookings_used / userData.bookings_limit) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-[10px] font-medium ${userData.is_active ? 'bg-emerald-500/10 text-emerald-500' : 'bg-muted text-muted-foreground'
                        }`}>
                        {userData.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </TableCell>
                    <TableCell className="text-right">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setEditingUser(userData);
                          setNewPlan(userData.plan);
                          setNewMessageLimit(userData.message_limit);
                          setNewBookingLimit(userData.bookings_limit);
                        }}
                      >
                        <Edit className="w-4 h-4 mr-1.5" />
                        Manage
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>

          {/* Mobile Card View */}
          <div className="md:hidden divide-y divide-border/50">
            {users.map((userData) => (
              <div key={userData.id} className="p-4 space-y-3">
                <div className="flex justify-between items-start">
                  <div className="space-y-0.5">
                    <p className="text-sm font-semibold truncate max-w-[200px]">{userData.email}</p>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] uppercase font-bold text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
                        {userData.plan === 'starter' ? 'Pro' : userData.plan === 'enterprise' ? 'Business' : userData.plan}
                      </span>
                      <span className={`text-[10px] font-medium ${userData.is_active ? 'text-emerald-500' : 'text-muted-foreground'
                        }`}>
                        • {userData.is_active ? 'Active' : 'Inactive'}
                      </span>
                    </div>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    className="h-8 text-xs"
                    onClick={() => {
                      setEditingUser(userData);
                      setNewPlan(userData.plan);
                      setNewMessageLimit(userData.message_limit);
                      setNewBookingLimit(userData.bookings_limit);
                    }}
                  >
                    Manage
                  </Button>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-1">
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] uppercase tracking-tighter text-muted-foreground">
                      <span>Messages</span>
                      <span className="font-medium text-foreground">{userData.messages_used}/{userData.message_limit}</span>
                    </div>
                    <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-primary"
                        style={{ width: `${Math.min((userData.messages_used / userData.message_limit) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                  <div className="space-y-1">
                    <div className="flex justify-between text-[9px] uppercase tracking-tighter text-muted-foreground">
                      <span>Bookings</span>
                      <span className="font-medium text-foreground">{userData.bookings_used}/{userData.bookings_limit}</span>
                    </div>
                    <div className="w-full h-1 bg-muted rounded-full overflow-hidden">
                      <div
                        className="h-full bg-accent"
                        style={{ width: `${Math.min((userData.bookings_used / userData.bookings_limit) * 100, 100)}%` }}
                      />
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Admin;
