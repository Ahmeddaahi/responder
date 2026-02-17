import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { MessageSquare, BookOpen, Eye, EyeOff, Layout, Copy, Check as CheckIcon } from "lucide-react";
import AppLayout from "@/components/AppLayout";
import type { User } from "@supabase/supabase-js";
import ManagedSetupModal from "@/components/ManagedSetupModal";
import { HelpCircle } from "lucide-react";

const Settings = () => {
  const [user, setUser] = useState<User | null>(null);
  const [phoneNumber, setPhoneNumber] = useState("");
  const [phoneNumberId, setPhoneNumberId] = useState("");
  const [metaAppId, setMetaAppId] = useState("");
  const [metaToken, setMetaToken] = useState("");
  const [loading, setLoading] = useState(false);
  const [whatsappWebhookUrl, setWhatsappWebhookUrl] = useState("");
  const [settingsSaved, setSettingsSaved] = useState(false);
  const [showMetaToken, setShowMetaToken] = useState(false);
  const [showAppId, setShowAppId] = useState(false);
  const [isManagedSetupOpen, setIsManagedSetupOpen] = useState(false);
  const [hasPendingSetup, setHasPendingSetup] = useState(false);
  const [copied, setCopied] = useState(false);
  const navigate = useNavigate();
  const { toast } = useToast();

  useEffect(() => {
    checkUser();
    loadSettings();
  }, []);

  const checkUser = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    setUser(session?.user ?? null);

    if (!session) {
      navigate("/auth");
    }
  };

  const loadSettings = async () => {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    // Check for pending managed setup
    const { data: pendingSetup } = await supabase
      .from('managed_setups')
      .select('*')
      .eq('user_id', session.user.id)
      .eq('status', 'pending')
      .maybeSingle();

    setHasPendingSetup(!!pendingSetup);

    // Load agent settings for both platforms
    const { data: agentData } = await supabase
      .from('agents')
      .select('*')
      .eq('user_id', session.user.id);

    if (agentData && agentData.length > 0) {
      // Load settings for WhatsApp platform
      agentData.forEach((agent: any) => {
        if (agent.platform === 'whatsapp') {
          setPhoneNumber(agent.phone_number || '');
          setPhoneNumberId(agent.phone_number_id || '');
          setMetaAppId(agent.meta_app_id || '');
          setMetaToken(agent.meta_token || '');
          setWhatsappWebhookUrl(agent.webhook_url || '');
        }
      });

      // Mark settings as already saved if they exist
      setSettingsSaved(true);
    }
  };

  const saveWhatsAppSettings = async () => {
    setLoading(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || '';

      if (!phoneNumber || !phoneNumberId || !metaAppId || !metaToken) {
        toast({
          title: "Missing Information",
          description: "Please fill in all WhatsApp configuration fields",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      // Validate phone number uniqueness before saving
      const { data: existingPhoneAgent, error: phoneCheckError } = await supabase
        .from('agents')
        .select('user_id, platform, phone_number')
        .eq('phone_number', phoneNumber)
        .maybeSingle();

      if (phoneCheckError && phoneCheckError.code !== 'PGRST116') {
        throw phoneCheckError;
      }

      // If phone number exists and belongs to a different user/platform, reject
      if (existingPhoneAgent && existingPhoneAgent.phone_number === phoneNumber) {
        if (existingPhoneAgent.user_id !== session?.user.id || existingPhoneAgent.platform !== 'whatsapp') {
          toast({
            title: "Phone Number Already in Use",
            description: "This phone number is already registered by another user. Please use a different phone number.",
            variant: "destructive",
          });
          setLoading(false);
          return;
        }
      }

      // Validate phone number ID uniqueness before saving (only if provided)
      if (phoneNumberId) {
        const { data: existingPhoneIdAgent, error: phoneIdCheckError } = await supabase
          .from('agents')
          .select('user_id, platform, phone_number_id')
          .eq('phone_number_id', phoneNumberId)
          .maybeSingle();

        if (phoneIdCheckError && phoneIdCheckError.code !== 'PGRST116') {
          throw phoneIdCheckError;
        }

        // If phone number ID exists and belongs to a different user/platform, reject
        if (existingPhoneIdAgent && existingPhoneIdAgent.phone_number_id === phoneNumberId) {
          if (existingPhoneIdAgent.user_id !== session?.user.id || existingPhoneIdAgent.platform !== 'whatsapp') {
            toast({
              title: "Phone Number ID Already in Use",
              description: "This phone number ID is already registered by another user. Please use a different phone number ID.",
              variant: "destructive",
            });
            setLoading(false);
            return;
          }
        }
      }

      const webhookUrl = `${supabaseUrl}/functions/v1/whatsapp-webhook`;

      const { error } = await supabase
        .from('agents')
        .upsert({
          user_id: user?.id,
          platform: 'whatsapp',
          phone_number: phoneNumber,
          phone_number_id: phoneNumberId,
          meta_app_id: metaAppId,
          meta_token: metaToken,
          webhook_url: webhookUrl,
          is_active: true,
        }, {
          onConflict: 'user_id,platform'
        });

      if (error) {
        // Check if error is due to unique constraint violation
        if (error.code === '23505' || error.message.includes('unique') || error.message.includes('duplicate')) {
          if (error.message.includes('phone_number') || error.message.includes('phone_number_unique')) {
            toast({
              title: "Phone Number Already in Use",
              description: "This phone number is already registered by another user. Please use a different phone number.",
              variant: "destructive",
            });
          } else if (error.message.includes('phone_number_id') || error.message.includes('phone_number_id_unique')) {
            toast({
              title: "Phone Number ID Already in Use",
              description: "This phone number ID is already registered by another user. Please use a different phone number ID.",
              variant: "destructive",
            });
          } else {
            toast({
              title: "Validation Error",
              description: "This configuration is already in use by another user. Please check your settings.",
              variant: "destructive",
            });
          }
        } else {
          throw error;
        }
        return;
      }

      toast({
        title: "WhatsApp Settings Saved!",
        description: "Your WhatsApp configuration has been updated.",
      });

      await loadSettings();
      setSettingsSaved(true);
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

  const widgetUrl = `${window.location.origin}/chat/${user?.id}`;
  const embedCode = `<iframe 
  src="${widgetUrl}" 
  width="400" 
  height="600" 
  style="border:none; border-radius:12px; box-shadow: 0 4px 12px rgba(0,0,0,0.15); position: fixed; bottom: 20px; right: 20px; z-index: 9999;"
  title="AI Business Assistant"
></iframe>`;

  const copyToClipboard = () => {
    navigator.clipboard.writeText(embedCode);
    setCopied(true);
    toast({
      title: "Copied!",
      description: "Embed code copied to clipboard",
    });
    setTimeout(() => setCopied(false), 2000);
  };

  // Check if user has saved at least one platform configuration
  const handleContinue = () => {
    if (settingsSaved) {
      navigate("/knowledge");
    } else {
      toast({
        title: "Configuration Required",
        description: "Please configure and save at least one messaging platform before continuing.",
        variant: "destructive",
      });
    }
  };

  return (
    <AppLayout>
      <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-12">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-6 sm:mb-8">Settings</h1>

          <div className="space-y-6 sm:space-y-8">
            {/* WhatsApp Configuration */}
            <Card className="p-4 sm:p-5 md:p-6 bg-gradient-card border-border">
              <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                <MessageSquare className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                WhatsApp Configuration
              </h2>
              <div className="mb-4">
                <Button
                  variant="outline"
                  className="w-full sm:w-auto border-primary/50 hover:border-primary hover:bg-primary/10 hover:text-primary transition-all"
                  onClick={() => navigate("/whatsapp-guide")}
                >
                  <BookOpen className="w-4 h-4 mr-2 text-primary" />
                  <span className="font-medium">WhatsApp Setup Guide</span>
                </Button>
                <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                  Follow our step-by-step guide to set up WhatsApp Business API
                </p>
              </div>
              <div className="space-y-3 sm:space-y-4">
                <div>
                  <Label htmlFor="phoneNumber" className="text-sm sm:text-base">WhatsApp Display Phone Number</Label>
                  <Input
                    id="phoneNumber"
                    type="text"
                    placeholder="+1234567890"
                    value={phoneNumber}
                    onChange={(e) => setPhoneNumber(e.target.value)}
                    className="text-sm sm:text-base"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Your WhatsApp Business display phone number (e.g., +15556430464)
                  </p>
                </div>
                <div>
                  <Label htmlFor="phoneNumberId" className="text-sm sm:text-base">Phone Number ID</Label>
                  <Input
                    id="phoneNumberId"
                    type="text"
                    placeholder="123456789012345"
                    value={phoneNumberId}
                    onChange={(e) => setPhoneNumberId(e.target.value)}
                    className="text-sm sm:text-base"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Your WhatsApp Phone Number ID from Meta Dashboard (e.g., 815809944955466)
                  </p>
                </div>
                <div>
                  <Label htmlFor="metaAppId" className="text-sm sm:text-base">Meta App ID</Label>
                  <div className="relative">
                    <Input
                      id="metaAppId"
                      type={showAppId ? "text" : "password"}
                      placeholder="Your Meta App ID"
                      value={metaAppId}
                      onChange={(e) => setMetaAppId(e.target.value)}
                      className="text-sm sm:text-base pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowAppId(!showAppId)}
                    >
                      {showAppId ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                <div>
                  <Label htmlFor="metaToken" className="text-sm sm:text-base">Meta Access Token</Label>
                  <div className="relative">
                    <Input
                      id="metaToken"
                      type={showMetaToken ? "text" : "password"}
                      placeholder="Your Meta Access Token"
                      value={metaToken}
                      onChange={(e) => setMetaToken(e.target.value)}
                      className="text-sm sm:text-base pr-10"
                    />
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                      onClick={() => setShowMetaToken(!showMetaToken)}
                    >
                      {showMetaToken ? (
                        <EyeOff className="h-4 w-4 text-muted-foreground" />
                      ) : (
                        <Eye className="h-4 w-4 text-muted-foreground" />
                      )}
                    </Button>
                  </div>
                </div>
                {whatsappWebhookUrl && (
                  <div>
                    <Label className="text-sm sm:text-base">Webhook URL</Label>
                    <Input
                      type="text"
                      value={whatsappWebhookUrl}
                      readOnly
                      className="font-mono text-xs sm:text-sm break-all"
                    />
                    <p className="text-xs sm:text-sm text-muted-foreground mt-2">
                      ⚠️ Register this webhook URL manually in your Meta Developer Console
                    </p>
                    <p className="text-xs text-muted-foreground mt-1">
                      Verify token: responder_verify
                    </p>
                  </div>
                )}
                <Button
                  onClick={saveWhatsAppSettings}
                  disabled={loading}
                  className="w-full sm:w-auto bg-gradient-primary hover:opacity-90"
                >
                  Save WhatsApp Settings
                </Button>

                {/* Web Chat Widget Configuration */}
                <Card className="p-4 sm:p-5 md:p-6 bg-gradient-card border-border">
                  <h2 className="text-xl sm:text-2xl font-semibold mb-3 sm:mb-4 flex items-center gap-2">
                    <Layout className="w-5 h-5 sm:w-6 sm:h-6 text-primary" />
                    Web Chat Widget
                  </h2>
                  <p className="text-sm text-muted-foreground mb-6">
                    Embed your AI Business Assistant directly on your website to capture leads and handle bookings 24/7.
                  </p>

                  <div className="space-y-4">
                    <div className="bg-muted p-4 rounded-lg relative group">
                      <pre className="text-[10px] sm:text-xs overflow-x-auto whitespace-pre-wrap font-mono text-foreground/80 leading-relaxed">
                        {embedCode}
                      </pre>
                      <Button
                        size="sm"
                        variant="secondary"
                        className="absolute top-2 right-2 h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                        onClick={copyToClipboard}
                      >
                        {copied ? <CheckIcon className="w-4 h-4 text-green-500" /> : <Copy className="w-4 h-4" />}
                      </Button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-4 items-center">
                      <Button
                        onClick={copyToClipboard}
                        className="w-full sm:w-auto bg-gradient-primary hover:opacity-90"
                      >
                        <Copy className="w-4 h-4 mr-2" />
                        Copy Embed Code
                      </Button>
                      <Button
                        variant="outline"
                        onClick={() => window.open(widgetUrl, '_blank')}
                        className="w-full sm:w-auto border-primary/50 text-primary hover:bg-primary/5"
                      >
                        <Eye className="w-4 h-4 mr-2" />
                        Preview Widget
                      </Button>
                    </div>

                    <div className="mt-4 p-4 bg-primary/5 rounded-lg border border-primary/10">
                      <h4 className="text-xs font-bold mb-2 uppercase tracking-tighter text-primary">How to install:</h4>
                      <ol className="text-xs text-muted-foreground space-y-2 list-decimal list-inside">
                        <li>Copy the code above.</li>
                        <li>Paste it into your website's HTML before the closing <code className="bg-muted px-1 rounded">&lt;/body&gt;</code> tag.</li>
                        <li>The chat bubble will appear automatically for your visitors!</li>
                      </ol>
                    </div>
                  </div>
                </Card>

                {/* Managed Setup Section */}
                <div className="mt-8 pt-8 border-t border-border">
                  <div className="bg-primary/5 rounded-xl p-4 sm:p-6 border border-primary/10">
                    <div className="flex items-start gap-4">
                      <div className="p-2 bg-primary/10 rounded-lg">
                        <HelpCircle className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h3 className="text-lg font-semibold text-foreground">Can't find your Meta IDs?</h3>
                        {hasPendingSetup ? (
                          <div className="mt-3">
                            <div className="flex items-center gap-2 mb-2">
                              <div className="h-2 w-2 rounded-full bg-yellow-500 animate-pulse"></div>
                              <p className="text-sm font-semibold text-yellow-600 dark:text-yellow-500">
                                Setup Request Pending
                              </p>
                            </div>
                            <p className="text-sm text-muted-foreground">
                              Your request has been received! Our team is working on setting up your WhatsApp Business API.
                            </p>
                            <p className="text-xs text-muted-foreground mt-2">
                              ⏱️ Estimated wait time: 15-60 minutes. You will receive an email notification once your setup is complete.
                            </p>
                          </div>
                        ) : (
                          <>
                            <p className="text-sm text-muted-foreground mt-1 mb-4">
                              Don't worry! If you're not technical, our team can handle the entire WhatsApp setup for you for just <span className="font-semibold text-primary">$1 (200 ETB)</span>.
                              Just give us your business details, and we'll do the rest.
                            </p>
                            <Button
                              variant="outline"
                              className="border-primary/50 text-primary hover:bg-primary/5"
                              onClick={() => setIsManagedSetupOpen(true)}
                            >
                              We can do it for you - $1 / 200 ETB
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </div>
                </div>

                {user && (
                  <ManagedSetupModal
                    isOpen={isManagedSetupOpen}
                    onClose={() => setIsManagedSetupOpen(false)}
                    userId={user.id}
                    onSuccess={loadSettings}
                  />
                )}
              </div>
            </Card>
          </div>

          {/* Continue Button */}
          <div className="mt-8 sm:mt-10 md:mt-12 text-center">
            <Button
              size="lg"
              onClick={handleContinue}
              className="bg-gradient-primary hover:opacity-90 w-full sm:w-auto"
            >
              Continue to Booking Setup
            </Button>
          </div>
        </div>
      </div>

    </AppLayout>
  );
};

export default Settings;