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

interface ManagedSetupModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
}

const ManagedSetupModal = ({ isOpen, onClose, userId }: ManagedSetupModalProps) => {
    const [businessName, setBusinessName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setLoading(true);

        try {
            const { error } = await supabase
                .from("managed_setups")
                .insert({
                    user_id: userId,
                    business_name: businessName,
                    phone_number: phoneNumber,
                    status: "pending",
                });

            if (error) throw error;

            // Trigger notification edge function (to be implemented)
            try {
                await supabase.functions.invoke("managed-setup-notification", {
                    body: { task: "request", userId, businessName, phoneNumber },
                });
            } catch (notifError) {
                console.error("Notification error:", notifError);
                // We don't block the user if notification fails but DB insert succeeded
            }

            toast({
                title: "Request Sent!",
                description: "We have received your request. We will contact you soon!",
            });
            onClose();
            setBusinessName("");
            setPhoneNumber("");
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
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[425px]">
                <form onSubmit={handleSubmit}>
                    <DialogHeader>
                        <DialogTitle>Request Managed Setup</DialogTitle>
                        <DialogDescription>
                            Enter your details and our team will set up your WhatsApp Business API for you.
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
                            Submit Request
                        </Button>
                    </DialogFooter>
                </form>
            </DialogContent>
        </Dialog>
    );
};

export default ManagedSetupModal;
