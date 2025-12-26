import { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CheckCircle, Circle, ExternalLink, MessageSquare, Building, AppWindow, Link } from "lucide-react";
import AppLayout from "@/components/AppLayout";

const WhatsAppGuide = () => {
  const [completedSteps, setCompletedSteps] = useState<number[]>([]);

  const toggleStepCompletion = (step: number) => {
    if (completedSteps.includes(step)) {
      setCompletedSteps(completedSteps.filter(s => s !== step));
    } else {
      setCompletedSteps([...completedSteps, step]);
    }
  };

  const isStepCompleted = (step: number) => completedSteps.includes(step);

  const requirements = [
    "A Facebook Account (required to log in)",
    "A new phone number not connected to WhatsApp",
    "A Facebook Page",
    "A WhatsApp Business Portfolio",
    "Internet connection",
    "YouTube tutorials provided below",
    "Support contact email (placeholder)"
  ];

  const steps = [
    {
      id: 1,
      title: "Create Your Facebook Page",
      description: "To use WhatsApp Business API, Meta requires every business to have an official Facebook Page. This page represents your business identity and is linked to your WhatsApp Business profile. The page does not need posts — just the business name and category.",
      link: "https://www.facebook.com/pages/create",
      youtubeUrl: "https://www.youtube.com/embed/EvpLrkzq5Os",
      checklist: [
        "Choose a business name",
        "Select the right category",
        "Add a profile picture (optional)",
        "Publish the page"
      ]
    },
    {
      id: 2,
      title: "Create and Configure Your Business Portfolio",
      description: "A Meta Business Portfolio is required for WhatsApp API authorization. This is where your WhatsApp settings, phone number, and messaging permissions live. You must create one and verify basic details before connecting your number.",
      link: "https://business.facebook.com/settings",
      youtubeUrl: "https://www.youtube.com/embed/wUdwvLhphww",
      checklist: [
        "Open Meta Business Suite",
        "Create or select a Business Portfolio",
        "Add your Facebook Page to the Portfolio",
        "Verify your business details",
        "Prepare for WhatsApp Business setup"
      ]
    },
    {
      id: 3,
      title: "Register Your WhatsApp Business App",
      description: "You need a WhatsApp Business App inside Meta to generate API credentials used by your AI chatbot. This is where you add your phone number, get API tokens, and configure webhooks.",
      link: "https://business.facebook.com/wa/manage",
      youtubeUrl: "https://www.youtube.com/embed/4l8YccBmXIM",
      checklist: [
        "Open WhatsApp API setup",
        "Add a new phone number (must NOT be used on WhatsApp)",
        "Verify the number using SMS or call",
        "Generate your permanent access token",
        "Copy your Webhook URL (we provide it in our dashboard)",
        "Enter your Verify Token (we provide it)"
      ],
      note: "Your number must not be logged into WhatsApp or WhatsApp Business mobile apps."
    }
  ];

  return (
    <AppLayout>
      <div className="container mx-auto px-3 sm:px-6 py-4 sm:py-8 max-w-6xl">
        <div className="mb-6 sm:mb-8 text-center sm:text-left">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">WhatsApp Integration Setup Guide</h1>
          <p className="text-sm sm:text-base text-muted-foreground max-w-2xl mx-auto sm:mx-0">
            Follow these steps to connect your WhatsApp Business account to our platform
          </p>
        </div>

        {/* Requirements Card */}
        <Card className="mb-8 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="w-5 h-5 text-primary" />
              Requirements
            </CardTitle>
          </CardHeader>
          <CardContent>
            <ul className="space-y-2">
              {requirements.map((req, index) => (
                <li key={index} className="flex items-start">
                  <Circle className="w-4 h-4 mt-1 mr-2 text-muted-foreground flex-shrink-0" />
                  <span className="text-sm sm:text-base">{req}</span>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>

        {/* Steps */}
        <div className="space-y-8">
          {steps.map((step) => (
            <Card
              key={step.id}
              className={`border border-border ${isStepCompleted(step.id) ? 'border-green-500/50 bg-green-500/5' : ''}`}
            >
              <CardHeader>
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                    <Badge variant="secondary" className="text-sm sm:text-base md:text-lg py-0.5 sm:py-1 px-2 sm:px-3 w-fit">
                      Step {step.id}
                    </Badge>
                    <CardTitle className="flex items-center gap-2 text-lg sm:text-xl">
                      {step.id === 1 && <Building className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />}
                      {step.id === 2 && <Building className="w-4 h-4 sm:w-5 sm:h-5 text-secondary" />}
                      {step.id === 3 && <AppWindow className="w-4 h-4 sm:w-5 sm:h-5 text-primary" />}
                      {step.title}
                    </CardTitle>
                  </div>
                  <Button
                    variant={isStepCompleted(step.id) ? "default" : "outline"}
                    className={`${isStepCompleted(step.id) ? "bg-green-600 hover:bg-green-700" : ""} w-full sm:w-auto text-sm sm:text-base`}
                    onClick={() => toggleStepCompletion(step.id)}
                  >
                    {isStepCompleted(step.id) ? (
                      <>
                        <CheckCircle className="w-4 h-4 mr-2" />
                        <span className="hidden xs:inline">Completed</span>
                        <span className="xs:hidden">Done</span>
                      </>
                    ) : (
                      <>
                        <span className="hidden xs:inline">Mark as Complete</span>
                        <span className="xs:hidden">Complete</span>
                      </>
                    )}
                  </Button>
                </div>
              </CardHeader>
              <CardContent className="space-y-6">
                <p className="text-muted-foreground">{step.description}</p>

                <div>
                  <Button variant="outline" asChild className="w-full sm:w-auto text-sm sm:text-base">
                    <a href={step.link} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="w-4 h-4 mr-2" />
                      <span className="hidden xs:inline">Open {step.title}</span>
                      <span className="xs:hidden">Open Page</span>
                    </a>
                  </Button>
                </div>

                {step.youtubeUrl && (
                  <div className="aspect-video bg-muted rounded-lg overflow-hidden w-full">
                    <iframe
                      src={step.youtubeUrl}
                      title={`${step.title} Tutorial`}
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                      allowFullScreen
                      className="w-full h-full min-h-[150px] sm:min-h-[200px] md:min-h-0"
                    />
                  </div>
                )}

                <div>
                  <h3 className="font-semibold mb-2 text-sm sm:text-base">Checklist:</h3>
                  <ul className="space-y-2">
                    {step.checklist.map((item, index) => (
                      <li key={index} className="flex items-start">
                        <Circle className="w-4 h-4 mt-1 mr-2 text-muted-foreground flex-shrink-0" />
                        <span className="text-sm">{item}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {step.note && (
                  <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-3 sm:p-4">
                    <p className="font-semibold text-yellow-700 dark:text-yellow-300 text-sm sm:text-base">⚠ {step.note}</p>
                  </div>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        {/* Final Connection Section */}
        <Card className="mt-8 border-primary/20 bg-gradient-to-br from-primary/5 to-secondary/5">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Link className="w-5 h-5 text-primary" />
              Connect Your WhatsApp to Our Platform
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm sm:text-base">
              Once all steps are complete, use the fields below to connect your WhatsApp:
            </p>
            <ul className="space-y-2 list-disc pl-5 text-sm sm:text-base">
              <li>Enter your Meta Permanent Access Token</li>
              <li>Enter your WhatsApp Business Number ID</li>
              <li>Enter your WhatsApp Business Account ID</li>
              <li>Copy and paste our Webhook URL into Meta</li>
              <li>Use our Verify Token (auto-generated)</li>
            </ul>

            <div className="mt-6 p-3 sm:p-6 bg-muted/50 rounded-lg border border-border/50">
              <h3 className="font-semibold mb-3 sm:mb-4 text-base sm:text-lg">Webhook Configuration</h3>
              <div className="space-y-4">
                <div>
                  <Label className="text-sm font-medium">Webhook URL</Label>
                  <div className="flex flex-col sm:flex-row gap-2 mt-1">
                    <Input
                      type="text"
                      value="https://ilcxoakgntprququdgok.supabase.co/functions/v1/whatsapp-webhook"
                      readOnly
                      className="flex-1 font-mono text-xs sm:text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto text-xs sm:text-sm"
                      onClick={() => {
                        navigator.clipboard.writeText("https://ilcxoakgntprququdgok.supabase.co/functions/v1/whatsapp-webhook");
                      }}
                    >
                      <span className="hidden xs:inline">Copy URL</span>
                      <span className="xs:hidden">Copy</span>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Copy this URL and paste it in your Meta Developer Console under WhatsApp → Configuration → Webhook
                  </p>
                </div>

                <div>
                  <Label className="text-sm font-medium">Verify Token</Label>
                  <div className="flex flex-col sm:flex-row gap-2 mt-1">
                    <Input
                      type="text"
                      value="responder_verify"
                      readOnly
                      className="flex-1 font-mono text-xs sm:text-sm"
                    />
                    <Button
                      variant="outline"
                      size="sm"
                      className="w-full sm:w-auto text-xs sm:text-sm"
                      onClick={() => {
                        navigator.clipboard.writeText("responder_verify");
                      }}
                    >
                      <span className="hidden xs:inline">Copy Token</span>
                      <span className="xs:hidden">Copy</span>
                    </Button>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Use this verify token when configuring your webhook in Meta
                  </p>
                </div>
              </div>
            </div>

            <div className="mt-4">
              <p className="text-sm text-muted-foreground mb-2">
                After completing all steps, make your app live by submitting your privacy policy URL to make your WhatsApp Business number live:
              </p>
              <div className="flex flex-col sm:flex-row gap-2">
                <Input
                  type="text"
                  value="https://resbonder.online/privacy"
                  readOnly
                  className="flex-1 font-mono text-xs sm:text-sm"
                />
                <Button
                  variant="outline"
                  size="sm"
                  className="w-full sm:w-auto text-xs sm:text-sm"
                  onClick={() => {
                    navigator.clipboard.writeText("https://resbonder.online/privacy");
                  }}
                >
                  <span className="hidden xs:inline">Copy URL</span>
                  <span className="xs:hidden">Copy</span>
                </Button>
              </div>
            </div>

            <div className="pt-4 flex justify-center sm:justify-start">
              <Button asChild className="w-full sm:w-auto text-sm sm:text-base">
                <a href="/settings">
                  <MessageSquare className="w-4 h-4 mr-2" />
                  <span className="hidden xs:inline">Go to Settings to Complete Connection</span>
                  <span className="xs:hidden">Complete Connection</span>
                </a>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>
    </AppLayout>
  );
};

export default WhatsAppGuide;