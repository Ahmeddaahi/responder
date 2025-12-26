import { useEffect, useState } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { CheckCircle, ArrowRight, Loader2 } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

const PaymentSuccess = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const [loading, setLoading] = useState(true);
    const [paymentDetails, setPaymentDetails] = useState<any>(null);
    const orderId = searchParams.get("order_id");

    useEffect(() => {
        if (orderId) {
            checkPaymentStatus();
        } else {
            setLoading(false);
        }
    }, [orderId]);

    const checkPaymentStatus = async () => {
        try {
            const { data, error } = await supabase
                .from("payments")
                .select("*")
                .eq("order_id", orderId)
                .single();

            if (!error && data) {
                setPaymentDetails(data);
            }
        } catch (error) {
            console.error("Error fetching payment:", error);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="max-w-md w-full p-8 bg-gradient-card border-border">
                <div className="text-center space-y-6">
                    {loading ? (
                        <>
                            <Loader2 className="w-16 h-16 mx-auto text-primary animate-spin" />
                            <h1 className="text-2xl font-bold">Verifying Payment...</h1>
                            <p className="text-muted-foreground">
                                Please wait while we confirm your transaction.
                            </p>
                        </>
                    ) : (
                        <>
                            <div className="w-16 h-16 mx-auto bg-green-500/10 rounded-full flex items-center justify-center">
                                <CheckCircle className="w-10 h-10 text-green-500" />
                            </div>

                            <div>
                                <h1 className="text-3xl font-bold mb-2">Payment Successful!</h1>
                                <p className="text-muted-foreground">
                                    Thank you for your payment. Your transaction has been received.
                                </p>
                            </div>

                            {paymentDetails && (
                                <div className="bg-muted/50 p-4 rounded-lg space-y-2 text-left">
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Order ID:</span>
                                        <span className="font-mono font-semibold">
                                            {paymentDetails.order_id.slice(0, 8)}...
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Amount:</span>
                                        <span className="font-semibold">
                                            ${paymentDetails.amount} {paymentDetails.currency}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Plan:</span>
                                        <span className="font-semibold capitalize">
                                            {paymentDetails.plan_id}
                                        </span>
                                    </div>
                                    <div className="flex justify-between text-sm">
                                        <span className="text-muted-foreground">Status:</span>
                                        <span className="font-semibold text-green-600 capitalize">
                                            {paymentDetails.status}
                                        </span>
                                    </div>
                                </div>
                            )}

                            <div className="bg-blue-500/10 border border-blue-500/20 rounded-lg p-4">
                                <p className="text-sm text-blue-600">
                                    {paymentDetails?.status === "paid"
                                        ? "Your subscription has been activated! You can now start using your new plan."
                                        : "Your payment is being processed. Your subscription will be activated shortly."}
                                </p>
                            </div>

                            <div className="space-y-3">
                                <Button
                                    className="w-full bg-gradient-primary"
                                    onClick={() => navigate("/dashboard")}
                                >
                                    Go to Dashboard
                                    <ArrowRight className="w-4 h-4 ml-2" />
                                </Button>
                                <Button
                                    variant="outline"
                                    className="w-full"
                                    onClick={() => navigate("/pricing")}
                                >
                                    View Plans
                                </Button>
                            </div>
                        </>
                    )}
                </div>
            </Card>
        </div>
    );
};

export default PaymentSuccess;
