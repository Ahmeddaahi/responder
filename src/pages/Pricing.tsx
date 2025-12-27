import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Check, TrendingUp, ArrowLeft, Phone, AlertCircle, ArrowUpRight, Zap, Rocket, Star, DollarSign, Coins } from "lucide-react";
import type { User } from "@supabase/supabase-js";

type Plan = 'free' | 'starter' | 'enterprise' | 'custom';
type UIPlan = 'free' | 'pro' | 'max' | 'ultra';

import PaymentModal from "@/components/PaymentModal";

const Pricing = () => {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  const [showPaymentInfo, setShowPaymentInfo] = useState(false);

  const [currentPlan, setCurrentPlan] = useState<Plan | null>(null);
  const [currency, setCurrency] = useState<'USD' | 'ETB'>('USD');

  // Payment Modal State
  const [isPaymentModalOpen, setIsPaymentModalOpen] = useState(false);
  const [selectedPlanForPayment, setSelectedPlanForPayment] = useState<{ name: string, price: string } | null>(null);

  useEffect(() => {
    // Handle email verification callback from email link
    const handleVerificationCallback = async () => {
      const urlParams = new URLSearchParams(window.location.search);
      const tokenHash = urlParams.get('token_hash');
      const type = urlParams.get('type');

      if (tokenHash && type) {
        console.log('🔗 Email verification callback detected on pricing page:', { tokenHash, type });

        // Supabase automatically handles the verification when the link is clicked
        // We just need to wait for the session to be updated and show success message
        try {
          const { data: { session } } = await supabase.auth.getSession();

          if (session?.user?.email_confirmed_at) {
            toast({
              title: "Email Verified!",
              description: "Your email has been successfully verified. Please choose your plan to get started.",
            });
            // Clear URL parameters
            window.history.replaceState({}, document.title, window.location.pathname);
          }
        } catch (error: any) {
          console.error('Error handling verification callback:', error);
        }
      }
    };

    handleVerificationCallback();

    checkUser();
    loadSubscription();

    // Check for show_payment query param
    const urlParams = new URLSearchParams(window.location.search);
    const showPayment = urlParams.get('show_payment');

    if (showPayment === 'true') {
      setShowPaymentInfo(true);
    }
  }, [navigate, toast]);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);

    if (!session) {
      navigate("/auth");
    }

    // MOCK DATA
    // setUser({ id: 'test', email: 'test@test.com' } as any);
  };

  const loadSubscription = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { data } = await supabase
      .from('subscriptions')
      .select('plan')
      .eq('user_id', session.user.id)
      .maybeSingle();

    if (data) {
      setCurrentPlan(data.plan);
    }

    // MOCK DATA
    // setCurrentPlan('free');
  };

  const plans = [
    {
      id: "01",
      name: "Free Trial",
      subName: "Try for 30 days",
      plan: "free" as Plan,
      description: "One-time trial for new users to test our AI assistant",
      subDescription: "No credit card required.",
      messages: "50 messages total",
      price: null,
      priceMonthly: null,
      priceAnnually: null,
      buttonText: "Get Started",
      buttonIcon: "ArrowUpRight",
      features: [
        "50 messages total (One-time)",
        "5 Bookings included",
        "2 Room/Service types",
        "Standard AI assistant",
        "WhatsApp integration",
        "No custom fields",
        "AI only (No human takeover)"
      ],
      isPopular: false
    },
    {
      id: "02",
      name: "Pro",
      subName: null,
      plan: "starter" as Plan,
      description: "Higher limits & premium features for growing businesses",
      subDescription: null,
      messages: "500 messages/month",
      price: currency === 'USD' ? "5" : "1000",
      priceMonthly: currency === 'USD' ? "$5 /mo" : "1000 ETB /mo",
      priceAnnually: null,
      buttonText: "Subscribe",
      buttonIcon: "Zap",
      features: [
        "500 messages per month",
        "50 Bookings included",
        "10 Room/Service types",
        "Advanced AI assistant",
        "Unlimited Custom Fields",
        "Manual replies (Human takeover)",
        "Priority Email support",
        "Detailed dashboard metrics"
      ],
      isPopular: true
    },
    {
      id: "03",
      name: "Business",
      subName: null,
      plan: "enterprise" as Plan,
      description: "Maximum power for established companies",
      subDescription: null,
      messages: "10,000 messages/month",
      price: currency === 'USD' ? "25" : "9500",
      priceMonthly: currency === 'USD' ? "$25 /mo" : "9500 ETB /mo",
      priceAnnually: null,
      buttonText: "Subscribe",
      buttonIcon: "Rocket",
      features: [
        "5,000 messages per month",
        "Unlimited Bookings",
        "Unlimited Room/Service types",
        "Premium AI (GPT-4o level)",
        "Unlimited Custom Fields",
        "Human takeover + Override",
        "Priority WhatsApp support",
        "Multiple business setups"
      ],
      isPopular: false
    },
    {
      id: "04",
      name: "Custom",
      subName: "Tailored for your needs",
      plan: "custom" as Plan,
      description: "Custom limits and dedicated solutions for enterprise scale",
      subDescription: "Specialized features.",
      messages: "Custom messages/month",
      price: null,
      priceMonthly: "Custom Pricing",
      priceAnnually: null,
      buttonText: "Contact Us",
      buttonIcon: "Phone",
      features: [
        "Custom messages per month",
        "Custom knowledge limits",
        "Custom product limits",
        "5,000 characters per item",
        "WhatsApp integration",
        "Automated AI responses",
        "Manual replies (Human takeover)",
        "Dedicated account manager",
        "Custom SLA guarantees"
      ],
      isPopular: false
    }
  ];

  const selectPlan = async (plan: Plan, messageLimit: number, price: string) => {
    if (currentPlan === plan) return;

    setLoading(true);
    try {
      if (!user) {
        toast({
          title: "Error",
          description: "You must be logged in to select a plan",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Ensure profile exists first (required for subscription foreign key)
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
          // 409 means it already exists (trigger created it) - this is fine
          if (profileError.code === '23505' || profileError.message.includes('duplicate') || profileError.message.includes('409')) {
            console.log('Profile already exists (created by trigger)');
          } else {
            console.error('Error creating profile:', profileError);
          }
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
          description: `You're now on the ${plan} trial. Explore our features!`,
        });

        navigate("/settings");
      } else {
        // For paid plans, open payment modal
        setSelectedPlanForPayment({ name: plan, price });
        setIsPaymentModalOpen(true);
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

  const getButtonIcon = (iconName: string) => {
    switch (iconName) {
      case "ArrowUpRight":
        return <ArrowUpRight className="w-4 h-4" />;
      case "Zap":
        return <Zap className="w-4 h-4" />;
      case "Rocket":
        return <Rocket className="w-4 h-4" />;
      case "Star":
        return <Star className="w-4 h-4" />;
      case "Phone":
        return <Phone className="w-4 h-4" />;
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Header */}
      <header className="border-b border-border/50 bg-card/30 backdrop-blur-xl">
        <div className="container mx-auto px-4 sm:px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-3">
            <img src="/favicon.webp" alt="Logo" className="w-8 h-8" loading="eager" width="32" height="32" style={{ aspectRatio: '1 / 1' }} />
            <span className="text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent">
              Resbonder
            </span>
          </div>
          <Button variant="ghost" onClick={() => navigate("/dashboard")} className="rounded-full">
            <ArrowLeft className="w-4 h-4 mr-2" />
            <span className="hidden sm:inline">Back</span>
          </Button>
        </div>
      </header>

      {/* Pricing Section */}
      <div className="container mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
        <div className="text-center mb-12 sm:mb-16">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold mb-4 text-foreground">Choose Your Plan</h1>
          <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
            Select the perfect plan for your business needs
          </p>
        </div>

        <div className="flex flex-col items-center gap-6 mb-12">
          <div className="flex bg-card/30 p-1.5 rounded-2xl border border-border/50 backdrop-blur-md shadow-lg">
            <button
              onClick={() => setCurrency('USD')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${currency === 'USD' ? 'bg-primary text-white shadow-glow-sm scale-105' : 'text-muted-foreground hover:bg-white/5'}`}
            >
              <DollarSign className={`w-4 h-4 transition-transform ${currency === 'USD' ? 'scale-110' : ''}`} />
              USD
            </button>
            <button
              onClick={() => setCurrency('ETB')}
              className={`flex items-center gap-2 px-6 py-2.5 rounded-xl text-sm font-bold transition-all duration-300 ${currency === 'ETB' ? 'bg-primary text-white shadow-glow-sm scale-105' : 'text-muted-foreground hover:bg-white/5'}`}
            >
              <Coins className={`w-4 h-4 transition-transform ${currency === 'ETB' ? 'scale-110' : ''}`} />
              ETB (Birr)
            </button>
          </div>

          <div className="flex items-center gap-2 text-xs font-semibold text-muted-foreground/80 bg-muted/20 px-4 py-1.5 rounded-full border border-border/30">
            <span className="w-1.5 h-1.5 rounded-full bg-primary animate-pulse" />
            Pricing updated for {currency}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-6xl mx-auto">
          {plans.map((planItem, index) => {
            const IconComponent = getButtonIcon(planItem.buttonIcon);
            const isCurrentPlan = currentPlan === planItem.plan;

            return (
              <Card
                key={index}
                className={`relative p-8 bg-card border-border/50 transition-all duration-300 ${planItem.isPopular
                  ? 'ring-2 ring-primary/50 shadow-glow lg:scale-105'
                  : 'hover:shadow-lg hover:border-primary/30'
                  }`}
              >
                {/* Plan Number */}
                <div className="absolute top-6 left-6 text-2xl font-bold text-muted-foreground/30">
                  {planItem.id}
                </div>

                {/* Most Popular Badge */}
                {planItem.isPopular && (
                  <div className="absolute top-6 right-6">
                    <div className="bg-primary/20 text-primary text-xs font-semibold px-3 py-1 rounded-full border border-primary/30 flex items-center gap-1.5">
                      <Star className="w-3 h-3 fill-current" />
                      Most popular
                    </div>
                  </div>
                )}

                <div className="mt-8">
                  {/* Plan Name */}
                  <div className="mb-2">
                    <h3 className="text-2xl font-bold text-foreground">{planItem.name}</h3>
                    {planItem.subName && (
                      <p className="text-lg font-semibold text-foreground mt-1">{planItem.subName}</p>
                    )}
                  </div>

                  {/* Description */}
                  <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                    {planItem.description}
                  </p>
                  {planItem.subDescription && (
                    <p className="text-sm text-muted-foreground/80 mb-6">{planItem.subDescription}</p>
                  )}

                  {/* Pricing */}
                  {planItem.price ? (
                    <div className="mb-6">
                      <div className="flex items-baseline gap-2 mb-1">
                        <span className="text-4xl font-bold text-foreground">
                          {currency === 'USD' ? '$' : 'ETB '}{planItem.price}
                        </span>
                        <span className="text-lg text-muted-foreground">/mo</span>
                      </div>
                      <p className="text-xs text-muted-foreground">{planItem.priceAnnually}</p>
                    </div>
                  ) : (
                    <div className="mb-6 h-16"></div>
                  )}

                  {/* Features */}
                  <div className="mb-8">
                    <p className="text-xs font-semibold text-muted-foreground mb-4 uppercase tracking-wider">
                      {index === 0 ? "Includes:" : index === 1 ? "Everything in Free, plus:" : "Everything in Starter, plus:"}
                    </p>
                    <ul className="space-y-3">
                      {planItem.features.map((feature, i) => (
                        <li key={i} className="flex items-start gap-3 text-sm text-foreground/90">
                          <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                          <span className="leading-relaxed">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </div>

                  {/* CTA Button */}
                  <Button
                    className={`w-full rounded-full ${planItem.isPopular
                      ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg'
                      : 'bg-foreground/5 hover:bg-foreground/10 text-foreground border border-border hover:border-primary/50'
                      }`}
                    variant={planItem.isPopular ? "default" : "outline"}
                    onClick={() => {
                      // Map plan to message limits based on database schema
                      const messageLimits: Record<string, number> = {
                        'Free Trial': 50,
                        'Starter': 500,
                        'Enterprise': 5000,
                        'Custom': 10000 // Default for custom, can be edited by admin
                      };
                      const messageLimit = messageLimits[planItem.name] || 50;
                      const price = planItem.price || "0";

                      if (planItem.name === 'Custom') {
                        // For custom plan, maybe redirect to a contact form or just show a message
                        toast({
                          title: "Contact Us",
                          description: "Please contact our team at team@resbonder.com for a custom plan.",
                        });
                        return;
                      }

                      selectPlan(planItem.plan, messageLimit, price);
                    }}
                    disabled={loading || isCurrentPlan}
                  >
                    {loading ? (
                      "Processing..."
                    ) : isCurrentPlan ? (
                      "Current Plan"
                    ) : (
                      <>
                        {planItem.buttonText}
                        {IconComponent && <span className="ml-2">{IconComponent}</span>}
                      </>
                    )}
                  </Button>
                </div>
              </Card>
            );
          })}
        </div>

        {/* Payment Instructions Card */}
        {showPaymentInfo && (
          <div className="mt-8 sm:mt-10 md:mt-12 max-w-3xl mx-auto px-4">
            <Card className="p-6 sm:p-7 md:p-8 bg-gradient-card border-border border-2 border-primary">
              <div className="flex flex-col sm:flex-row items-start gap-4">
                <div className="p-2 sm:p-3 bg-primary/10 rounded-lg flex-shrink-0">
                  <Phone className="w-6 h-6 sm:w-8 sm:h-8 text-primary" />
                </div>
                <div className="flex-1 w-full">
                  <h2 className="text-xl sm:text-2xl font-bold mb-3 sm:mb-4">Payment Instructions</h2>
                  <div className="space-y-4">
                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 sm:p-4 flex items-start gap-2 sm:gap-3">
                      <AlertCircle className="w-4 h-4 sm:w-5 sm:h-5 text-yellow-600 mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="text-sm sm:text-base font-semibold text-yellow-600">Payment Request Created</p>
                        <p className="text-xs sm:text-sm text-yellow-600/80">
                          Complete the payment and wait for admin verification
                        </p>
                      </div>
                    </div>

                    <div>
                      <h3 className="text-sm sm:text-base font-semibold mb-2">Payment Options:</h3>
                      <ul className="space-y-2 text-sm sm:text-base text-muted-foreground">
                        <li className="flex flex-col gap-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Check className="w-4 h-4 text-accent flex-shrink-0" />
                            <span>Zaad / eDahab:</span>
                            <span className="font-mono font-semibold text-foreground break-all">+252 63 3983250</span>
                          </div>
                          <p className="text-xs ml-6 opacity-70">Receiver: Cabdixakiin Bashir Ahmed</p>
                        </li>
                        <li className="flex flex-col gap-1">
                          <div className="flex flex-wrap items-center gap-2">
                            <Check className="w-4 h-4 text-accent flex-shrink-0" />
                            <span>eBirr:</span>
                            <span className="font-mono font-semibold text-foreground break-all">0995716810</span>
                          </div>
                          <p className="text-xs ml-6 opacity-70">Receiver: Ahmed Bashir Ahmed</p>
                        </li>
                      </ul>
                    </div>

                    <div className="bg-muted/50 p-3 sm:p-4 rounded-lg">
                      <h4 className="text-sm sm:text-base font-semibold mb-2">After Payment:</h4>
                      <ol className="list-decimal list-inside space-y-1 text-xs sm:text-sm text-muted-foreground">
                        <li>Take a screenshot of the transaction</li>
                        <li>Contact our team with your email and transaction reference</li>
                        <li>Wait for verification (usually within 24 hours)</li>
                        <li>Your plan will be activated automatically</li>
                      </ol>
                    </div>

                    <div className="pt-3 sm:pt-4">
                      <p className="text-xs sm:text-sm text-muted-foreground mb-2">Contact Team:</p>
                      <p className="text-xs sm:text-sm font-mono font-semibold break-all">Email: team@resbonder.com</p>
                      <p className="text-xs sm:text-sm font-mono font-semibold break-all">Phone: +251 958 172 222</p>
                    </div>
                  </div>
                </div>
              </div>
            </Card>
          </div>
        )}

        {/* Payment Modal */}
        {selectedPlanForPayment && (
          <PaymentModal
            isOpen={isPaymentModalOpen}
            onClose={() => setIsPaymentModalOpen(false)}
            planName={selectedPlanForPayment.name}
            amount={selectedPlanForPayment.price}
          />
        )}
      </div>
    </div>
  );
};

export default Pricing;
