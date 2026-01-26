import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import { Bot, LogOut, ArrowLeft, Bitcoin, CheckCircle, XCircle, Clock, AlertCircle } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import type { User } from "@supabase/supabase-js";

interface CryptoPayment {
    id: string;
    user_id: string;
    plan_id: string;
    order_id: string;
    status: string;
    amount: number;
    currency: string;
    payment_url: string | null;
    txid: string | null;
    created_at: string;
    updated_at: string;
    paid_at: string | null;
    profiles?: {
        email: string;
    };
}

const CryptoPayments = () => {
    const [user, setUser] = useState<User | null>(null);
    const [isAdmin, setIsAdmin] = useState(false);
    const [payments, setPayments] = useState<CryptoPayment[]>([]);
    const [loading, setLoading] = useState(true);
    const [filter, setFilter] = useState<'all' | 'pending' | 'paid' | 'failed'>('all');
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
        loadPayments();
    };

    const loadPayments = async () => {
        try {
            let query = supabase
                .from('payments')
                .select(`
          *,
          profiles (email)
        `)
                .order('created_at', { ascending: false });

            if (filter !== 'all') {
                query = query.eq('status', filter);
            }

            const { data, error } = await query;

            if (error) throw error;

            setPayments(data || []);
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

    useEffect(() => {
        if (isAdmin) {
            loadPayments();
        }
    }, [filter, isAdmin]);

    const handleLogout = async () => {
        await supabase.auth.signOut();
        navigate("/");
    };

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'paid':
                return <Badge className="bg-green-500 hover:bg-green-600"><CheckCircle className="w-3 h-3 mr-1" />Paid</Badge>;
            case 'pending':
                return <Badge className="bg-yellow-500 hover:bg-yellow-600"><Clock className="w-3 h-3 mr-1" />Pending</Badge>;
            case 'failed':
                return <Badge variant="destructive"><XCircle className="w-3 h-3 mr-1" />Failed</Badge>;
            case 'expired':
                return <Badge variant="secondary"><AlertCircle className="w-3 h-3 mr-1" />Expired</Badge>;
            default:
                return <Badge variant="outline">{status}</Badge>;
        }
    };

    const stats = {
        total: payments.length,
        paid: payments.filter(p => p.status === 'paid').length,
        pending: payments.filter(p => p.status === 'pending').length,
        failed: payments.filter(p => p.status === 'failed').length,
        totalRevenue: payments
            .filter(p => p.status === 'paid')
            .reduce((sum, p) => sum + p.amount, 0),
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
                    {/* Mobile: Back on Left, Title on Right */}
                    <div className="flex sm:hidden items-center justify-between w-full">
                        <Button variant="ghost" size="icon" onClick={() => navigate("/admin")} className="h-8 w-8">
                            <ArrowLeft className="w-5 h-5" />
                        </Button>
                        <div className="flex items-center gap-2 min-w-0">
                            <span className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent truncate">
                                Crypto Payments
                            </span>
                            <Bitcoin className="w-5 h-5 text-primary flex-shrink-0" />
                        </div>
                    </div>

                    {/* Desktop: Original Layout */}
                    <div className="hidden sm:flex items-center gap-2 min-w-0">
                        <Bitcoin className="w-6 h-6 sm:w-8 sm:h-8 text-primary flex-shrink-0" />
                        <span className="text-lg sm:text-xl md:text-2xl font-bold bg-gradient-primary bg-clip-text text-transparent truncate">
                            Crypto Payments
                        </span>
                    </div>
                    <div className="hidden sm:flex gap-1 sm:gap-2 flex-shrink-0">
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
                    <h1 className="text-2xl sm:text-3xl md:text-4xl font-bold mb-2">Cryptomus Payments</h1>
                    <p className="text-muted-foreground">Monitor all cryptocurrency payment transactions</p>
                </div>

                {/* Stats Cards */}
                <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
                    <Card className="p-4 bg-gradient-card border-border">
                        <div className="text-sm text-muted-foreground mb-1">Total Payments</div>
                        <div className="text-2xl font-bold">{stats.total}</div>
                    </Card>
                    <Card className="p-4 bg-gradient-card border-border">
                        <div className="text-sm text-muted-foreground mb-1">Paid</div>
                        <div className="text-2xl font-bold text-green-500">{stats.paid}</div>
                    </Card>
                    <Card className="p-4 bg-gradient-card border-border">
                        <div className="text-sm text-muted-foreground mb-1">Pending</div>
                        <div className="text-2xl font-bold text-yellow-500">{stats.pending}</div>
                    </Card>
                    <Card className="p-4 bg-gradient-card border-border">
                        <div className="text-sm text-muted-foreground mb-1">Failed</div>
                        <div className="text-2xl font-bold text-red-500">{stats.failed}</div>
                    </Card>
                    <Card className="p-4 bg-gradient-card border-border">
                        <div className="text-sm text-muted-foreground mb-1">Total Revenue</div>
                        <div className="text-2xl font-bold text-primary">${stats.totalRevenue.toFixed(2)}</div>
                    </Card>
                </div>

                {/* Filters */}
                <div className="flex gap-2 mb-6 overflow-x-auto pb-2">
                    <Button
                        variant={filter === 'all' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('all')}
                    >
                        All ({stats.total})
                    </Button>
                    <Button
                        variant={filter === 'pending' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('pending')}
                    >
                        Pending ({stats.pending})
                    </Button>
                    <Button
                        variant={filter === 'paid' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('paid')}
                    >
                        Paid ({stats.paid})
                    </Button>
                    <Button
                        variant={filter === 'failed' ? 'default' : 'outline'}
                        size="sm"
                        onClick={() => setFilter('failed')}
                    >
                        Failed ({stats.failed})
                    </Button>
                </div>

                {/* Payments Table */}
                {payments.length === 0 ? (
                    <Card className="p-8 sm:p-12 text-center bg-gradient-card border-border">
                        <div className="flex flex-col items-center gap-4">
                            <Bitcoin className="w-16 h-16 text-muted-foreground" />
                            <h2 className="text-xl font-semibold">No Crypto Payments</h2>
                            <p className="text-muted-foreground">
                                {filter === 'all'
                                    ? 'No cryptocurrency payments have been made yet.'
                                    : `No ${filter} payments found.`}
                            </p>
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
                                            <TableHead className="text-xs sm:text-sm">Plan</TableHead>
                                            <TableHead className="text-xs sm:text-sm">Amount</TableHead>
                                            <TableHead className="text-xs sm:text-sm">Status</TableHead>
                                            <TableHead className="text-xs sm:text-sm hidden lg:table-cell">Order ID</TableHead>
                                            <TableHead className="text-xs sm:text-sm hidden xl:table-cell">TX ID</TableHead>
                                            <TableHead className="text-xs sm:text-sm">Date</TableHead>
                                        </TableRow>
                                    </TableHeader>
                                    <TableBody>
                                        {payments.map((payment) => (
                                            <TableRow key={payment.id}>
                                                <TableCell className="font-medium text-xs sm:text-sm">
                                                    <div className="truncate max-w-[120px] sm:max-w-none">
                                                        {payment.profiles?.email || 'N/A'}
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-xs sm:text-sm">
                                                    <span className="capitalize font-semibold">{payment.plan_id}</span>
                                                </TableCell>
                                                <TableCell className="font-semibold text-xs sm:text-sm">
                                                    ${payment.amount} {payment.currency}
                                                </TableCell>
                                                <TableCell className="text-xs sm:text-sm">
                                                    {getStatusBadge(payment.status)}
                                                </TableCell>
                                                <TableCell className="text-xs sm:text-sm font-mono hidden lg:table-cell">
                                                    <div className="truncate max-w-[100px]" title={payment.order_id}>
                                                        {payment.order_id.slice(0, 8)}...
                                                    </div>
                                                </TableCell>
                                                <TableCell className="text-xs sm:text-sm font-mono hidden xl:table-cell">
                                                    {payment.txid ? (
                                                        <div className="truncate max-w-[100px]" title={payment.txid}>
                                                            {payment.txid.slice(0, 8)}...
                                                        </div>
                                                    ) : (
                                                        <span className="text-muted-foreground">-</span>
                                                    )}
                                                </TableCell>
                                                <TableCell className="text-xs sm:text-sm">
                                                    <div className="flex flex-col">
                                                        <span>{new Date(payment.created_at).toLocaleDateString()}</span>
                                                        <span className="text-xs text-muted-foreground">
                                                            {new Date(payment.created_at).toLocaleTimeString()}
                                                        </span>
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
        </div>
    );
};

export default CryptoPayments;
