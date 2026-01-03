import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogFooter,
    DialogHeader,
    DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2 } from "lucide-react";
import PaymentModal from "@/components/PaymentModal";

interface ManagedSetupModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    onSuccess?: () => void;
}

const ManagedSetupModal = ({ isOpen, onClose, userId, onSuccess }: ManagedSetupModalProps) => {
    const [businessName, setBusinessName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [loading, setLoading] = useState(false);
    const [showPayment, setShowPayment] = useState(false);
    const [pendingSetupData, setPendingSetupData] = useState<any>(null);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        // Store the form data and show payment modal
        setPendingSetupData({ businessName, phoneNumber });
        setShowPayment(true);
    };

    const handlePaymentClose = () => {
        setShowPayment(false);
        // Don't clear pending data yet - user might retry payment
    };

    const handlePaymentSuccess = async () => {
        // Payment modal handles its own submission
        // We need to listen for payment verification
        setShowPayment(false);
        setLoading(true);

        try {
            // Insert the managed setup request
            const { error } = await supabase
                .from("managed_setups")
                .insert({
                    user_id: userId,
                    business_name: pendingSetupData.businessName,
                    phone_number: pendingSetupData.phoneNumber,
                    status: "pending",
                    payment_status: "pending", // Will be updated when admin verifies payment
                });

            if (error) throw error;

            // Trigger notification edge function
            try {
                await supabase.functions.invoke("managed-setup-notification", {
                    body: {
                        task: "request",
                        userId,
                        businessName: pendingSetupData.businessName,
                        phoneNumber: pendingSetupData.phoneNumber
                    },
                });
            } catch (notifError) {
                console.error("Notification error:", notifError);
            }

            toast({
                title: "Request Sent!",
                description: "Your payment is being verified. We'll process your setup request once confirmed.",
            });

            onClose();
            setBusinessName("");
            setPhoneNumber("");
            setPendingSetupData(null);
            if (onSuccess) onSuccess();
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

    return (
        <>
            <Dialog open={isOpen && !showPayment} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-[425px]">
                    <form onSubmit={handleSubmit}>
                        <DialogHeader>
                            <DialogTitle>Request Managed Setup - $1 / 200 ETB</DialogTitle>
                            <DialogDescription>
                                Enter your details. You'll be asked to pay $1 (200 ETB) to process your WhatsApp setup request.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid gap-2">
                                <Label htmlFor="businessName">Business Name</Label>
                                <Input
                                    id="businessName"
                                    placeholder="Your Business Name"
                                    value={businessName}
                                    onChange={(e) => setBusinessName(e.target.value)}
                                    required
                                />
                            </div>
                            <div className="grid gap-2">
                                <Label htmlFor="reqPhoneNumber">WhatsApp Phone Number</Label>
                                <Input
                                    id="reqPhoneNumber"
                                    placeholder="+1234567890"
                                    value={phoneNumber}
                                    onChange={(e) => setPhoneNumber(e.target.value)}
                                    required
                                />
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={onClose}>
                                Cancel
                            </Button>
                            <Button type="submit" disabled={loading}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                Continue to Payment
                            </Button>
                        </DialogFooter>
                    </form>
                </DialogContent>
            </Dialog>

            {showPayment && (
                <PaymentModal
                    isOpen={showPayment}
                    onClose={handlePaymentSuccess}
                    planName="Managed Setup"
                    amount="1"
                    billingCycle="monthly"
                />
            )}
        </>
    );
};

export default ManagedSetupModal;
