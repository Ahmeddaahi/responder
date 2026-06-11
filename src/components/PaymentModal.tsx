import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { RadioGroup, RadioGroupItem } from "@/components/ui/radio-group";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import { uploadToCloudflare } from "@/integrations/cloudflare/client";
import { Loader2, Upload, Check, CheckCircle, Zap, X } from "lucide-react";
import { Progress } from "@/components/ui/progress";
import { Badge } from "@/components/ui/badge";

interface PaymentModalProps {
    isOpen: boolean;
    onClose: () => void;
    planName: string;
    amount: string;
    billingCycle?: 'monthly' | 'annually';
}

type PaymentMethod = 'ebirr' | 'zaad' | 'edahab' | 'crypto';

const PaymentModal = ({ isOpen, onClose, planName, amount, billingCycle = 'monthly' }: PaymentModalProps) => {
    const [step, setStep] = useState<1 | 2>(1);
    const [paymentMethod, setPaymentMethod] = useState<PaymentMethod | null>(null);
    const [file, setFile] = useState<File | null>(null);
    const [uploading, setUploading] = useState(false);
    const [uploadProgress, setUploadProgress] = useState(0);
    const [previewUrl, setPreviewUrl] = useState<string | null>(null);
    const [creatingCryptoOrder, setCreatingCryptoOrder] = useState(false);
    const [paymentName, setPaymentName] = useState("");
    const [paymentPhone, setPaymentPhone] = useState("");

    const [showConfirmation, setShowConfirmation] = useState(false);

    // Promo Code State
    const [promoCode, setPromoCode] = useState("");
    const [isValidatingPromo, setIsValidatingPromo] = useState(false);
    const [appliedPromo, setAppliedPromo] = useState<any>(null);
    const [discountedAmount, setDiscountedAmount] = useState<number | null>(null);
    const [adminId, setAdminId] = useState<string | null>(null);

    const { toast } = useToast();
    const navigate = useNavigate();

    // Fetch Admin ID for SAAS-level promo codes
    const fetchAdminId = async () => {
        const { data } = await supabase
            .from('user_roles')
            .select('user_id')
            .eq('role', 'admin')
            .limit(1)
            .maybeSingle();
        if (data) setAdminId(data.user_id);
    };

    const handleValidatePromo = async () => {
        if (!promoCode.trim()) return;

        setIsValidatingPromo(true);
        try {
            if (!adminId) await fetchAdminId();

            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("Not authenticated");

            const { data, error } = await supabase.functions.invoke('validate-promo-code', {
                body: {
                    code: promoCode,
                    customerId: user.id,
                    merchantId: adminId, // For SAAS plans, merchant is the SAAS admin
                    amount: parseFloat(amount),
                    planType: planName.toLowerCase(),
                }
            });

            if (error) throw error;

            if (data.valid) {
                setAppliedPromo(data);
                setDiscountedAmount(data.finalAmount);
                toast({
                    title: "Promo Code Applied!",
                    description: data.message,
                });
            } else {
                toast({
                    title: "Invalid Code",
                    description: data.message,
                    variant: "destructive",
                });
            }
        } catch (error: any) {
            console.error('Promo validation error:', error);
            toast({
                title: "Error",
                description: "Failed to validate promo code",
                variant: "destructive",
            });
        } finally {
            setIsValidatingPromo(false);
        }
    };

    const removePromo = () => {
        setAppliedPromo(null);
        setDiscountedAmount(null);
        setPromoCode("");
    };

    const handleMethodSelect = async (method: PaymentMethod) => {
        setPaymentMethod(method);

        // If crypto is selected, immediately create order and redirect
        if (method === 'crypto') {
            await handleCryptoPayment();
        }
    };

    const handleCryptoPayment = async () => {
        setCreatingCryptoOrder(true);
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) {
                throw new Error('Not authenticated');
            }

            // Call Supabase Edge Function to create Cryptomus order
            const { data, error } = await supabase.functions.invoke('create-cryptomus-order', {
                body: {
                    plan_id: planName.toLowerCase(),
                    billing_cycle: billingCycle
                }
            });

            if (error) throw error;

            if (data?.payment_url) {
                // Redirect to Cryptomus payment page
                window.location.href = data.payment_url;
            } else {
                throw new Error('No payment URL received');
            }
        } catch (error: any) {
            console.error('Crypto payment error:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to create crypto payment order",
                variant: "destructive",
            });
            setPaymentMethod(null);
        } finally {
            setCreatingCryptoOrder(false);
        }
    };



    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            const selectedFile = e.target.files[0];

            // Validate file type
            if (!selectedFile.type.startsWith('image/') && selectedFile.type !== 'application/pdf') {
                toast({
                    title: "Invalid file type",
                    description: "Please upload an image or PDF.",
                    variant: "destructive",
                });
                return;
            }

            // Validate file size (max 5MB)
            if (selectedFile.size > 5 * 1024 * 1024) {
                toast({
                    title: "File too large",
                    description: "Max file size is 5MB.",
                    variant: "destructive",
                });
                return;
            }

            setFile(selectedFile);

            // Create preview for images
            if (selectedFile.type.startsWith('image/')) {
                const reader = new FileReader();
                reader.onloadend = () => {
                    setPreviewUrl(reader.result as string);
                };
                reader.readAsDataURL(selectedFile);
            } else {
                setPreviewUrl(null);
            }
        }
    };

    const handleSubmit = async () => {
        if (!file || !paymentMethod) return;

        // Validate name and phone for local payment methods
        if (paymentMethod !== 'crypto' && (!paymentName.trim() || !paymentPhone.trim())) {
            toast({
                title: "Missing Information",
                description: "Please enter your name and phone number.",
                variant: "destructive",
            });
            return;
        }

        setUploading(true);
        setUploadProgress(0);

        try {
            const { data: { user } } = await supabase.auth.getUser();
            if (!user) throw new Error("User not authenticated");

            // Fetch user's current plan
            const { data: subscription } = await supabase
                .from('subscriptions')
                .select('plan')
                .eq('user_id', user.id)
                .maybeSingle();

            const currentPlan = subscription?.plan || 'free';

            // 1. Upload file
            const fileExt = file.name.split('.').pop();
            const fileName = `${user.id}/${Date.now()}.${fileExt}`;

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
                // Simulate progress
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

                    // Upload to Supabase as fallback
                    const progressIntervalSupabase = setInterval(() => {
                        setUploadProgress(prev => Math.min(prev + 10, 90));
                    }, 200);

                    const { data: uploadData, error: uploadError } = await supabase.storage
                        .from('payment_proofs')
                        .upload(fileName, file);

                    clearInterval(progressIntervalSupabase);

                    if (uploadError) {
                        throw new Error(`Failed to upload payment proof: ${uploadError.message || 'Unknown storage error'}`);
                    }

                    setUploadProgress(100);

                    const { data: { publicUrl: supabaseUrl } } = supabase.storage
                        .from('payment_proofs')
                        .getPublicUrl(fileName);

                    publicUrl = supabaseUrl;
                }
            } else {
                // Upload to Supabase (backward compatibility)
                // Simulate progress
                const progressInterval = setInterval(() => {
                    setUploadProgress(prev => Math.min(prev + 10, 90));
                }, 200);

                const { data: uploadData, error: uploadError } = await supabase.storage
                    .from('payment_proofs')
                    .upload(fileName, file);

                clearInterval(progressInterval);

                if (uploadError) {
                    console.error('Storage upload error:', uploadError);
                    throw new Error(`Failed to upload payment proof: ${uploadError.message || 'Unknown storage error'}`);
                }

                setUploadProgress(100);

                // Get public URL
                const { data: { publicUrl: supabaseUrl } } = supabase.storage
                    .from('payment_proofs')
                    .getPublicUrl(fileName);

                publicUrl = supabaseUrl;
            }

            // Convert plan name to lowercase to match database enum type
            const requestedPlan = planName.toLowerCase();

            // 2. Save payment request
            // Using type assertion to bypass TypeScript issues with missing table in generated types
            const { data: paymentData, error: dbError } = (await supabase
                .from('payment_requests')
                .insert({
                    user_id: user.id,
                    requested_plan: requestedPlan,
                    current_plan: currentPlan,
                    payment_method: paymentMethod,
                    amount: discountedAmount || parseFloat(amount),
                    billing_cycle: billingCycle,
                    receipt_url: publicUrl,
                    payment_name: paymentName.trim(),
                    payment_phone: paymentPhone.trim(),
                    promo_code: appliedPromo?.code || null,
                    status: 'pending'
                })
                .select()) as any;

            if (dbError) {
                console.error('Database insert error:', dbError);
                throw new Error(`Failed to save payment request: ${dbError.message}`);
            }

            // 3. Record promo usage if applied
            if (appliedPromo) {
                await supabase.functions.invoke('apply-promo-code', {
                    body: {
                        promoId: appliedPromo.promoId,
                        customerId: user.id,
                        discountAmount: appliedPromo.discountAmount,
                        // paymentRequestId: paymentData?.[0]?.id // Optional
                    }
                });
            }

            // Send admin notification email
            try {
                // Get user profile information
                const { data: profile } = await supabase
                    .from('profiles')
                    .select('email, full_name')
                    .eq('id', user.id)
                    .maybeSingle();

                const userEmail = profile?.email || user.email || '';
                const userName = profile?.full_name || null;

                if (userEmail) {
                    console.log('📧 Sending admin payment notification email');
                    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
                    const functionUrl = `${supabaseUrl}/functions/v1/send-admin-payment-notification`;

                    const response = await fetch(functionUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
                        },
                        body: JSON.stringify({
                            userEmail: userEmail,
                            userName: userName,
                            requestedPlan: requestedPlan,
                            currentPlan: currentPlan,
                            amount: parseFloat(amount),
                            paymentMethod: paymentMethod,
                            transactionReference: paymentData?.[0]?.transaction_reference || undefined,
                            paymentPhone: paymentPhone.trim() || undefined,
                            paymentName: paymentName.trim() || undefined,
                            receiptUrl: publicUrl || undefined,
                            timestamp: paymentData?.[0]?.created_at || new Date().toISOString(),
                        }),
                    });

                    if (!response.ok) {
                        console.error('❌ Failed to send admin payment notification email:', {
                            status: response.status,
                            statusText: response.statusText,
                        });
                    } else {
                        console.log('✅ Admin payment notification email sent successfully');
                    }
                } else {
                    console.warn('⚠️ User email not found, skipping admin notification');
                }
            } catch (emailError: any) {
                // Don't fail payment submission if email fails
                console.error('❌ Error sending admin payment notification email:', emailError);
            }

            toast({
                title: "Payment Submitted!",
                description: "Thank you! Your payment is being verified.",
            });

            // Show confirmation dialog instead of closing immediately
            setShowConfirmation(true);

            // Reset state
            setStep(1);
            setPaymentMethod(null);
            setFile(null);
            setPreviewUrl(null);
            setUploadProgress(0);
            setPaymentName("");
            setPaymentPhone("");

        } catch (error: any) {
            console.error('Payment submission error:', error);
            toast({
                title: "Error",
                description: error.message || "Failed to submit payment. Please try again.",
                variant: "destructive",
            });
        } finally {
            setUploading(false);
        }
    };

    const renderStep1 = () => {
        const paymentMethods = [
            {
                id: 'ebirr' as PaymentMethod,
                name: 'eBirr',
                subtitle: 'Pay with your eBirr account',
                logo: '/logoa.png',
                alt: 'eBirr',
                disabled: false
            },
            {
                id: 'zaad' as PaymentMethod,
                name: 'Zaad',
                subtitle: 'Pay with your Zaad account',
                logo: '/logoc.png',
                alt: 'Zaad',
                disabled: false
            },
            {
                id: 'edahab' as PaymentMethod,
                name: 'eDahab',
                subtitle: 'Pay with your eDahab account',
                logo: '/logob.png',
                alt: 'eDahab',
                disabled: false
            },

            {
                id: 'crypto' as PaymentMethod,
                name: 'Crypto (USDT)',
                subtitle: 'Pay with cryptocurrency',
                logo: null,
                alt: 'Crypto',
                disabled: creatingCryptoOrder,
                icon: (
                    <svg className="w-12 h-12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                        <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" className="text-primary" />
                        <path d="M9 11V9h2V7h2v2h1c1.1 0 2 .9 2 2v2c0 1.1-.9 2-2 2h-1v2h-2v-2H9v-2h4v-2H9z" fill="currentColor" className="text-primary" />
                    </svg>
                )
            }
        ];

        return (
            <div className="space-y-6">
                <div className="space-y-3">
                    {paymentMethods.map((method) => (
                        <button
                            key={method.id}
                            onClick={() => !method.disabled && handleMethodSelect(method.id)}
                            className={`w-full p-4 rounded-xl border transition-all flex items-center gap-4 hover:border-primary/50 ${paymentMethod === method.id
                                ? 'border-primary/50 bg-primary/5'
                                : 'border-border/50 bg-card/50'
                                } ${method.disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                            disabled={method.disabled}
                        >
                            {/* Logo/Icon on the left */}
                            <div className="w-12 h-12 flex items-center justify-center flex-shrink-0">
                                {method.logo ? (
                                    <img
                                        src={method.logo}
                                        alt={method.alt}
                                        className="w-full h-full object-contain"
                                        loading="lazy"
                                        width="48"
                                        height="48"
                                    />
                                ) : (
                                    method.icon
                                )}
                            </div>

                            {/* Text content in the middle */}
                            <div className="flex-1 flex flex-col items-start gap-1">
                                <span className={`font-bold text-base ${paymentMethod === method.id
                                    ? 'text-yellow-400'
                                    : 'text-yellow-300/90'
                                    }`}>
                                    {method.disabled && method.id === 'crypto'
                                        ? (creatingCryptoOrder ? 'Loading...' : method.name)
                                        : method.name
                                    }
                                </span>
                                <span className="text-sm text-muted-foreground/70">
                                    {method.subtitle}
                                </span>
                            </div>

                            {/* Radio button on the right */}
                            <div className="flex-shrink-0">
                                <div className={`w-5 h-5 rounded-full border-2 flex items-center justify-center ${paymentMethod === method.id
                                    ? 'border-primary bg-primary'
                                    : 'border-border'
                                    }`}>
                                    {paymentMethod === method.id && (
                                        <div className="w-2.5 h-2.5 rounded-full bg-background" />
                                    )}
                                </div>
                            </div>
                        </button>
                    ))}
                </div>

                {/* Promo Code Input */}
                <div className="space-y-3 p-4 bg-muted/30 rounded-xl border border-border/50">
                    <Label className="text-sm font-medium flex items-center gap-2">
                        <Zap className="w-4 h-4 text-primary" />
                        Have a promo code?
                    </Label>
                    {!appliedPromo ? (
                        <div className="flex gap-2">
                            <Input
                                placeholder="Enter code"
                                value={promoCode}
                                onChange={(e) => setPromoCode(e.target.value.toUpperCase())}
                                className="h-9"
                                disabled={isValidatingPromo}
                            />
                            <Button
                                size="sm"
                                onClick={handleValidatePromo}
                                disabled={isValidatingPromo || !promoCode.trim()}
                            >
                                {isValidatingPromo ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply"}
                            </Button>
                        </div>
                    ) : (
                        <div className="flex items-center justify-between p-2 bg-primary/10 rounded-lg border border-primary/20">
                            <div className="flex flex-col">
                                <span className="text-xs font-bold text-primary tracking-wider uppercase">{appliedPromo.code}</span>
                                <span className="text-[10px] text-muted-foreground">{appliedPromo.message}</span>
                            </div>
                            <Button variant="ghost" size="icon" className="h-6 w-6" onClick={removePromo}>
                                <X className="w-3 h-3" />
                            </Button>
                        </div>
                    )}
                </div>

                <Button
                    className="w-full"
                    disabled={!paymentMethod || paymentMethod === 'crypto' || creatingCryptoOrder}
                    onClick={() => setStep(2)}
                >
                    Continue
                </Button>
            </div>
        );
    };

    const renderStep2 = () => {
        const paymentDetails = {
            ebirr: { number: "0995817222", name: "Ahmed Bashir Ahmed" },
            zaad: { number: "+252638194868", name: "Axmed Bashir Axmed" },
            edahab: { number: "+252 63 3983250", name: "Cabdixakiin Bashir Ahmed" },
            crypto: { number: "", name: "" }
        };

        const currentDetails = paymentMethod ? paymentDetails[paymentMethod] : { number: "0995716810", name: "" };

        return (
            <div className="space-y-6">
                <div className="bg-muted/50 p-4 rounded-lg space-y-4">
                    <div className="flex justify-between items-center border-b border-border pb-2">
                        <span className="text-muted-foreground">Amount to Pay:</span>
                        <div className="text-right">
                            {discountedAmount !== null ? (
                                <div className="flex flex-col items-end">
                                    <span className="text-xs text-muted-foreground line-through">${amount}</span>
                                    <span className="text-xl font-bold text-emerald-500">${discountedAmount}</span>
                                </div>
                            ) : (
                                <span className="text-xl font-bold text-primary">${amount}</span>
                            )}
                        </div>
                    </div>

                    <div className="space-y-3">
                        <div className="space-y-1.5">
                            <Label className="text-muted-foreground">Send payment to:</Label>
                            <div className="flex items-center justify-between bg-background p-3 rounded border border-border">
                                <span className="font-mono text-lg font-bold">{currentDetails.number}</span>
                                <Button variant="ghost" size="sm" onClick={() => {
                                    navigator.clipboard.writeText(currentDetails.number);
                                    toast({ description: "Number copied to clipboard" });
                                }}>
                                    Copy
                                </Button>
                            </div>
                        </div>

                        {currentDetails.name && (
                            <div className="space-y-1.5">
                                <Label className="text-muted-foreground">Receiver Name:</Label>
                                <div className="bg-background p-3 rounded border border-border">
                                    <span className="font-semibold text-foreground">{currentDetails.name}</span>
                                </div>
                            </div>
                        )}
                    </div>

                    <div className="text-sm text-muted-foreground space-y-1">
                        <p>1. Send the exact amount to the number above via {paymentMethod}.</p>
                        <p>2. Take a screenshot of the transaction receipt.</p>
                        <p>3. Upload the screenshot below.</p>
                    </div>
                </div>

                <div className="space-y-4">
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="space-y-2">
                            <Label htmlFor="payment-name">Full Name</Label>
                            <Input
                                id="payment-name"
                                type="text"
                                placeholder="Enter your full name"
                                value={paymentName}
                                onChange={(e) => setPaymentName(e.target.value)}
                                disabled={uploading}
                            />
                        </div>
                        <div className="space-y-2">
                            <Label htmlFor="payment-phone">Phone Number</Label>
                            <Input
                                id="payment-phone"
                                type="tel"
                                placeholder="Enter your phone number"
                                value={paymentPhone}
                                onChange={(e) => setPaymentPhone(e.target.value)}
                                disabled={uploading}
                            />
                        </div>
                    </div>
                </div>

                <div className="space-y-4">
                    <Label htmlFor="receipt-upload">Upload Receipt</Label>
                    <div className="border-2 border-dashed border-border rounded-lg p-6 text-center hover:bg-muted/50 transition-colors relative">
                        <input
                            id="receipt-upload"
                            type="file"
                            accept="image/*,application/pdf"
                            onChange={handleFileChange}
                            className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                            disabled={uploading}
                            aria-label="Upload payment receipt"
                        />
                        {previewUrl ? (
                            <div className="relative w-full aspect-video rounded overflow-hidden">
                                <img src={previewUrl} alt="Receipt preview" className="w-full h-full object-cover" loading="lazy" decoding="async" />
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
                                <span className="font-medium">Click to upload receipt</span>
                                <span className="text-xs">Image or PDF (max 5MB)</span>
                            </div>
                        )}
                    </div>
                </div>

                {uploading && (
                    <div className="space-y-2">
                        <div className="flex justify-between text-xs text-muted-foreground">
                            <span>Uploading...</span>
                            <span>{uploadProgress}%</span>
                        </div>
                        <Progress value={uploadProgress} className="h-2" />
                    </div>
                )}

                <div className="flex gap-3">
                    <Button variant="outline" onClick={() => setStep(1)} disabled={uploading} className="flex-1">
                        Back
                    </Button>
                    <Button onClick={handleSubmit} disabled={!file || !paymentName.trim() || !paymentPhone.trim() || uploading} className="flex-1">
                        {uploading ? (
                            <>
                                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                                Verifying...
                            </>
                        ) : (
                            "Submit Payment"
                        )}
                    </Button>
                </div>
            </div>
        );
    };

    return (
        <>
            <Dialog open={isOpen} onOpenChange={onClose}>
                <DialogContent className="sm:max-w-md max-h-[90vh] flex flex-col">
                    <DialogHeader>
                        <DialogTitle>
                            {step === 1 ? "Choose Payment Method" : "Complete Payment"}
                        </DialogTitle>
                        <DialogDescription>
                            {step === 1
                                ? "Select your preferred payment method to continue."
                                : `Follow the instructions to pay for ${planName} plan.`}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="overflow-y-auto flex-1 pr-2">
                        {step === 1 ? renderStep1() : renderStep2()}
                    </div>
                </DialogContent>
            </Dialog>

            {/* Confirmation Dialog */}
            <Dialog open={showConfirmation} onOpenChange={setShowConfirmation}>
                <DialogContent className="sm:max-w-md">
                    <DialogHeader>
                        <div className="flex justify-center mb-4">
                            <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-10 h-10 text-green-600" />
                            </div>
                        </div>
                        <DialogTitle className="text-center text-xl">Payment Submitted Successfully!</DialogTitle>
                        <DialogDescription className="text-center space-y-3 pt-4">
                            <p className="text-base">
                                Thank you for your payment submission. Your upgrade to <span className="font-semibold text-primary">{planName}</span> plan is being processed.
                            </p>
                            <p className="text-sm text-muted-foreground">
                                Please wait up to <span className="font-semibold">15 minutes</span> for admin verification. You will be notified once your payment is verified.
                            </p>
                        </DialogDescription>
                    </DialogHeader>
                    <div className="flex flex-col gap-2 mt-4">
                        <Button
                            onClick={() => {
                                setShowConfirmation(false);
                                onClose();
                                navigate('/dashboard');
                            }}
                            className="w-full"
                        >
                            Go to Dashboard
                        </Button>
                    </div>
                </DialogContent>
            </Dialog>
        </>
    );
};

export default PaymentModal;
