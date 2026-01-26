import { useEffect, useState } from "react";
import { Plus, Edit, Trash2, Power, PowerOff, TrendingUp, Users, Calendar, DollarSign, Search, Filter, Loader2, Bot, LayoutDashboard, ChevronLeft } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/integrations/supabase/client";
import {
    Dialog,
    DialogContent,
    DialogDescription,
    DialogHeader,
    DialogTitle,
    DialogFooter,
} from "@/components/ui/dialog";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { format } from "date-fns";

interface PromoCode {
    id: string;
    user_id: string;
    code: string;
    name: string;
    type: "percentage" | "fixed";
    value: number;
    purpose: string;
    start_date: string;
    end_date: string | null;
    max_uses: number | null;
    max_uses_per_user: number;
    is_first_time_only: boolean;
    min_order_amount: number;
    is_stackable: boolean;
    is_enabled: boolean;
    restricted_plans: string[];
    created_at: string;
    total_uses?: number;
    total_discount?: number;
}

const AdminPromoCodes = () => {
    const [loading, setLoading] = useState(true);
    const [promoCodes, setPromoCodes] = useState<PromoCode[]>([]);
    const [isDialogOpen, setIsDialogOpen] = useState(false);
    const [editingPromo, setEditingPromo] = useState<PromoCode | null>(null);
    const [searchQuery, setSearchQuery] = useState("");
    const { toast } = useToast();
    const navigate = useNavigate();

    // Form State
    const [formData, setFormData] = useState({
        code: "",
        name: "",
        type: "percentage" as "percentage" | "fixed",
        value: 0,
        purpose: "SAAS Plan Discount",
        start_date: format(new Date(), "yyyy-MM-dd"),
        end_date: "",
        max_uses: "",
        max_uses_per_user: "1",
        is_first_time_only: false,
        min_order_amount: "0",
        is_stackable: false,
        is_enabled: true,
        restricted_plans: [] as string[],
    });

    useEffect(() => {
        checkAdminAccess();
    }, []);

    const checkAdminAccess = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            navigate("/auth");
            return;
        }

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

        fetchPromoCodes();
    };

    const fetchPromoCodes = async () => {
        try {
            setLoading(true);
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const { data, error } = await supabase
                .from("promo_codes")
                .select("*")
                .eq("user_id", session.user.id)
                .order("created_at", { ascending: false });

            if (error) throw error;

            // Fetch usage stats
            const codesWithStats = await Promise.all((data || []).map(async (promo) => {
                const { count, data: usageData } = await supabase
                    .from("promo_code_usage")
                    .select("discount_amount")
                    .eq("promo_id", promo.id);

                const totalDiscount = (usageData || []).reduce((sum, u) => sum + Number(u.discount_amount), 0);

                return {
                    ...promo,
                    total_uses: count || 0,
                    total_discount: totalDiscount
                };
            }));

            setPromoCodes(codesWithStats);
        } catch (error: any) {
            toast({
                title: "Error fetching promo codes",
                description: error.message,
                variant: "destructive",
            });
        } finally {
            setLoading(false);
        }
    };

    const handleCreateOrUpdate = async () => {
        try {
            const { data: { session } } = await supabase.auth.getSession();
            if (!session) return;

            const payload = {
                ...formData,
                user_id: session.user.id,
                value: Number(formData.value),
                max_uses: formData.max_uses ? Number(formData.max_uses) : null,
                max_uses_per_user: Number(formData.max_uses_per_user),
                min_order_amount: Number(formData.min_order_amount),
                end_date: formData.end_date || null,
            };

            if (editingPromo) {
                const { error } = await supabase
                    .from("promo_codes")
                    .update(payload)
                    .eq("id", editingPromo.id);
                if (error) throw error;
                toast({ title: "Promo code updated successfully" });
            } else {
                const { error } = await supabase
                    .from("promo_codes")
                    .insert([payload]);
                if (error) throw error;
                toast({ title: "Promo code created successfully" });
            }

            setIsDialogOpen(false);
            resetForm();
            fetchPromoCodes();
        } catch (error: any) {
            toast({
                title: "Error saving promo code",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    const toggleStatus = async (promo: PromoCode) => {
        try {
            const { error } = await supabase
                .from("promo_codes")
                .update({ is_enabled: !promo.is_enabled })
                .eq("id", promo.id);

            if (error) throw error;
            fetchPromoCodes();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    const handleDelete = async (id: string) => {
        if (!confirm("Are you sure you want to delete this promo code?")) return;

        try {
            const { error } = await supabase
                .from("promo_codes")
                .delete()
                .eq("id", id);

            if (error) throw error;
            toast({ title: "Promo code deleted" });
            fetchPromoCodes();
        } catch (error: any) {
            toast({
                title: "Error",
                description: error.message,
                variant: "destructive",
            });
        }
    };

    const resetForm = () => {
        setFormData({
            code: "",
            name: "",
            type: "percentage",
            value: 0,
            purpose: "SAAS Plan Discount",
            start_date: format(new Date(), "yyyy-MM-dd"),
            end_date: "",
            max_uses: "",
            max_uses_per_user: "1",
            is_first_time_only: false,
            min_order_amount: "0",
            is_stackable: false,
            is_enabled: true,
            restricted_plans: [],
        });
        setEditingPromo(null);
    };

    const openEditDialog = (promo: PromoCode) => {
        setEditingPromo(promo);
        setFormData({
            code: promo.code,
            name: promo.name,
            type: promo.type,
            value: promo.value,
            purpose: promo.purpose,
            start_date: format(new Date(promo.start_date), "yyyy-MM-dd"),
            end_date: promo.end_date ? format(new Date(promo.end_date), "yyyy-MM-dd") : "",
            max_uses: promo.max_uses?.toString() || "",
            max_uses_per_user: promo.max_uses_per_user.toString(),
            is_first_time_only: promo.is_first_time_only,
            min_order_amount: promo.min_order_amount.toString(),
            is_stackable: promo.is_stackable,
            is_enabled: promo.is_enabled,
            restricted_plans: promo.restricted_plans || [],
        });
        setIsDialogOpen(true);
    };

    const filteredCodes = promoCodes.filter(p =>
        p.code.toLowerCase().includes(searchQuery.toLowerCase()) ||
        p.name.toLowerCase().includes(searchQuery.toLowerCase())
    );

    const totalUses = promoCodes.reduce((sum, p) => sum + (p.total_uses || 0), 0);
    const totalDiscount = promoCodes.reduce((sum, p) => sum + (p.total_discount || 0), 0);
    const activeCodes = promoCodes.filter(p => p.is_enabled).length;

    return (
        <div className="min-h-screen bg-background">
            <header className="border-b border-border bg-card/80 backdrop-blur-md sticky top-0 z-50">
                <div className="container mx-auto px-4 py-3 flex justify-between items-center">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="icon" onClick={() => navigate("/admin")} className="hidden sm:flex">
                            <ChevronLeft className="w-5 h-5" />
                        </Button>
                        <div className="flex items-center gap-2">
                            <Bot className="w-6 h-6 text-primary" />
                            <span className="text-xl font-bold bg-gradient-primary bg-clip-text text-transparent">
                                SAAS Promo Codes
                            </span>
                        </div>
                    </div>
                    <div className="flex items-center gap-2">
                        <Button onClick={() => navigate("/admin")} variant="ghost" size="icon" className="sm:hidden">
                            <ChevronLeft className="w-6 h-6" />
                        </Button>
                        <Button onClick={() => navigate("/admin")} variant="outline" size="sm" className="hidden sm:flex">
                            <LayoutDashboard className="w-4 h-4 mr-2" />
                            Back to Admin
                        </Button>
                    </div>
                </div>
            </header>

            <div className="container mx-auto px-4 py-8">
                <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-8">
                    <div>
                        <h1 className="text-3xl font-bold">Manage Discounts</h1>
                        <p className="text-muted-foreground">Create and monitor promo codes for SAAS plan subscriptions</p>
                    </div>
                    <Button onClick={() => { resetForm(); setIsDialogOpen(true); }} className="bg-gradient-primary">
                        <Plus className="w-4 h-4 mr-2" />
                        Create SAAS Promo
                    </Button>
                </div>

                {/* Analytics Summary */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                    <Card className="p-6 flex items-center gap-4 bg-gradient-to-br from-card to-card/50 border-border/50 shadow-sm">
                        <div className="p-3 bg-primary/10 rounded-2xl">
                            <Users className="w-6 h-6 text-primary" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Redemptions</p>
                            <p className="text-2xl font-bold">{totalUses}</p>
                        </div>
                    </Card>
                    <Card className="p-6 flex items-center gap-4 bg-gradient-to-br from-card to-card/50 border-border/50 shadow-sm">
                        <div className="p-3 bg-emerald-500/10 rounded-2xl">
                            <DollarSign className="w-6 h-6 text-emerald-500" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Total Savings Given</p>
                            <p className="text-2xl font-bold">${totalDiscount.toLocaleString()}</p>
                        </div>
                    </Card>
                    <Card className="p-6 flex items-center gap-4 bg-gradient-to-br from-card to-card/50 border-border/50 shadow-sm">
                        <div className="p-3 bg-secondary/10 rounded-2xl">
                            <TrendingUp className="w-6 h-6 text-secondary" />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-muted-foreground">Active Campaigns</p>
                            <p className="text-2xl font-bold">{activeCodes}</p>
                        </div>
                    </Card>
                </div>

                {/* Search & Filter */}
                <Card className="mb-8">
                    <div className="p-4 border-b border-border/50 flex flex-col md:flex-row gap-4 items-center">
                        <div className="relative flex-1 w-full">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Search by code or name..."
                                className="pl-10"
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                            />
                        </div>
                        <div className="flex gap-2 w-full md:w-auto">
                            <Button variant="outline" className="gap-2 flex-1 md:flex-none">
                                <Filter className="w-4 h-4" />
                                Filters
                            </Button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full">
                            <thead className="bg-muted/50">
                                <tr>
                                    <th className="p-4 text-left font-semibold">Promo Code</th>
                                    <th className="p-4 text-left font-semibold">Value</th>
                                    <th className="p-4 text-left font-semibold">Usage</th>
                                    <th className="p-4 text-left font-semibold">Status</th>
                                    <th className="p-4 text-left font-semibold">Expiry</th>
                                    <th className="p-4 text-right font-semibold">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center text-muted-foreground">
                                            <div className="flex flex-col items-center gap-2">
                                                <Loader2 className="w-8 h-8 animate-spin text-primary" />
                                                <p>Loading promo codes...</p>
                                            </div>
                                        </td>
                                    </tr>
                                ) : filteredCodes.length === 0 ? (
                                    <tr>
                                        <td colSpan={6} className="p-12 text-center text-muted-foreground">
                                            No promo codes found matching your search.
                                        </td>
                                    </tr>
                                ) : (
                                    filteredCodes.map((promo) => (
                                        <tr key={promo.id} className="hover:bg-muted/30 transition-colors group">
                                            <td className="p-4">
                                                <div className="flex flex-col">
                                                    <span className="font-bold text-lg text-primary">{promo.code}</span>
                                                    <span className="text-sm text-muted-foreground">{promo.name}</span>
                                                </div>
                                            </td>
                                            <td className="p-4">
                                                <Badge variant="secondary" className="text-md font-medium px-3 py-1">
                                                    {promo.type === "percentage" ? `${promo.value}% OFF` : `$${promo.value} OFF`}
                                                </Badge>
                                            </td>
                                            <td className="p-4 text-sm text-muted-foreground">
                                                {promo.total_uses} / {promo.max_uses || "∞"} uses
                                            </td>
                                            <td className="p-4">
                                                {promo.is_enabled ? (
                                                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">Active</Badge>
                                                ) : (
                                                    <Badge variant="outline" className="text-muted-foreground">Disabled</Badge>
                                                )}
                                            </td>
                                            <td className="p-4 text-sm text-muted-foreground">
                                                <div className="flex items-center gap-1">
                                                    <Calendar className="w-3 h-3" />
                                                    {promo.end_date ? format(new Date(promo.end_date), "MMM d, yyyy") : "No expiry"}
                                                </div>
                                            </td>
                                            <td className="p-4 text-right space-x-2">
                                                <Button variant="ghost" size="icon" onClick={() => toggleStatus(promo)} title={promo.is_enabled ? "Disable" : "Enable"}>
                                                    {promo.is_enabled ? <PowerOff className="w-4 h-4" /> : <Power className="w-4 h-4" />}
                                                </Button>
                                                <Button variant="ghost" size="icon" onClick={() => openEditDialog(promo)}>
                                                    <Edit className="w-4 h-4" />
                                                </Button>
                                                <Button variant="ghost" size="icon" className="text-destructive" onClick={() => handleDelete(promo.id)}>
                                                    <Trash2 className="w-4 h-4" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>
                </Card>

                {/* Create/Edit Dialog */}
                <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
                    <DialogContent className="sm:max-w-[600px] max-h-[90vh] overflow-y-auto">
                        <DialogHeader>
                            <DialogTitle>{editingPromo ? "Edit SAAS Promo Code" : "Create New SAAS Promo Code"}</DialogTitle>
                            <DialogDescription>
                                Set the rules and limits for your SAAS plan discount.
                            </DialogDescription>
                        </DialogHeader>
                        <div className="grid gap-4 py-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="code">Promo Code</Label>
                                    <Input
                                        id="code"
                                        placeholder="E.g. SUMMER50"
                                        value={formData.code}
                                        onChange={(e) => setFormData({ ...formData, code: e.target.value.toUpperCase() })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="name">Campaign Name</Label>
                                    <Input
                                        id="name"
                                        placeholder="E.g. Summer Sale 2024"
                                        value={formData.name}
                                        onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="type">Discount Type</Label>
                                    <Select
                                        value={formData.type}
                                        onValueChange={(value: any) => setFormData({ ...formData, type: value })}
                                    >
                                        <SelectTrigger>
                                            <SelectValue placeholder="Select type" />
                                        </SelectTrigger>
                                        <SelectContent>
                                            <SelectItem value="percentage">Percentage (%)</SelectItem>
                                            <SelectItem value="fixed">Fixed Amount ($)</SelectItem>
                                        </SelectContent>
                                    </Select>
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="value">Discount Value</Label>
                                    <Input
                                        id="value"
                                        type="number"
                                        value={formData.value}
                                        onChange={(e) => setFormData({ ...formData, value: Number(e.target.value) })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-2">
                                <Label>Restricted Plans (Optional)</Label>
                                <div className="flex flex-wrap gap-2 p-3 border rounded-md">
                                    {['starter', 'enterprise', 'custom'].map((plan) => (
                                        <label key={plan} className="flex items-center gap-2 cursor-pointer">
                                            <input
                                                type="checkbox"
                                                checked={formData.restricted_plans.includes(plan)}
                                                onChange={(e) => {
                                                    const updated = e.target.checked
                                                        ? [...formData.restricted_plans, plan]
                                                        : formData.restricted_plans.filter(p => p !== plan);
                                                    setFormData({ ...formData, restricted_plans: updated });
                                                }}
                                                className="w-4 h-4 text-primary rounded border-gray-300 focus:ring-primary"
                                            />
                                            <span className="text-sm capitalize">{plan === 'starter' ? 'Pro' : plan === 'enterprise' ? 'Business' : plan}</span>
                                        </label>
                                    ))}
                                    {formData.restricted_plans.length === 0 && (
                                        <span className="text-xs text-muted-foreground">Apply to all plans</span>
                                    )}
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="start_date">Start Date</Label>
                                    <Input
                                        id="start_date"
                                        type="date"
                                        value={formData.start_date}
                                        onChange={(e) => setFormData({ ...formData, start_date: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="end_date">End Date (Optional)</Label>
                                    <Input
                                        id="end_date"
                                        type="date"
                                        value={formData.end_date}
                                        onChange={(e) => setFormData({ ...formData, end_date: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="grid grid-cols-2 gap-4">
                                <div className="space-y-2">
                                    <Label htmlFor="max_uses">Total Usage Limit</Label>
                                    <Input
                                        id="max_uses"
                                        type="number"
                                        placeholder="Leave empty for unlimited"
                                        value={formData.max_uses}
                                        onChange={(e) => setFormData({ ...formData, max_uses: e.target.value })}
                                    />
                                </div>
                                <div className="space-y-2">
                                    <Label htmlFor="max_uses_per_user">Uses Per User</Label>
                                    <Input
                                        id="max_uses_per_user"
                                        type="number"
                                        value={formData.max_uses_per_user}
                                        onChange={(e) => setFormData({ ...formData, max_uses_per_user: e.target.value })}
                                    />
                                </div>
                            </div>

                            <div className="space-y-4 pt-2">
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>First-Time Users Only</Label>
                                        <p className="text-sm text-muted-foreground">Only for users with no previous successful payments</p>
                                    </div>
                                    <Switch
                                        checked={formData.is_first_time_only}
                                        onCheckedChange={(checked) => setFormData({ ...formData, is_first_time_only: checked })}
                                    />
                                </div>
                                <div className="flex items-center justify-between">
                                    <div className="space-y-0.5">
                                        <Label>Enabled</Label>
                                        <p className="text-sm text-muted-foreground">Allow this code to be used immediately</p>
                                    </div>
                                    <Switch
                                        checked={formData.is_enabled}
                                        onCheckedChange={(checked) => setFormData({ ...formData, is_enabled: checked })}
                                    />
                                </div>
                            </div>
                        </div>
                        <DialogFooter>
                            <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Cancel</Button>
                            <Button onClick={handleCreateOrUpdate}>{editingPromo ? "Save Changes" : "Create Promo"}</Button>
                        </DialogFooter>
                    </DialogContent>
                </Dialog>
            </div>
        </div>
    );
};

export default AdminPromoCodes;
