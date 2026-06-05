import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { useEmailVerification } from "@/hooks/useEmailVerification";
import { Loader2, ArrowRight, Building, User, Target } from "lucide-react";
import { useQueryClient } from "@tanstack/react-query";

const steps = [
  {
    id: "company",
    title: "Welcome to Resbonder!",
    subtitle: "Let's set up your workspace. What is your company name?",
    icon: Building,
  },
  {
    id: "role",
    title: "What best describes your role?",
    subtitle: "We'll tailor your experience based on your needs.",
    icon: User,
  },
  {
    id: "goal",
    title: "What is your primary goal?",
    subtitle: "What are you hoping to achieve with Resbonder?",
    icon: Target,
  },
];

const roleOptions = [
  "Business Owner / Founder",
  "Customer Support",
  "Marketing / Sales",
  "Developer / IT",
  "Other",
];

const goalOptions = [
  "Automate WhatsApp Customer Support",
  "Add an AI Web Chat to my website",
  "Automate Bookings & Reservations",
  "Just exploring",
];

const Onboarding = () => {
  const [currentStep, setCurrentStep] = useState(0);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: "",
    role: "",
    goal: "",
  });

  const { user } = useEmailVerification();
  const navigate = useNavigate();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const handleNext = async () => {
    if (currentStep < steps.length - 1) {
      // Validation
      if (currentStep === 0 && !formData.companyName.trim()) {
        toast({ title: "Please enter your company name", variant: "destructive" });
        return;
      }
      if (currentStep === 1 && !formData.role) {
        toast({ title: "Please select a role", variant: "destructive" });
        return;
      }
      setCurrentStep((prev) => prev + 1);
    } else {
      // Final Step: Submit
      if (!formData.goal) {
        toast({ title: "Please select a primary goal", variant: "destructive" });
        return;
      }
      await completeOnboarding();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const completeOnboarding = async () => {
    if (!user) return;
    setLoading(true);
    try {
      const { error } = await supabase
        .from("profiles")
        .update({
          company_name: formData.companyName,
          role: formData.role,
          goal: formData.goal,
          onboarding_completed: true,
        })
        .eq("id", user.id);

      if (error) throw error;

      toast({
        title: "Setup Complete!",
        description: "Welcome to your new dashboard.",
      });

      // Invalidate profile query to force refresh
      await queryClient.invalidateQueries({ queryKey: ['profile', user.id] });
      
      navigate("/dashboard");
    } catch (error: any) {
      toast({
        title: "Error",
        description: error.message || "Failed to save profile. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const CurrentStepIcon = steps[currentStep].icon;

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-background p-4 sm:p-8">
      <div className="w-full max-w-lg">
        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-xs text-white/50 mb-2 font-medium">
            <span>Step {currentStep + 1} of {steps.length}</span>
          </div>
          <div className="w-full bg-white/10 rounded-full h-1.5">
            <motion.div
              className="bg-primary h-1.5 rounded-full"
              initial={{ width: `${(currentStep / steps.length) * 100}%` }}
              animate={{ width: `${((currentStep + 1) / steps.length) * 100}%` }}
              transition={{ duration: 0.3 }}
            />
          </div>
        </div>

        <div className="bg-card/30 backdrop-blur-xl border border-white/10 rounded-2xl p-6 sm:p-10 shadow-2xl overflow-hidden relative min-h-[400px] flex flex-col">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentStep}
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="flex-1 flex flex-col"
            >
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-xl bg-primary/20 flex items-center justify-center">
                  <CurrentStepIcon className="w-5 h-5 text-primary" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold text-white">{steps[currentStep].title}</h2>
                </div>
              </div>
              <p className="text-white/70 mb-8">{steps[currentStep].subtitle}</p>

              <div className="flex-1">
                {currentStep === 0 && (
                  <div className="space-y-4">
                    <Label htmlFor="companyName" className="text-white/90 text-base">Company Name</Label>
                    <Input
                      id="companyName"
                      placeholder="e.g. Acme Corp"
                      value={formData.companyName}
                      onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
                      className="bg-white/5 border-white/10 text-white placeholder:text-white/30 h-12 text-lg focus:border-primary"
                      autoFocus
                      onKeyDown={(e) => {
                        if (e.key === "Enter") handleNext();
                      }}
                    />
                  </div>
                )}

                {currentStep === 1 && (
                  <div className="space-y-3">
                    {roleOptions.map((role) => (
                      <button
                        key={role}
                        onClick={() => setFormData({ ...formData, role })}
                        className={`w-full text-left px-4 py-4 rounded-xl border transition-all duration-200 ${
                          formData.role === role
                            ? "bg-primary/20 border-primary text-white"
                            : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/30"
                        }`}
                      >
                        {role}
                      </button>
                    ))}
                  </div>
                )}

                {currentStep === 2 && (
                  <div className="space-y-3">
                    {goalOptions.map((goal) => (
                      <button
                        key={goal}
                        onClick={() => setFormData({ ...formData, goal })}
                        className={`w-full text-left px-4 py-4 rounded-xl border transition-all duration-200 ${
                          formData.goal === goal
                            ? "bg-primary/20 border-primary text-white"
                            : "bg-white/5 border-white/10 text-white/70 hover:bg-white/10 hover:border-white/30"
                        }`}
                      >
                        {goal}
                      </button>
                    ))}
                  </div>
                )}
              </div>
            </motion.div>
          </AnimatePresence>

          <div className="flex items-center justify-between mt-8 pt-6 border-t border-white/10">
            <Button
              variant="ghost"
              onClick={handleBack}
              disabled={currentStep === 0 || loading}
              className={`text-white/50 hover:text-white hover:bg-white/10 ${currentStep === 0 ? "invisible" : ""}`}
            >
              Back
            </Button>
            <Button
              onClick={handleNext}
              disabled={loading}
              className="bg-primary hover:bg-primary/90 text-white px-8"
            >
              {loading ? (
                <Loader2 className="w-4 h-4 animate-spin mr-2" />
              ) : currentStep === steps.length - 1 ? (
                "Complete Setup"
              ) : (
                <>
                  Next
                  <ArrowRight className="w-4 h-4 ml-2" />
                </>
              )}
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Onboarding;
