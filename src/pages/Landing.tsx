import { useRef, useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Bot, MessageSquare, Zap, Shield, TrendingUp, Check, ChevronDown, Mail, Phone, DollarSign, Coins, Star, Rocket, ArrowUpRight, AlertCircle } from "lucide-react";
import { animate } from "framer-motion";
import SplitText from "@/components/SplitText";
import { Footer } from "@/components/ui/footer-section";
import { FadeIn, SlideUp, SlideInLeft, SlideInRight, ScaleIn } from "@/components/ui/animate-on-scroll";
import { supabase } from "@/integrations/supabase/client";
import { DecorativePlatformIcons } from "@/components/DecorativePlatformIcons";

const CountUp = ({ value, prefix = "", suffix = "" }: { value: number; prefix?: string; suffix?: string }) => {
  const ref = useRef<HTMLSpanElement>(null);
  const prevValue = useRef(0);

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    const controls = animate(prevValue.current, value, {
      duration: 0.8,
      ease: "easeOut",
      onUpdate(v) {
        element.textContent = `${prefix}${Math.round(v)}${suffix}`;
      },
    });

    prevValue.current = value;
    return () => controls.stop();
  }, [value, prefix, suffix]);

  return <span ref={ref} />;
};

const Landing = () => {
  const navigate = useNavigate();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [currency, setCurrency] = useState<'USD' | 'ETB'>('USD');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly');

  const faqs = [
    {
      question: "What is Resbonder?",
      answer: "Resbonder is an AI-powered customer support and booking automation platform for WhatsApp. Upload your business knowledge, and our AI will handle customer questions and automated booking flows 24/7."
    },
    {
      question: "How does the AI chatbot work?",
      answer: "Our AI chatbot uses advanced natural language processing to understand customer questions and respond using your uploaded business data. Simply input text about your products and services, and the AI learns from this information to provide accurate, contextual responses."
    },
    {
      question: "Which platforms does Resbonder support?",
      answer: "Resbonder supports WhatsApp Business API. Our platform provides a seamless automated experience for your customers on WhatsApp."
    },
    {
      question: "How much does Resbonder cost?",
      answer: "We offer four plans: Free Trial, Starter ($5/month), Enterprise ($25/month), and Custom. Our Free Trial gives you a taste of AI automation with no credit card required."
    },
    {
      question: "How quickly can I set up my AI chatbot?",
      answer: "Setup takes just minutes! After signing up, upload your business data (text information or products), connect your WhatsApp Business API, and you're ready to go. Your AI chatbot will start responding to customer inquiries immediately."
    },
    {
      question: "Is my business data secure?",
      answer: "Yes, security is our top priority. We use enterprise-grade encryption and follow industry best practices to protect your data. Your business information is stored securely and only used to train your AI chatbot responses."
    },
    {
      question: "Do spam or off-topic messages count towards my limit?",
      answer: "No. We have a smart filtering system that automatically detects and ignores spam, abusive language, and completely off-topic messages. These are filtered out and do NOT count towards your monthly message limit, so you only pay for valid business interactions."
    },
    {
      question: "Does your AI support Somali language?",
      answer: "Yes! We're the only WhatsApp AI platform with native Somali language support. You can configure your AI to respond in either Somali (Soomaali) or English. Simply select your preferred language in the settings, and your AI will consistently respond in that language. This makes us perfect for businesses in Somalia, Somaliland, Djibouti, and the Ethiopian Somali Region."
    },
    {
      question: "Can I choose which language my AI uses?",
      answer: "Absolutely! You have full control over your AI's language. In your dashboard settings, you can select either Somali or English as your AI's response language. Once configured, your AI will consistently respond in your chosen language, ensuring a consistent experience for your customers."
    },
    {
      question: "Can I change the AI language after setup?",
      answer: "Yes! You can change your AI's language at any time from your dashboard settings. Simply select your preferred language (Somali or English), save your configuration, and your AI will immediately start responding in the new language. This flexibility allows you to adapt to your customer base."
    }
  ];

  const features = [
    {
      icon: Bot,
      title: "AI-Powered Chat",
      description: "Advanced AI agent that understands your business and responds intelligently using your data"
    },
    {
      icon: Zap,
      title: "Automated Bookings",
      description: "Let AI handle your reservation and booking flows automatically on WhatsApp"
    },
    {
      icon: MessageSquare,
      title: "Human Takeover",
      description: "Seamlessly jump into any conversation when manual intervention is needed"
    },
    {
      icon: Shield,
      title: "Secure & Reliable",
      description: "Enterprise-grade security with 99.9% uptime for your business automation"
    },
    {
      icon: TrendingUp,
      title: "Native Multi-language Support",
      description: "Choose your AI language - Somali, English, or others. Serve customers in their preferred language with cultural context awareness"
    }
  ];

  const getButtonIcon = (iconName: string) => {
    switch (iconName) {
      case 'ArrowUpRight': return <ArrowUpRight className="w-4 h-4" />;
      case 'Zap': return <Zap className="w-4 h-4" />;
      case 'Rocket': return <Rocket className="w-4 h-4" />;
      case 'Phone': return <Phone className="w-4 h-4" />;
      default: return null;
    }
  };

  const calculatePrice = (basePrice: number) => {
    if (billingCycle === 'annually') {
      return (basePrice * 10).toString(); // 2 months free equivalent
    }
    return basePrice.toString();
  };

  const plans = [
    {
      id: "01",
      name: "Free Trial",
      subName: "Try for 30 days",
      description: "One-time trial for new users to test our AI assistant",
      subDescription: "No credit card required.",
      messages: "50 total",
      price: "0",
      buttonText: "Get Started",
      buttonIcon: "ArrowUpRight",
      features: [
        "50 messages total (One-time)",
        "5 Bookings included",
        "2 Room/Service types",
        "Somali + English AI",
        "Standard AI assistant",
        "WhatsApp integration",
        "No custom fields",
        "AI only (No human takeover)",
        "Spam, Abuse & Unrelated massges (Not Counted)"
      ],
      isPopular: false
    },
    {
      id: "02",
      name: "Pro",
      subName: null,
      description: "Higher limits & premium features for growing businesses",
      subDescription: null,
      messages: "500",
      price: currency === 'USD'
        ? calculatePrice(5)
        : calculatePrice(1000),
      buttonText: "Subscribe",
      buttonIcon: "Zap",
      features: [
        "500 messages per month",
        "50 Bookings included",
        "10 Room/Service types",
        "Somali or English AI",
        "Choose your AI language",
        "Advanced AI assistant",
        "Unlimited Custom Fields",
        "Manual replies (Human takeover)",
        "Priority Email support",
        "Detailed dashboard metrics",
        "Spam, Abuse & Unrelated massges (Not Counted)"
      ],
      isPopular: true
    },
    {
      id: "03",
      name: "Business",
      subName: null,
      description: "Maximum power for established companies",
      subDescription: null,
      messages: "5000",
      price: currency === 'USD'
        ? calculatePrice(25)
        : calculatePrice(5000),
      buttonText: "Subscribe",
      buttonIcon: "Rocket",
      features: [
        "5,000 messages per month",
        "Unlimited Bookings",
        "Unlimited Room/Service types",
        "Somali + English AI (Premium)",
        "Cultural context awareness",
        "Premium AI (GPT-4o level)",
        "Unlimited Custom Fields",
        "Human takeover + Override",
        "Priority WhatsApp support",
        "Multiple business setups",
        "Spam, Abuse & Unrelated massges (Not Counted)"
      ],
      isPopular: false
    },
    {
      id: "04",
      name: "Custom",
      subName: "Tailored for your needs",
      description: "Custom limits and dedicated solutions for enterprise scale",
      subDescription: "Specialized features.",
      messages: "Custom messages/month",
      price: "?",
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
        "Spam, Abuse & Unrelated massges (Not Counted)"
      ],
      isPopular: false
    }
  ];

  // Add FAQ structured data
  useEffect(() => {
    const faqSchema = {
      "@context": "https://schema.org",
      "@type": "FAQPage",
      "mainEntity": faqs.map(faq => ({
        "@type": "Question",
        "name": faq.question,
        "acceptedAnswer": {
          "@type": "Answer",
          "text": faq.answer
        }
      }))
    };

    let scriptTag = document.getElementById('faq-structured-data');
    if (!scriptTag) {
      scriptTag = document.createElement('script');
      scriptTag.id = 'faq-structured-data';
      scriptTag.type = 'application/ld+json';
      document.head.appendChild(scriptTag);
    }
    scriptTag.textContent = JSON.stringify(faqSchema);
  }, []);

  return (
    <div className="min-h-screen bg-gradient-background">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b border-border/50 bg-card/30 backdrop-blur-xl transition-all duration-300">
        <div className="container mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex h-16 sm:h-20 items-center justify-between">
            {/* Logo Section */}
            <div className="flex items-center gap-3 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
              <div className="relative">
                <div className="absolute inset-0 bg-primary/20 blur-xl rounded-full group-hover:opacity-40 transition-opacity duration-300"></div>
                <img
                  src="/favicon.webp"
                  alt="Resbonder Logo"
                  className="relative w-10 h-10 sm:w-12 sm:h-12 lg:w-14 lg:h-14 transition-transform duration-300 group-hover:scale-110"
                  loading="eager"
                  fetchpriority="high"
                  width="56"
                  height="56"
                  style={{ aspectRatio: '1 / 1' }}
                />
              </div>
              <span className="text-xl sm:text-2xl lg:text-3xl font-bold bg-gradient-primary bg-clip-text text-transparent tracking-tight">
                Resbonder
              </span>
            </div>

            {/* Navigation Actions */}
            <div className="flex items-center gap-3">
              <Button
                variant="ghost"
                onClick={() => navigate("/auth?mode=signin")}
                className="rounded-full font-medium hover:bg-accent/50 transition-all duration-200"
              >
                Login
              </Button>
              <Button
                onClick={() => navigate("/auth?mode=signup")}
                className="bg-primary hover:bg-primary/90 font-semibold rounded-full shadow-md hover:shadow-lg transition-all duration-300"
              >
                Get Started
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="relative py-12 md:py-16 lg:py-20 overflow-hidden" aria-label="Hero section">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background/50"></div>
          {/* Decorative Platform Icons - Desktop only in hero */}
          <div className="hidden md:block">
            <DecorativePlatformIcons />
          </div>
          <div className="container mx-auto px-4 text-center relative z-10">
            <div className="max-w-5xl mx-auto">
              {/* Language Support Badge */}
              <div className="flex justify-center mb-6">
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-primary/20 to-accent/20 border border-primary/30 rounded-full backdrop-blur-sm">
                  <span className="text-sm font-semibold text-foreground">Multi-language</span>
                  <span className="text-muted-foreground">Support</span>
                  <span className="ml-2 text-xs bg-primary text-primary-foreground px-2 py-0.5 rounded-full">Native Support</span>
                </div>
              </div>
              <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 sm:mb-8 leading-tight">
                <SplitText
                  text="Automated AI Business Agent"
                  className="block text-foreground"
                  tag="h1"
                  delay={100}
                  duration={0.6}
                  ease="power3.out"
                  splitType="chars"
                  from={{ opacity: 0, y: 40 }}
                  to={{ opacity: 1, y: 0 }}
                  threshold={0.1}
                  rootMargin="-100px"
                  textAlign="center"
                />
                <SplitText
                  text="On WhatsApp"
                  className="block bg-gradient-primary bg-clip-text text-transparent mt-2"
                  tag="span"
                  delay={150}
                  duration={0.6}
                  ease="power3.out"
                  splitType="chars"
                  from={{ opacity: 0, y: 40 }}
                  to={{ opacity: 1, y: 0 }}
                  threshold={0.1}
                  rootMargin="-100px"
                  textAlign="center"
                />
              </div>
              <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-4 max-w-3xl mx-auto leading-relaxed">
                The only WhatsApp AI with <span className="text-primary font-semibold">native multi-language support</span>. Create an intelligent AI chatbot that handles customer questions and automated bookings 24/7 in Somali, English.
              </p>
              <p className="text-base sm:text-lg text-muted-foreground/80 mb-8 sm:mb-10 max-w-2xl mx-auto">
                Built for any business • Choose your AI language • Cultural context awareness
              </p>
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button
                  size="lg"
                  onClick={() => navigate("/auth?mode=signup")}
                  className="bg-primary hover:bg-primary/90 shadow-lg hover:shadow-xl rounded-full text-base sm:text-lg px-8"
                >
                  Start Free Trial
                </Button>
                <Button
                  size="lg"
                  variant="outline"
                  onClick={() => document.getElementById('features')?.scrollIntoView({ behavior: 'smooth' })}
                  className="rounded-full text-base sm:text-lg px-8 border-border hover:border-primary/50"
                >
                  Learn More
                </Button>
              </div>
            </div>
          </div>
        </section>

        {/* WhatsApp Icon - Mobile: Between sections */}
        <div className="md:hidden">
          <DecorativePlatformIcons />
        </div>

        {/* Features Section */}
        <section id="features" className="py-16 sm:py-20 md:py-24 lg:py-32 overflow-hidden" aria-label="Features">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center mb-12 sm:mb-16 md:mb-20">
              <SlideUp>
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-foreground">Powerful AI Chatbot Features</h2>
                <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                  Everything you need to automate customer support with AI-powered WhatsApp bots
                </p>
              </SlideUp>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 lg:gap-8 max-w-5xl mx-auto">
              {features.map((feature, index) => (
                <SlideUp key={index} delay={0.1 * index}>
                  <article className="p-6 sm:p-8 bg-card border-border/50 hover:shadow-lg hover:border-primary/30 transition-all duration-300 h-full group rounded-lg border">
                    <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                      <feature.icon className="w-6 h-6 text-primary" aria-hidden="true" />
                    </div>
                    <h3 className="text-xl font-semibold mb-3 text-foreground">{feature.title}</h3>
                    <p className="text-sm text-muted-foreground leading-relaxed">{feature.description}</p>
                  </article>
                </SlideUp>
              ))}
            </div>
          </div>
        </section>

        {/* Language Support Showcase Section */}
        <section className="py-16 sm:py-20 md:py-24 bg-gradient-to-b from-background to-muted/20 overflow-hidden" aria-label="Language Support">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center mb-12 sm:mb-16">
              <SlideUp>
                <div className="inline-flex items-center gap-2 px-4 py-2 bg-primary/10 border border-primary/30 rounded-full mb-4">
                  <span className="text-sm font-semibold text-primary">Native Multi-language AI</span>
                </div>
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-foreground">
                  The Only WhatsApp AI Built for Global Reach
                </h2>
                <p className="text-lg sm:text-xl text-muted-foreground max-w-3xl mx-auto">
                  Choose your AI language - Somali, English, or more. Serve your customers with culturally-aware responses in their preferred language
                </p>
              </SlideUp>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8 lg:gap-12 max-w-6xl mx-auto mb-12">
              {/* Conversation Example */}
              <SlideInLeft>
                <Card className="p-6 sm:p-8 bg-card border-border/50 h-full">
                  <h3 className="text-xl font-semibold mb-6 flex items-center gap-2">
                    <MessageSquare className="w-5 h-5 text-primary" />
                    Bilingual Conversations
                  </h3>
                  <div className="space-y-4">
                    {/* Customer message in Somali */}
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        👤
                      </div>
                      <div className="flex-1">
                        <div className="bg-muted/50 rounded-lg p-3">
                          <p className="text-sm">Qolka single-ka ah waa imisa?</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Detected: Somali</p>
                      </div>
                    </div>
                    {/* AI response in Somali */}
                    <div className="flex gap-3 justify-end">
                      <div className="flex-1 text-right">
                        <div className="bg-primary/10 rounded-lg p-3 inline-block">
                          <p className="text-sm">Waad kumahadsantahay suaashaada! Qolka single-ka ah waa $50 habeenkii. Miyaad rabtaa inaan kuu qabto?</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">🤖 AI Response: Somali</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        🤖
                      </div>
                    </div>
                    {/* Customer switches to English */}
                    <div className="flex gap-3">
                      <div className="w-8 h-8 rounded-full bg-muted flex items-center justify-center flex-shrink-0">
                        👤
                      </div>
                      <div className="flex-1">
                        <div className="bg-muted/50 rounded-lg p-3">
                          <p className="text-sm">Yes, I want to book for 2 nights</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">Detected: English</p>
                      </div>
                    </div>
                    {/* AI responds in English */}
                    <div className="flex gap-3 justify-end">
                      <div className="flex-1 text-right">
                        <div className="bg-primary/10 rounded-lg p-3 inline-block">
                          <p className="text-sm">Perfect! I'll help you book for 2 nights. What dates would you like?</p>
                        </div>
                        <p className="text-xs text-muted-foreground mt-1">🤖 AI Response: English</p>
                      </div>
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center flex-shrink-0">
                        🤖
                      </div>
                    </div>
                  </div>
                </Card>
              </SlideInLeft>

              {/* Key Benefits */}
              <SlideInRight>
                <div className="space-y-6">
                  <Card className="p-6 bg-card border-border/50 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center flex-shrink-0">
                        <Zap className="w-6 h-6 text-primary" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Choose Your AI Language</h4>
                        <p className="text-sm text-muted-foreground">
                          Select whether your AI responds in Somali or English. Configure your preferred language in settings
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 bg-card border-border/50 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-accent/10 flex items-center justify-center flex-shrink-0">
                        <Bot className="w-6 h-6 text-accent" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Cultural Context Awareness</h4>
                        <p className="text-sm text-muted-foreground">
                          Trained on Somali business terminology and cultural nuances for natural, respectful conversations
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 bg-card border-border/50 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-emerald-500/10 flex items-center justify-center flex-shrink-0">
                        <TrendingUp className="w-6 h-6 text-emerald-500" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">Built for Global Business</h4>
                        <p className="text-sm text-muted-foreground">
                          Designed for businesses in any region, with full support for multiple languages and currencies
                        </p>
                      </div>
                    </div>
                  </Card>

                  <Card className="p-6 bg-gradient-primary text-white border-0 hover:shadow-xl transition-all duration-300">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-white/20 flex items-center justify-center flex-shrink-0">
                        <Shield className="w-6 h-6" />
                      </div>
                      <div>
                        <h4 className="font-semibold mb-2">No Competitor Has This</h4>
                        <p className="text-sm opacity-90">
                          We're the only WhatsApp AI platform with advanced multi-language support and cultural awareness.
                        </p>
                      </div>
                    </div>
                  </Card>
                </div>
              </SlideInRight>
            </div>

            {/* Stats */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 max-w-4xl mx-auto">
              <ScaleIn delay={0.1}>
                <Card className="p-6 text-center bg-card border-border/50">
                  <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">2</div>
                  <p className="text-sm text-muted-foreground">Languages Supported</p>
                  <p className="text-xs text-muted-foreground mt-1">Somali + English</p>
                </Card>
              </ScaleIn>
              <ScaleIn delay={0.2}>
                <Card className="p-6 text-center bg-card border-border/50">
                  <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">95%+</div>
                  <p className="text-sm text-muted-foreground">Detection Accuracy</p>
                  <p className="text-xs text-muted-foreground mt-1">Automatic language detection</p>
                </Card>
              </ScaleIn>
              <ScaleIn delay={0.3}>
                <Card className="p-6 text-center bg-card border-border/50">
                  <div className="text-3xl sm:text-4xl font-bold text-primary mb-2">24/7</div>
                  <p className="text-sm text-muted-foreground">Bilingual Support</p>
                  <p className="text-xs text-muted-foreground mt-1">Always available in both languages</p>
                </Card>
              </ScaleIn>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <section className="py-12 sm:py-16 md:py-20 overflow-hidden" aria-label="Pricing plans">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center mb-10 sm:mb-12 md:mb-16">
              <SlideUp>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">Flexible Pricing for Your AI WhatsApp Chatbots</h2>
                <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
                  Choose the plan that fits your business needs. Start with our one-time Free Trial.
                </p>
              </SlideUp>
            </div>

            <div className="flex flex-col items-center gap-6 mb-12">
              <div className="inline-flex flex-wrap justify-center items-center p-1.5 bg-muted/30 border border-border/50 rounded-full backdrop-blur-sm gap-2 sm:gap-4">

                {/* Currency Toggle */}
                <div className="flex items-center bg-background rounded-full p-1 shadow-sm border border-border/20">
                  <button
                    onClick={() => setCurrency('USD')}
                    className={`px-4 sm:px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${currency === 'USD'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                  >
                    USD
                  </button>
                  <button
                    onClick={() => setCurrency('ETB')}
                    className={`px-4 sm:px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${currency === 'ETB'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                  >
                    ETB (Birr)
                  </button>
                </div>

                {/* Billing Toggle */}
                <div className="flex items-center bg-background rounded-full p-1 shadow-sm border border-border/20">
                  <button
                    onClick={() => setBillingCycle('monthly')}
                    className={`px-4 sm:px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${billingCycle === 'monthly'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                  >
                    Monthly
                  </button>
                  <button
                    onClick={() => setBillingCycle('annually')}
                    className={`px-4 sm:px-6 py-2 rounded-full text-sm font-medium transition-all duration-200 ${billingCycle === 'annually'
                      ? 'bg-primary text-primary-foreground shadow-sm'
                      : 'text-muted-foreground hover:text-foreground hover:bg-muted/50'
                      }`}
                  >
                    Yearly
                  </button>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8 max-w-7xl mx-auto px-4">
              {plans.map((plan, index) => (
                <ScaleIn key={index} delay={0.1 * index}>
                  <Card className={`relative p-8 bg-card border-border/50 transition-all duration-300 ${plan.isPopular
                    ? 'ring-2 ring-primary/50 shadow-glow lg:scale-105'
                    : 'hover:shadow-lg hover:border-primary/30'
                    }`}>
                    {/* Plan Number */}
                    <div className="absolute top-6 left-6 text-2xl font-bold text-muted-foreground/30">
                      {plan.id}
                    </div>

                    {/* Most Popular Badge */}
                    {plan.isPopular && (
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
                        <h3 className="text-2xl font-bold text-foreground">{plan.name}</h3>
                        {plan.subName && (
                          <p className="text-lg font-semibold text-foreground mt-1">{plan.subName}</p>
                        )}
                      </div>

                      {/* Description */}
                      <p className="text-sm text-muted-foreground mb-6 leading-relaxed">
                        {plan.description}
                      </p>
                      {plan.subDescription && (
                        <p className="text-sm text-muted-foreground/80 mb-6">{plan.subDescription}</p>
                      )}

                      {/* Pricing */}
                      <div className="mb-6">
                        <div className="flex items-baseline gap-2 mb-1">
                          <span className="text-4xl font-bold text-foreground">
                            {plan.name === 'Custom' ? (
                              'Contact'
                            ) : plan.price === '0' ? (
                              'Free'
                            ) : (
                              <CountUp
                                value={Number(plan.price)}
                                prefix={currency === 'USD' ? '$' : 'ETB '}
                              />
                            )}
                          </span>
                          {plan.name !== 'Custom' && plan.name !== 'Free Trial' && (
                            <span className="text-lg text-muted-foreground">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                          )}
                        </div>
                      </div>

                      {/* Messages Limit */}
                      <div className="text-sm text-muted-foreground mb-6 flex items-center gap-2">
                        <TrendingUp className="w-4 h-4 text-primary" />
                        {plan.messages === 'Custom' ? 'Tailored message limits' : `${plan.messages} messages/month`}
                      </div>

                      {/* Features */}
                      <div className="mb-8">
                        <p className="text-xs font-semibold text-muted-foreground mb-4 uppercase tracking-wider">
                          {index === 0 ? "Includes:" : index === 1 ? "Everything in Free, plus:" : "Everything in Starter, plus:"}
                        </p>
                        <ul className="space-y-3">
                          {plan.features.map((feature, i) => (
                            <li key={i} className="flex items-start gap-3 text-sm text-foreground/90">
                              <Check className="w-5 h-5 text-primary flex-shrink-0 mt-0.5" />
                              <span className="leading-relaxed">{feature}</span>
                            </li>
                          ))}
                        </ul>
                      </div>

                      {/* CTA Button */}
                      <Button
                        className={`w-full rounded-full ${plan.isPopular
                          ? 'bg-primary text-primary-foreground hover:bg-primary/90 shadow-md hover:shadow-lg'
                          : 'bg-foreground/5 hover:bg-foreground/10 text-foreground border border-border hover:border-primary/50'
                          }`}
                        variant={plan.isPopular ? "default" : "outline"}
                        onClick={() => {
                          if (plan.name === 'Custom') {
                            const message = encodeURIComponent("Hello, I am interested in the Custom plan. / Asc, waxaan rabaa inaan faahfaahin ka helo qorshaha Custom-ka.");
                            window.open(`https://wa.me/251995817222?text=${message}`, '_blank');
                            return;
                          }
                          navigate('/auth?mode=signup');
                        }}
                      >
                        {plan.buttonText}
                        {getButtonIcon(plan.buttonIcon) && <span className="ml-2">{getButtonIcon(plan.buttonIcon)}</span>}
                      </Button>
                    </div>
                  </Card>
                </ScaleIn>
              ))}
            </div>
          </div>
        </section>

        {/* FAQ Section */}
        <section className="py-12 sm:py-16 md:py-20 overflow-hidden" aria-label="Frequently asked questions">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center mb-10 sm:mb-12 md:mb-16">
              <SlideUp>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">Frequently Asked Questions</h2>
                <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl mx-auto px-4">
                  Everything you need to know about Resbonder AI chatbot platform
                </p>
              </SlideUp>
            </div>
            <div className="max-w-3xl mx-auto space-y-4">
              {faqs.map((faq, index) => (
                <SlideUp key={index} delay={0.1 * index}>
                  <article className="bg-card border border-border/50 rounded-lg overflow-hidden">
                    <button
                      className="w-full px-6 py-4 text-left flex items-center justify-between hover:bg-accent/50 transition-colors"
                      onClick={() => setOpenFaqIndex(openFaqIndex === index ? null : index)}
                      aria-expanded={openFaqIndex === index}
                      aria-controls={`faq-answer-${index}`}
                    >
                      <h3 className="text-lg font-semibold pr-4">{faq.question}</h3>
                      <ChevronDown
                        className={`w-5 h-5 flex-shrink-0 transition-transform ${openFaqIndex === index ? 'rotate-180' : ''}`}
                        aria-hidden="true"
                      />
                    </button>
                    {openFaqIndex === index && (
                      <div id={`faq-answer-${index}`} className="px-6 pb-4">
                        <p className="text-muted-foreground leading-relaxed">{faq.answer}</p>
                      </div>
                    )}
                  </article>
                </SlideUp>
              ))}
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="py-12 sm:py-16 md:py-20 bg-gradient-hero text-white overflow-hidden" aria-label="Call to action">
          <div className="container mx-auto px-4 sm:px-6 text-center">
            <SlideUp>
              <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 sm:mb-6 px-4">
                Ready to Transform Customer Support with AI?
              </h2>
              <p className="text-base sm:text-lg md:text-xl mb-6 sm:mb-8 max-w-2xl mx-auto opacity-90 px-4">
                Join hundreds of businesses using Resbonder AI chatbot to provide instant, intelligent customer support on WhatsApp
              </p>
              <Button
                size="lg"
                variant="secondary"
                onClick={() => navigate("/auth?mode=signup")}
                className="text-base sm:text-lg px-6 sm:px-8 hover:scale-105 transition-transform"
              >
                Start Your Free Trial
              </Button>
            </SlideUp>
          </div>
        </section>

        {/* Contact Us Section */}
        <section className="py-12 sm:py-16 md:py-20 overflow-hidden" aria-label="Contact us">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="max-w-4xl mx-auto">
              <SlideUp>
                <div className="text-center mb-8 sm:mb-12">
                  <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-4 text-foreground">
                    Get in Touch
                  </h2>
                  <p className="text-base sm:text-lg text-muted-foreground max-w-2xl mx-auto">
                    Have questions? We're here to help. Reach out to us via WhatsApp or email.
                  </p>
                </div>
              </SlideUp>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 sm:gap-8">
                <SlideUp delay={0.1}>
                  <Card className="p-6 sm:p-8 bg-gradient-card border-border hover:shadow-lg transition-all duration-300 group">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                        <Phone className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2 text-foreground">WhatsApp</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Chat with us on WhatsApp
                      </p>
                      <a
                        href="https://wa.me/251995817222"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors"
                      >
                        <MessageSquare className="w-5 h-5" />
                        <span>+251 995 817 222</span>
                      </a>
                    </div>
                  </Card>
                </SlideUp>
                <SlideUp delay={0.2}>
                  <Card className="p-6 sm:p-8 bg-gradient-card border-border hover:shadow-lg transition-all duration-300 group">
                    <div className="flex flex-col items-center text-center">
                      <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mb-4 group-hover:bg-primary/20 transition-colors">
                        <Mail className="w-8 h-8 text-primary" />
                      </div>
                      <h3 className="text-xl font-semibold mb-2 text-foreground">Email</h3>
                      <p className="text-sm text-muted-foreground mb-4">
                        Send us an email
                      </p>
                      <a
                        href="mailto:team@resbonder.online"
                        className="inline-flex items-center gap-2 text-primary hover:text-primary/80 font-medium transition-colors break-all"
                      >
                        <Mail className="w-5 h-5" />
                        <span>team@resbonder.online</span>
                      </a>
                    </div>
                  </Card>
                </SlideUp>
              </div>
            </div>
          </div>
        </section>
      </main>

      <Footer />
    </div>
  );
};

export default Landing;