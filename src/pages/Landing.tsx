import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { useNavigate } from "react-router-dom";
import { Bot, MessageSquare, Zap, Shield, TrendingUp, Check, ChevronDown, Mail, Phone, DollarSign, Coins } from "lucide-react";
import SplitText from "@/components/SplitText";
import { Footer } from "@/components/ui/footer-section";
import { FadeIn, SlideUp, SlideInLeft, SlideInRight, ScaleIn } from "@/components/ui/animate-on-scroll";
import { supabase } from "@/integrations/supabase/client";
import { DecorativePlatformIcons } from "@/components/DecorativePlatformIcons";

const Landing = () => {
  const navigate = useNavigate();
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [currency, setCurrency] = useState<'USD' | 'ETB'>('USD');
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'annually'>('monthly');

  const calculatePrice = (basePrice: number) => {
    if (billingCycle === 'annually') {
      return (basePrice * 10).toString(); // 2 months free equivalent
    }
    return basePrice.toString();
  };

  const plans = [
    {
      name: "Free Trial",
      messages: "50 total",
      price: "0",
      features: [
        "50 messages total (One-time)",
        "5 Bookings included",
        "2 Room/Service types",
        "Standard AI assistant",
        "WhatsApp integration",
        "No custom fields",
        "AI only (No human takeover)"
      ]
    },
    {
      name: "Pro",
      messages: "500",
      price: currency === 'USD'
        ? calculatePrice(5)
        : calculatePrice(1000),
      features: [
        "500 messages per month",
        "50 Bookings included",
        "10 Room/Service types",
        "Advanced AI assistant",
        "Unlimited Custom Fields",
        "Manual replies (Human takeover)",
        "Priority Email support"
      ]
    },
    {
      name: "Business",
      messages: "5000",
      price: currency === 'USD'
        ? calculatePrice(25)
        : calculatePrice(5000),
      features: [
        "5,000 messages per month",
        "Unlimited Bookings",
        "Unlimited Room/Service types",
        "Premium AI (GPT-4o level)",
        "Unlimited Custom Fields",
        "Human takeover + Override",
        "Priority WhatsApp support"
      ]
    },
    {
      name: "Custom",
      messages: "Custom",
      price: "?",
      features: [
        "Custom messages per month",
        "Custom knowledge limits",
        "Custom product limits",
        "5,000 characters per item",
        "WhatsApp integration",
        "Automated AI responses",
        "Manual replies (Human takeover)"
      ]
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
        <section className="relative py-20 md:py-32 lg:py-40 overflow-hidden" aria-label="Hero section">
          <div className="absolute inset-0 bg-gradient-to-b from-background via-background to-background/50"></div>
          {/* Decorative Platform Icons - Desktop only in hero */}
          <div className="hidden md:block">
            <DecorativePlatformIcons />
          </div>
          <div className="container mx-auto px-4 text-center relative z-10">
            <div className="max-w-5xl mx-auto">
              <div className="text-4xl sm:text-5xl md:text-6xl lg:text-7xl font-bold mb-6 sm:mb-8 leading-tight">
                <SplitText
                  text="Your AI Business Agent"
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
              <p className="text-lg sm:text-xl md:text-2xl text-muted-foreground mb-8 sm:mb-10 max-w-3xl mx-auto leading-relaxed">
                Create an intelligent AI chatbot that handles customer questions and automated bookings 24/7 on WhatsApp. Experience seamless customer support with AI and human takeover.
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
                <h2 className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-bold mb-4 text-foreground">Powerful Features for AI Customer Support</h2>
                <p className="text-lg sm:text-xl text-muted-foreground max-w-2xl mx-auto">
                  Everything you need to automate customer support with AI-powered WhatsApp bots
                </p>
              </SlideUp>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 lg:gap-8">
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

        {/* Pricing Section */}
        <section className="py-12 sm:py-16 md:py-20 overflow-hidden" aria-label="Pricing plans">
          <div className="container mx-auto px-4 sm:px-6">
            <div className="text-center mb-10 sm:mb-12 md:mb-16">
              <SlideUp>
                <h2 className="text-2xl sm:text-3xl md:text-4xl lg:text-5xl font-bold mb-3 sm:mb-4">Simple, Transparent Pricing for AI Chatbot Plans</h2>
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

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6 md:gap-8 max-w-6xl mx-auto">
              {plans.map((plan, index) => (
                <ScaleIn key={index} delay={0.1 * index}>
                  <Card className={`p-6 sm:p-7 md:p-8 bg-gradient-card border-border transition-all duration-300 hover:shadow-lg ${index === 1 ? 'ring-2 ring-primary shadow-glow md:scale-105' : 'hover:scale-[1.02]'}`}>
                    {index === 1 && (
                      <div className="bg-gradient-primary text-white text-sm font-semibold px-3 py-1 rounded-full inline-block mb-4">
                        Most Popular
                      </div>
                    )}
                    <h3 className="text-xl sm:text-2xl font-bold mb-2">{plan.name}</h3>
                    <div className="mb-4 sm:mb-6">
                      <span className="text-4xl sm:text-5xl font-bold">
                        {plan.name === 'Custom' ? 'Contact' : (plan.price === '0' ? 'Free' : (currency === 'USD' ? '$' : 'ETB ') + plan.price)}
                      </span>
                      <span className="text-muted-foreground">
                        {plan.name === 'Custom' || plan.name === 'Free Trial' ? '' : (billingCycle === 'monthly' ? '/mo' : '/yr')}
                      </span>
                    </div>
                    <div className="mb-4 sm:mb-6">
                      <div className="text-sm sm:text-base text-muted-foreground mb-3 sm:mb-4">
                        <TrendingUp className="w-4 h-4 sm:w-5 sm:h-5 inline mr-2" />
                        {plan.messages === 'Custom' ? 'Tailored message limits' : `${plan.messages} messages${plan.name === 'Free Trial' ? '' : (billingCycle === 'monthly' ? '/mo' : '/mo')}`}
                      </div>
                      <ul className="space-y-2 sm:space-y-3">
                        {plan.features.map((feature, i) => (
                          <li key={i} className="flex items-start gap-2 text-sm sm:text-base">
                            <Check className="w-4 h-4 sm:w-5 sm:h-5 text-accent mt-0.5 flex-shrink-0" />
                            <span>{feature}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    {plan.name === 'Custom' ? (
                      <Button
                        className={`w-full transition-all`}
                        variant={'outline'}
                        onClick={() => {
                          const message = encodeURIComponent("Hello, I am interested in the Custom plan. / Asc, waxaan rabaa inaan faahfaahin ka helo qorshaha Custom-ka.");
                          window.open(`https://wa.me/251995817222?text=${message}`, '_blank');
                        }}
                      >
                        Contact Us
                      </Button>
                    ) : (
                      <Button
                        className={`w-full transition-all ${index === 1 ? 'bg-gradient-primary hover:opacity-90' : ''}`}
                        variant={index === 1 ? 'default' : 'outline'}
                        onClick={() => navigate('/auth?mode=signup')}
                      >
                        Get Started
                      </Button>
                    )}
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