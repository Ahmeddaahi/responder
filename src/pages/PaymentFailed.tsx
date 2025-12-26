import { useNavigate, useSearchParams } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { XCircle, ArrowLeft, RefreshCw } from "lucide-react";

const PaymentFailed = () => {
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const orderId = searchParams.get("order_id");

    return (
        <div className="min-h-screen bg-background flex items-center justify-center p-4">
            <Card className="max-w-md w-full p-8 bg-gradient-card border-border border-red-500/20">
                <div className="text-center space-y-6">
                    <div className="w-16 h-16 mx-auto bg-red-500/10 rounded-full flex items-center justify-center">
                        <XCircle className="w-10 h-10 text-red-500" />
                    </div>

                    <div>
                        <h1 className="text-3xl font-bold mb-2">Payment Failed</h1>
                        <p className="text-muted-foreground">
                            Unfortunately, your payment could not be processed.
                        </p>
                    </div>

                    {orderId && (
                        <div className="bg-muted/50 p-4 rounded-lg">
                            <div className="flex justify-between text-sm">
                                <span className="text-muted-foreground">Order ID:</span>
                                <span className="font-mono font-semibold">
                                    {orderId.slice(0, 8)}...
                                </span>
                            </div>
                        </div>
                    )}

                    <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
                        <p className="text-sm text-yellow-600">
                            <strong>Common reasons for payment failure:</strong>
                        </p>
                        <ul className="text-xs text-yellow-600/80 mt-2 space-y-1 text-left list-disc list-inside">
                            <li>Insufficient funds in wallet</li>
                            <li>Payment timeout or cancellation</li>
                            <li>Network issues during transaction</li>
                            <li>Incorrect payment amount</li>
                        </ul>
                    </div>

                    <div className="space-y-3">
                        <Button
                            className="w-full bg-gradient-primary"
                            onClick={() => navigate("/pricing")}
                        >
                            <RefreshCw className="w-4 h-4 mr-2" />
                            Try Again
                        </Button>
                        <Button
                            variant="outline"
                            className="w-full"
                            onClick={() => navigate("/dashboard")}
                        >
                            <ArrowLeft className="w-4 h-4 mr-2" />
                            Back to Dashboard
                        </Button>
                    </div>

                    <div className="pt-4 border-t border-border">
                        <p className="text-xs text-muted-foreground">
                            Need help? Contact support at{" "}
                            <a
                                href="mailto:support@resbonder.com"
                                className="text-primary hover:underline"
                            >
                                support@resbonder.com
                            </a>
                        </p>
                    </div>
                </div>
            </Card>
        </div>
    );
};

export default PaymentFailed;
