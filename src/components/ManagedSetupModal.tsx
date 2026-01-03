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
import { uploadToCloudflare } from "@/integrations/cloudflare/client";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Copy, Upload, Check } from "lucide-react";
import { Progress } from "@/components/ui/progress";

interface ManagedSetupModalProps {
    isOpen: boolean;
    onClose: () => void;
    userId: string;
    onSuccess?: () => void;
}

const ManagedSetupModal = ({ isOpen, onClose, userId, onSuccess }: ManagedSetupModalProps) => {
    const [step, setStep] = useState<1 | 2>(1);
    const [businessName, setBusinessName] = useState("");
    const [phoneNumber, setPhoneNumber] = useState("");
    const [paymentMethod, setPaymentMethod] = useState("");
    const [file, setFile] = useState<File | null>(null);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [loading, setLoading] = useState(false);
    const { toast } = useToast();

    const paymentDetails = {
        ebirr: { number: "0995817222", name: "Ahmed Bashir Ahmed", amount: "200 ETB" },
        zaad: { number: "+252 63 3983250", name: "Cabdixakiin Bashir Ahmed", amount: "$1" },
        edahab: { number: "+252 63 3983250", name: "Cabdixakiin Bashir Ahmed", amount: "$1" },
        crypto: { number: "", name: "", amount: "$1" },
    };

    const handleStep1Submit = (e: React.FormEvent) => {
        e.preventDefault();
        setStep(2);
    };

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];

            if (!selectedFile.type.startsWith('image/')) {
                toast({
                    title: "Invalid file type",
                    description: "Please upload an image file.",
                    variant: "destructive",
                });
                return;
            }

            if (selectedFile.size > 5 * 1024 * 1024) {
                toast({
                    title: "File too large",
                    description: "Max file size is 5MB.",
                    variant: "destructive",
                });
                return;
            }

            setFile(selectedFile);

            const reader = new FileReader();
            reader.onloadend = () => {
                setPreviewUrl(reader.result as string);
            };
            reader.readAsDataURL(selectedFile);
        }
    };

    const handleCryptoPayment = async () => {
        try {
            const { data, error } = await supabase.functions.invoke('create-cryptomus-order', {
                body: {
                    plan_id: 'managed_setup',
                    billing_cycle: 'monthly',
                    amount: 1
                }
            });

            if (error) throw error;

            if (data?.payment_url) {
                window.location.href = data.payment_url;
            } else {
                throw new Error('No payment URL received');
            }
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message || "Failed to create crypto payment",
                variant: "destructive",
            });
        }
    };

    const handleFinalSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (paymentMethod === 'crypto') {
            try {
                setLoading(true);
                // Create the request in the database first
                const { error: dbError } = await supabase
                    .from("managed_setups")
                    .insert({
                        user_id: userId,
                        business_name: businessName,
                        phone_number: phoneNumber,
                        status: "pending",
                        get payment_status() { return "pending" as const },
                        payment_method: "crypto",
                    });

                if (dbError) throw dbError;

                // Trigger notification
                await supabase.functions.invoke("managed-setup-notification", {
                    body: {
                        task: "request",
                        userId,
                        businessName,
                        phoneNumber
                    },
                });

                // Now redirect to payment
                await handleCryptoPayment();
            } catch (error: any) {
                toast({
                    title: "Error",
                    description: error.message,
                    variant: "destructive",
                });
            } finally {
                setLoading(false);
            }
            return;
        }

        if (!file) {
            toast({
                title: "Missing Screenshot",
                description: "Please upload a payment screenshot.",
                variant: "destructive",
            });
            return;
        }

        setLoading(true);
        setUploading(true);
        setUploadProgress(0);

        try {
            // Upload screenshot
            const fileExt = file.name.split('.').pop();
            const fileName = `${userId}/${Date.now()}.${fileExt}`;
            let publicUrl: string;

            // Try Cloudflare first, fallback to Supabase if not configured
            const cloudflareConfigured = !!(
                import.meta.env.VITE_CLOUDFLARE_ACCOUNT_ID &&
                import.meta.env.VITE_CLOUDFLARE_ACCESS_KEY_ID &&
                import.meta.env.VITE_CLOUDFLARE_SECRET_ACCESS_KEY &&
                import.meta.env.VITE_CLOUDFLARE_BUCKET_NAME
            );

            if (cloudflareConfigured) {
                // Upload to Cloudflare R2
                const progressInterval = setInterval(() => {
                    setUploadProgress(prev => Math.min(prev + 10, 90));
                }, 200);

                try {
                    publicUrl = await uploadToCloudflare(file, fileName);
                    clearInterval(progressInterval);
                    setUploadProgress(100);
                } catch (cloudflareError: any) {
                    clearInterval(progressInterval);
                    console.error('Cloudflare upload error:', cloudflareError);
                    // Fallback to Supabase if Cloudflare fails
                    console.log('Falling back to Supabase storage...');

                    const progressIntervalSupabase = setInterval(() => {
                        setUploadProgress(prev => Math.min(prev + 10, 90));
                    }, 200);

                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from('payment_proofs')
                        .upload(fileName, file);

                    clearInterval(progressIntervalSupabase);

                    if (uploadError) {
                        throw new Error(`Failed to upload: ${uploadError.message}`);
                    }

                    setUploadProgress(100);

                    const { data: { publicUrl: supabaseUrl } } = supabase.storage
                        .from('payment_proofs')
                        .getPublicUrl(fileName);

                    publicUrl = supabaseUrl;
                }
            } else {
                // Upload to Supabase (backward compatibility)
                const progressInterval = setInterval(() => {
                    setUploadProgress(prev => Math.min(prev + 10, 90));
                }, 200);

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('payment_proofs')
                    .upload(fileName, file);

                clearInterval(progressInterval);

                if (uploadError) {
                    throw new Error(`Failed to upload: ${uploadError.message}`);
                }

                setUploadProgress(100);

                const { data: { publicUrl: supabaseUrl } } = supabase.storage
                    .from('payment_proofs')
                    .getPublicUrl(fileName);

                publicUrl = supabaseUrl;
            }

            // Insert the managed setup request
            const { error } = await supabase
                .from("managed_setups")
                .insert({
                    user_id: userId,
                    business_name: businessName,
                    phone_number: phoneNumber,
                    status: "pending",
                    payment_status: "pending",
                    receipt_url: publicUrl,
                    payment_method: paymentMethod,
                });

            if (error) throw error;

            // Trigger notification edge function
            try {
                await supabase.functions.invoke("managed-setup-notification", {
                    body: {
                        task: "request",
                        userId,
                        businessName,
                        phoneNumber
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
            setStep(1);
            setBusinessName("");
            setPhoneNumber("");
            setPaymentMethod("");
            setFile(null);
            setPreviewUrl(null);
            setUploadProgress(0);
            if (onSuccess) onSuccess();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
            setUploading(false);
        }
    };

    const copyToClipboard = (text: string) => {
        navigator.clipboard.writeText(text);
        toast({ description: "Copied to clipboard!" });
    };

    return (
        <Dialog open={isOpen} onOpenChange={onClose}>
            <DialogContent className="sm:max-w-[500px] max-h-[90vh]">
                {step === 1 ? (
                    <form onSubmit={handleStep1Submit}>
                        <DialogHeader>
                            <DialogTitle>Request Managed Setup - $1 / 200 ETB</DialogTitle>
                            <DialogDescription>
                                Enter your details to request our WhatsApp setup service.
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
                            <Button type="submit">
                                Continue to Payment
                            </Button>
                        </DialogFooter>
                    </form>
                ) : (
                    <form onSubmit={handleFinalSubmit}>
                        <DialogHeader>
                            <DialogTitle>Complete Payment</DialogTitle>
                            <DialogDescription>
                                Send payment and upload your receipt below.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="overflow-y-auto max-h-[60vh] pr-2">
                            <div className="space-y-4 py-4">
                                {/* Payment Method Selection */}
                                <div className="grid gap-2">
                                    <Label>Select Payment Method</Label>
                                    <div className="grid grid-cols-2 gap-2">
                                        {Object.entries(paymentDetails).map(([method, details]) => (
                                            <Button
                                                key={method}
                                                type="button"
                                                variant={paymentMethod === method ? "default" : "outline"}
                                                onClick={() => setPaymentMethod(method)}
                                                className="capitalize"
                                            >
                                                {method === 'crypto' ? 'Crypto (USDT)' : method}
                                            </Button>
                                        ))}
                                    </div>
                                </div>

                                {/* Payment Instructions */}
                                {paymentMethod && paymentMethod !== 'crypto' && (
                                    <div className="bg-muted/50 p-4 rounded-lg space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-sm text-muted-foreground">Amount:</span>
                                            <span className="font-bold text-primary">{paymentDetails[paymentMethod as keyof typeof paymentDetails].amount}</span>
                                        </div>
                                        <div className="space-y-2">
                                            <Label className="text-xs text-muted-foreground">Send to:</Label>
                                            <div className="flex items-center justify-between bg-background p-2 rounded border">
                                                <span className="font-mono text-sm">{paymentDetails[paymentMethod as keyof typeof paymentDetails].number}</span>
                                                <Button
                                                    type="button"
                                                    variant="ghost"
                                                    size="sm"
                                                    onClick={() => copyToClipboard(paymentDetails[paymentMethod as keyof typeof paymentDetails].number)}
                                                >
                                                    <Copy className="w-4 h-4" />
                                                </Button>
                                            </div>
                                        </div>
                                        <div className="text-xs text-muted-foreground">
                                            Name: {paymentDetails[paymentMethod as keyof typeof paymentDetails].name}
                                        </div>
                                    </div>
                                )}

                                {paymentMethod === 'crypto' && (
                                    <div className="bg-muted/50 p-4 rounded-lg text-center">
                                        <p className="text-sm text-muted-foreground mb-2">
                                            You will be redirected to Cryptomus to complete your $1 payment.
                                        </p>
                                    </div>
                                )}

                                {/* Screenshot Upload */}
                                {paymentMethod && paymentMethod !== 'crypto' && (
                                    <div className="space-y-2">
                                        <Label htmlFor="receipt-upload">Upload Payment Screenshot</Label>
                                        <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-muted/50 transition-colors relative">
                                            <input
                                                id="receipt-upload"
                                                type="file"
                                                accept="image/*"
                                                onChange={handleFileChange}
                                                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                                                disabled={uploading}
                                            />
                                            {previewUrl ? (
                                                <div className="relative w-full aspect-video rounded overflow-hidden">
                                                    <img src={previewUrl} alt="Receipt preview" className="w-full h-full object-cover" />
                                                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity">
                                                        <span className="text-white font-medium">Click to change</span>
                                                    </div>
                                                </div>
                                            ) : file ? (
                                                <div className="flex flex-col items-center gap-2">
                                                    <Check className="w-8 h-8 text-green-500" />
                                                    <span className="font-medium text-green-600">{file.name}</span>
                                                    <span className="text-xs text-muted-foreground">Click to change</span>
                                                </div>
                                            ) : (
                                                <div className="flex flex-col items-center gap-2 text-muted-foreground">
                                                    <Upload className="w-8 h-8" />
                                                    <span className="font-medium">Click to upload screenshot</span>
                                                    <span className="text-xs">Image (max 5MB)</span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}

                                {uploading && (
                                    <div className="space-y-2">
                                        <div className="flex justify-between text-xs text-muted-foreground">
                                            <span>Uploading...</span>
                                            <span>{uploadProgress}%</span>
                                        </div>
                                        <Progress value={uploadProgress} className="h-2" />
                                    </div>
                                )}
                            </div>
                        </div>
                        <DialogFooter>
                            <Button type="button" variant="outline" onClick={() => setStep(1)} disabled={uploading}>
                                Back
                            </Button>
                            <Button type="submit" disabled={loading || !paymentMethod || (paymentMethod !== 'crypto' && !file)}>
                                {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                                {paymentMethod === 'crypto' ? 'Pay with Crypto' : 'Submit Request'}
                            </Button>
                        </DialogFooter>
                    </form>
                )}
            </DialogContent>
        </Dialog>
    );
};

export default ManagedSetupModal;
