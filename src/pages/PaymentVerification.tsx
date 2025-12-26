import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { isCloudflareUrl, isSupabaseUrl } from "@/integrations/cloudflare/client";
import { useToast } from "@/hooks/use-toast";
import { Bot, LogOut, CheckCircle, XCircle, Trash2, Eye, ArrowLeft, RefreshCw, AlertCircle } from "lucide-react";
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from "@/components/ui/alert-dialog";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import type { User } from "@supabase/supabase-js";

interface PaymentRequest {
    id: string;
    user_id: string;
    requested_plan: string;
    current_plan: string;
    amount: number;
    payment_method: string;
    payment_name: string | null;
    payment_phone: string | null;
    receipt_url: string | null;
    status: string;
    created_at: string;
    profiles?: {
        email: string;
    };
}

const PaymentVerification = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [paymentRequests, setPaymentRequests] = useState<PaymentRequest[]>([]);
    const [loading, setLoading] = useState(true);
    const [selectedReceipt, setSelectedReceipt] = useState<string | null>(null);
    const [deletingReceipt, setDeletingReceipt] = useState<string | null>(null);
    const [imageLoading, setImageLoading] = useState(false);
    const [imageError, setImageError] = useState(false);
    const [currentImageUrl, setCurrentImageUrl] = useState<string | null>(null);
    const navigate = useNavigate();
    const { toast } = useToast();

    useEffect(() => {
        checkAdminAccess();
    }, []);

    const checkAdminAccess = async () => {
        const { data: { session } } = await supabase.auth.getSession();

        if (!session) {
            navigate("/auth");
            return;
        }

        setUser(session.user);

        // Check if user has admin role
        const { data: roleData } = await supabase
            .from('user_roles')
            .select('role')
            .eq('user_id', session.user.id)
            .eq('role', 'admin')
            .maybeSingle();

        if (!roleData) {
            toast({
                title: "Access Denied",
                description: "You don't have admin permissions",
                variant: "destructive",
            });
            navigate("/dashboard");
            return;
        }

        setIsAdmin(true);
        loadPaymentRequests();
    };

    const loadPaymentRequests = async () => {
        try {
            const { data, error } = await supabase
                .from('payment_requests')
                .select(`
          *,
          profiles (email)
        `)
                .eq('status', 'pending')
                .order('created_at', { ascending: false });

            if (error) throw error;

            setPaymentRequests(data || []);
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

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/");
    };

    const verifyPayment = async (paymentId: string, userId: string, requestedPlan: string) => {
        try {
            const planLimits: Record<string, number> = {
                free: 50,
                starter: 500,
                enterprise: 5000,
            };

            // Update payment request status and set notification_shown to false
            const { error: paymentError } = await supabase
                .from('payment_requests')
                .update({
                    status: 'verified',
                    verified_by: user?.id,
                    verified_at: new Date().toISOString(),
                    notification_shown: false
                })
                .eq('id', paymentId);

            if (paymentError) throw paymentError;

            // Update user subscription
            const { error: subError } = await supabase
                .from('subscriptions')
                .update({
                    plan: requestedPlan as any, // Cast to any to bypass TypeScript error
                    message_limit: planLimits[requestedPlan],
                    is_active: true,
                    started_at: new Date().toISOString(),
                })
                .eq('user_id', userId);

            if (subError) throw subError;

            // Log admin action
            await supabase
                .from('admin_actions' as any) // Cast to any to bypass TypeScript error
                .insert({
                    admin_user_id: user?.id,
                    target_user_id: userId,
                    action_type: 'plan_change',
                    old_value: 'payment_verified',
                    new_value: requestedPlan,
                });

            // Send email notification to user
            try {
                // Get user email from payment request or query profiles
                let userEmail = paymentRequests.find(p => p.id === paymentId)?.profiles?.email;
                
                if (!userEmail) {
                    // Fallback: query profiles table
                    const { data: profile } = await supabase
                        .from('profiles')
                        .select('email')
                        .eq('id', userId)
                        .maybeSingle();
                    userEmail = profile?.email;
                }

                if (userEmail) {
                    console.log('📧 Sending plan verification email to:', userEmail);
                    const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
                    const functionUrl = `${supabaseUrl}/functions/v1/send-plan-verification-email`;
                    
                    const response = await fetch(functionUrl, {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY}`,
                        },
                        body: JSON.stringify({
                            email: userEmail,
                            plan: requestedPlan,
                        }),
                    });

                    if (!response.ok) {
                        console.error('❌ Failed to send plan verification email:', {
                            status: response.status,
                            statusText: response.statusText,
                        });
                    } else {
                        console.log('✅ Plan verification email sent successfully');
                    }
                } else {
                    console.warn('⚠️ User email not found, skipping email notification');
                }
            } catch (emailError: any) {
                // Don't fail verification if email fails
                console.error('❌ Error sending plan verification email:', emailError);
            }

            toast({
                title: "Payment Verified!",
                description: `User upgraded to ${requestedPlan} plan successfully.`,
            });

            loadPaymentRequests();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    const rejectPayment = async (paymentId: string, reason: string) => {
        try {
            const { error } = await supabase
                .from('payment_requests')
                .update({
                    status: 'rejected',
                    verified_by: user?.id,
                    verified_at: new Date().toISOString(),
                    rejection_reason: reason,
                })
                .eq('id', paymentId);

            if (error) throw error;

            toast({
                title: "Payment Rejected",
                description: "Payment request has been rejected.",
            });

            loadPaymentRequests();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    const deleteScreenshot = async (paymentId: string, receiptUrl: string | null) => {
        if (!receiptUrl) return;

        setDeletingReceipt(paymentId);
        try {
            // Extract file path from URL
            const url = new URL(receiptUrl);
            const pathParts = url.pathname.split('/');
            const filePath = pathParts.slice(pathParts.indexOf('payment_proofs') + 1).join('/');

            // Delete from storage
            const { error: storageError } = await supabase.storage
                .from('payment_proofs')
                .remove([filePath]);

            if (storageError) {
                console.error('Storage deletion error:', storageError);
                // Continue even if storage deletion fails
            }

            // Clear receipt_url in database
            const { error: dbError } = await supabase
                .from('payment_requests')
                .update({ receipt_url: null })
                .eq('id', paymentId);

            if (dbError) throw dbError;

            toast({
                title: "Screenshot Deleted",
                description: "Payment screenshot has been removed.",
            });

            loadPaymentRequests();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setDeletingReceipt(null);
        }
    };

    const getSignedUrl = async (publicUrl: string): Promise<string | null> => {
        try {
            console.log('Attempting to create signed URL from:', publicUrl);
            
            // Extract file path from public URL
            const url = new URL(publicUrl);
            console.log('Parsed URL pathname:', url.pathname);
            
            const pathParts = url.pathname.split('/');
            console.log('Path parts:', pathParts);
            
            const bucketIndex = pathParts.indexOf('payment_proofs');
            console.log('Bucket index:', bucketIndex);
            
            if (bucketIndex === -1) {
                console.error('Could not find payment_proofs in URL path');
                return null;
            }
            
            const filePath = pathParts.slice(bucketIndex + 1).join('/');
            console.log('Extracted file path:', filePath);

            if (!filePath) {
                console.error('File path is empty after extraction');
                return null;
            }

            // Get signed URL
            const { data, error } = await supabase.storage
                .from('payment_proofs')
                .createSignedUrl(filePath, 60 * 60); // 1 hour expiry

            if (error) {
                console.error('Error creating signed URL:', error);
                return null;
            }

            console.log('Successfully created signed URL');
            return data.signedUrl;
        } catch (error) {
            console.error('Error in getSignedUrl:', error);
            return null;
        }
    };

    const handleImageError = async () => {
        if (!selectedReceipt) return;
        
        // Cloudflare URLs should work directly, no need for signed URLs
        if (isCloudflareUrl(selectedReceipt)) {
            console.log('Cloudflare URL failed to load');
            setImageError(true);
            setImageLoading(false);
            return;
        }
        
        // For Supabase URLs, try signed URL as fallback
        if (isSupabaseUrl(selectedReceipt) && currentImageUrl === selectedReceipt) {
            console.log('Supabase public URL failed, trying signed URL...');
            const signedUrl = await getSignedUrl(selectedReceipt);
            if (signedUrl) {
                setCurrentImageUrl(signedUrl);
                setImageError(false);
                setImageLoading(true);
                return;
            }
        }
        
        // If both methods failed, show error
        setImageError(true);
        setImageLoading(false);
    };

    const handleViewReceipt = (receiptUrl: string | null) => {
        if (!receiptUrl) return;
        setSelectedReceipt(receiptUrl);
        setCurrentImageUrl(receiptUrl);
        setImageError(false);
        setImageLoading(true);
    };

    const handleRetryImage = async () => {
        if (!selectedReceipt) return;
        setImageError(false);
        setImageLoading(true);
        
        // Cloudflare URLs should work directly, just retry the same URL
        if (isCloudflareUrl(selectedReceipt)) {
            setCurrentImageUrl(selectedReceipt);
            return;
        }
        
        // For Supabase URLs, try signed URL
        if (isSupabaseUrl(selectedReceipt)) {
            const signedUrl = await getSignedUrl(selectedReceipt);
            if (signedUrl) {
                setCurrentImageUrl(signedUrl);
            } else {
                setCurrentImageUrl(selectedReceipt);
            }
        } else {
            // Unknown URL type, just retry
            setCurrentImageUrl(selectedReceipt);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
            </div>
        );
    }

    if (!isAdmin) return null;

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b border-border bg-card/50 backdrop-blur-sm">
                <div className="container mx-auto px-4 sm:px-6 py-3 sm:py-4 flex justify-between items-center gap-2 sm:gap-4">
                    <div className="flex items-center gap-2 min-w-0">
                        <Bot className="w-6 h-6 sm:w-8 sm:h-8 text-primary flex-shrink-0" />
                        <span className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent truncate">
                            Payment Verification
                        </span>
                    </div>
                    <div className="flex gap-1 sm:gap-2 flex-shrink-0">
                        <Button variant="ghost" onClick={() => navigate("/admin")} className="text-xs sm:text-sm">
                            <ArrowLeft className="w-4 h-4 sm:mr-2" />
                            <span className="hidden sm:inline">Back to Admin</span>
                        </Button>
                        <Button variant="ghost" size="icon" onClick={handleLogout} className="h-8 w-8 sm:h-10 sm:w-10">
                            <LogOut className="w-4 h-4 sm:w-5 sm:h-5" />
                        </Button>
                    </div>
                </div>
            </header>

            {/* Main Content */}
            <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8 md:py-12">
                <div className="mb-6">
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Pending Payment Requests</h1>
                    <p className="text-muted-foreground">Review and verify user payment submissions</p>
                </div>

                {paymentRequests.length === 0 ? (
                    <Card className="p-8 sm:p-12 text-center bg-gradient-card border-border">
                        <div className="flex flex-col items-center gap-4">
                            <CheckCircle className="w-16 h-16 text-muted-foreground" />
                            <h2 className="text-xl font-semibold">No Pending Payments</h2>
                            <p className="text-muted-foreground">All payment requests have been processed.</p>
                        </div>
                    </Card>
                ) : (
                    <Card className="p-4 sm:p-5 md:p-6 bg-gradient-card border-border">
                        <div className="overflow-x-auto -mx-4 sm:mx-0">
                            <div className="inline-block min-w-full align-middle px-4 sm:px-0">
                                <Table>
                                    <TableHeader>
                                        <TableRow>
                                            <TableHead className="text-xs sm:text-sm">User Email</TableHead>
                                            <TableHead className="text-xs sm:text-sm">Name</TableHead>
                                            <TableHead className="text-xs sm:text-sm">Phone</TableHead>
                                            <TableHead className="text-xs sm:text-sm">Plan</TableHead>
                                            <TableHead className="text-xs sm:text-sm">Amount</TableHead>
                                            <TableHead className="text-xs sm:text-sm hidden md:table-cell">Method</TableHead>
                                            <TableHead className="text-xs sm:text-sm hidden lg:table-cell">Date</TableHead>
                                            <TableHead className="text-xs sm:text-sm">Screenshot</TableHead>
                                            <TableHead className="text-xs sm:text-sm">Actions</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {paymentRequests.map((payment) => (
                                            <TableRow key={payment.id}>
                                                <TableCell className="font-medium text-xs sm:text-sm">
                                                    <div className="truncate max-w-[120px] sm:max-w-none">{payment.profiles?.email || 'N/A'}</div>
                                                </TableCell>
                                                <TableCell className="text-xs sm:text-sm">
                                                    <div className="truncate max-w-[100px] sm:max-w-none">{payment.payment_name || 'N/A'}</div>
                                                </TableCell>
                                                <TableCell className="text-xs sm:text-sm">
                                                    <div className="truncate max-w-[100px] sm:max-w-none">{payment.payment_phone || 'N/A'}</div>
                                                </TableCell>
                                                <TableCell className="text-xs sm:text-sm">
                                                    <div className="flex flex-col gap-1">
                                                        <span className="capitalize text-muted-foreground text-xs">{payment.current_plan}</span>
                                                        <span className="flex items-center gap-1">
                                                            <span className="text-muted-foreground">→</span>
                                                            <span className="capitalize font-semibold text-accent">{payment.requested_plan}</span>
                                                        </span>
                                                    </div>
                                                </TableCell>
                                                <TableCell className="font-semibold text-xs sm:text-sm">${payment.amount}</TableCell>
                                                <TableCell className="capitalize text-xs sm:text-sm hidden md:table-cell">{payment.payment_method}</TableCell>
                                                <TableCell className="text-xs sm:text-sm hidden lg:table-cell">
                                                    {new Date(payment.created_at).toLocaleDateString()}
                                                </TableCell>
                                                <TableCell>
                                                    {payment.receipt_url ? (
                                                        <div className="flex gap-1">
                                                            <Button
                                                                size="sm"
                                                                variant="outline"
                                                                className="text-xs h-7 px-2"
                                                                onClick={() => handleViewReceipt(payment.receipt_url)}
                                                            >
                                                                <Eye className="w-3 h-3 sm:mr-1" />
                                                                <span className="hidden sm:inline">View</span>
                                                            </Button>
                                                            <AlertDialog>
                                                                <AlertDialogTrigger asChild>
                                                                    <Button
                                                                        size="sm"
                                                                        variant="ghost"
                                                                        className="text-xs h-7 px-2 text-destructive hover:text-destructive"
                                                                        disabled={deletingReceipt === payment.id}
                                                                    >
                                                                        <Trash2 className="w-3 h-3" />
                                                                    </Button>
                                                                </AlertDialogTrigger>
                                                                <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
                                                                    <AlertDialogHeader>
                                                                        <AlertDialogTitle>Delete Screenshot?</AlertDialogTitle>
                                                                        <AlertDialogDescription>
                                                                            This will permanently delete the payment screenshot. This action cannot be undone.
                                                                        </AlertDialogDescription>
                                                                    </AlertDialogHeader>
                                                                    <AlertDialogFooter>
                                                                        <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                        <AlertDialogAction
                                                                            onClick={() => deleteScreenshot(payment.id, payment.receipt_url)}
                                                                            className="bg-destructive hover:bg-destructive/90"
                                                                        >
                                                                            Delete
                                                                        </AlertDialogAction>
                                                                    </AlertDialogFooter>
                                                                </AlertDialogContent>
                                                            </AlertDialog>
                                                        </div>
                                                    ) : (
                                                        <span className="text-xs text-muted-foreground">No screenshot</span>
                                                    )}
                                                </TableCell>
                                                <TableCell>
                                                    <div className="flex flex-col sm:flex-row gap-1 sm:gap-2">
                                                        <Button
                                                            size="sm"
                                                            className="bg-green-500 hover:bg-green-600 text-xs h-7 px-2"
                                                            onClick={() => verifyPayment(payment.id, payment.user_id, payment.requested_plan)}
                                                        >
                                                            <CheckCircle className="w-3 h-3 sm:mr-1" />
                                                            <span className="hidden sm:inline">Verify</span>
                                                        </Button>
                                                        <AlertDialog>
                                                            <AlertDialogTrigger asChild>
                                                                <Button
                                                                    size="sm"
                                                                    variant="destructive"
                                                                    className="text-xs h-7 px-2"
                                                                >
                                                                    <XCircle className="w-3 h-3 sm:mr-1" />
                                                                    <span className="hidden sm:inline">Reject</span>
                                                                </Button>
                                                            </AlertDialogTrigger>
                                                            <AlertDialogContent className="max-w-[95vw] sm:max-w-md">
                                                                <AlertDialogHeader>
                                                                    <AlertDialogTitle>Reject Payment?</AlertDialogTitle>
                                                                    <AlertDialogDescription>
                                                                        This will reject the payment request for {payment.profiles?.email}. The user will need to submit a new request.
                                                                    </AlertDialogDescription>
                                                                </AlertDialogHeader>
                                                                <AlertDialogFooter>
                                                                    <AlertDialogCancel>Cancel</AlertDialogCancel>
                                                                    <AlertDialogAction
                                                                        onClick={() => rejectPayment(payment.id, 'Payment not confirmed')}
                                                                        className="bg-destructive hover:bg-destructive/90"
                                                                    >
                                                                        Reject
                                                                    </AlertDialogAction>
                                                                </AlertDialogFooter>
                                                            </AlertDialogContent>
                                                        </AlertDialog>
                                                    </div>
                                                </TableCell>
                                            </TableRow>
                                        ))}
                                    </TableBody>
                                </Table>
                            </div>
                        </div>
                    </Card>
                )}
            </div>

            {/* Screenshot Preview Dialog */}
            <Dialog open={!!selectedReceipt} onOpenChange={() => {
                setSelectedReceipt(null);
                setImageError(false);
                setImageLoading(false);
                setCurrentImageUrl(null);
            }}>
                <DialogContent className="max-w-3xl max-h-[90vh] overflow-auto">
                    <DialogHeader>
                        <DialogTitle>Payment Screenshot</DialogTitle>
                        <DialogDescription>
                            View the payment receipt screenshot submitted by the user
                        </DialogDescription>
                    </DialogHeader>
                    {selectedReceipt && (
                        <div className="mt-4 relative">
                            {imageLoading && !imageError && (
                                <div className="absolute inset-0 flex items-center justify-center bg-muted/50 rounded-lg">
                                    <div className="flex flex-col items-center gap-2">
                                        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
                                        <p className="text-sm text-muted-foreground">Loading image...</p>
                                    </div>
                                </div>
                            )}
                            
                            {imageError ? (
                                <div className="flex flex-col items-center justify-center gap-4 p-8 bg-muted/30 rounded-lg border-2 border-dashed border-border">
                                    <AlertCircle className="w-12 h-12 text-destructive" />
                                    <div className="text-center">
                                        <h3 className="font-semibold mb-2">Failed to Load Image</h3>
                                        <p className="text-sm text-muted-foreground mb-4">
                                            The payment screenshot could not be loaded. This might be due to storage permissions or the file may have been moved.
                                        </p>
                                        <div className="flex gap-2 justify-center">
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={handleRetryImage}
                                            >
                                                <RefreshCw className="w-4 h-4 mr-2" />
                                                Retry
                                            </Button>
                                            <Button
                                                size="sm"
                                                variant="outline"
                                                onClick={() => window.open(selectedReceipt, '_blank')}
                                            >
                                                Open in New Tab
                                            </Button>
                                        </div>
                                    </div>
                                </div>
                            ) : (
                                <img
                                    src={currentImageUrl || selectedReceipt}
                                    alt="Payment receipt"
                                    className="w-full h-auto rounded-lg border border-border"
                                    onLoad={() => setImageLoading(false)}
                                    onError={handleImageError}
                                    style={{ display: imageLoading ? 'none' : 'block' }}
                                />
                            )}
                        </div>
                    )}
                </DialogContent>
            </Dialog>
        </div>
    );
};

export default PaymentVerification;
