import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import {
    Calendar,
    Phone,
    Mail,
    User,
    Filter,
    Search,
    Clock,
    MapPin,
    Users,
    Bed,
    BriefcaseBusiness,
    Stethoscope,
    ChevronDown,
    ChevronUp,
    MessageSquare,
    Download,
    LayoutGrid,
    List as ListIcon,
    Trash2,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import {
    Select,
    SelectContent,
    SelectItem,
    SelectTrigger,
    SelectValue,
} from "@/components/ui/select";
import { CardSkeleton, PageHeaderSkeleton } from "@/components/ui/custom-skeletons";
import {
    AlertDialog,
    AlertDialogAction,
    AlertDialogCancel,
    AlertDialogContent,
    AlertDialogDescription,
    AlertDialogFooter,
    AlertDialogHeader,
    AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface Booking {
    id: string;
    customer_name: string | null;
    customer_id: string;
    customer_phone: string | null;
    customer_email: string | null;
    booking_type: string;
    status: string;
    platform: string;
    check_in_date: string | null;
    check_out_date: string | null;
    room_type: string | null;
    number_of_guests: number | null;
    reservation_date: string | null;
    reservation_time: string | null;
    number_of_people: number | null;
    table_preference: string | null;
    appointment_date: string | null;
    appointment_time: string | null;
    department: string | null;
    doctor_name: string | null;
    reason_for_visit: string | null;
    notes: string | null;
    business_name: string | null;
    custom_data: Record<string, any> | null;
    created_at: string | null;
    updated_at: string | null;
}

const Bookings = () => {
    const [user, setUser] = useState<SupabaseUser | null>(null);
    const [loading, setLoading] = useState(true);
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [filteredBookings, setFilteredBookings] = useState<Booking[]>([]);
    const [searchQuery, setSearchQuery] = useState("");
    const [filterType, setFilterType] = useState<string>("all");
    const [filterStatus, setFilterStatus] = useState<string>("all");
    const [dateFilter, setDateFilter] = useState("all");
    const [viewMode, setViewMode] = useState<"grid" | "table">("grid");
    const [expandedBooking, setExpandedBooking] = useState<string | null>(null);
    const [bookingToDelete, setBookingToDelete] = useState<string | null>(null);
    const navigate = useNavigate();
    const { toast } = useToast();

    useEffect(() => {
        checkUser();

        const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
            setUser(session?.user ?? null);
            if (!session) {
                navigate("/auth");
            }
        });

        return () => subscription.unsubscribe();
    }, [navigate]);

    useEffect(() => {
        if (user) {
            loadBookings();
        }
    }, [user]);

    useEffect(() => {
        filterBookings();
    }, [bookings, searchQuery, filterType, filterStatus, dateFilter]);

    const checkUser = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        setLoading(false);

        if (!session) {
            navigate("/auth");
        }
    };

    const loadBookings = async () => {
        if (!user) return;

        try {
            const { data, error } = await supabase
                .from("bookings")
                .select("*")
                .eq("user_id", user.id)
                .order("created_at", { ascending: false });

            if (error) {
                throw error;
            }

            setBookings(data || []);
        } catch (error: any) {
            console.error("Error loading bookings:", error);
            toast({
                title: "Error",
                description: "Failed to load bookings",
                variant: "destructive",
            });
        }
    };

    const handleDeleteBooking = async (id: string) => {
        try {
            const { error } = await supabase
                .from("bookings")
                .delete()
                .eq("id", id);

            if (error) throw error;

            toast({
                title: "Success",
                description: "Booking deleted successfully",
            });

            setBookings(bookings.filter((b) => b.id !== id));
            setFilteredBookings(filteredBookings.filter((b) => b.id !== id));
        } catch (error: any) {
            console.error("Error deleting booking:", error);
            toast({
                title: "Error",
                description: "Failed to delete booking",
                variant: "destructive",
            });
        } finally {
            setBookingToDelete(null);
        }
    };

    const filterBookings = () => {
        let filtered = [...bookings];

        // Filter by type
        if (filterType !== "all") {
            filtered = filtered.filter((b) => b.booking_type === filterType);
        }

        // Filter by status
        if (filterStatus !== "all") {
            filtered = filtered.filter((b) => b.status === filterStatus);
        }

        // Filter by search query
        if (searchQuery) {
            const query = searchQuery.toLowerCase();
            filtered = filtered.filter(
                (b) =>
                    b.customer_name?.toLowerCase().includes(query) ||
                    b.customer_phone?.toLowerCase().includes(query) ||
                    b.customer_email?.toLowerCase().includes(query) ||
                    b.customer_id?.toLowerCase().includes(query)
            );
        }

        // Filter by date (using updated_at with fallback to created_at)
        const now = new Date();
        if (dateFilter !== "all") {
            filtered = filtered.filter((b) => {
                const bookingDate = new Date(b.updated_at || b.created_at || "");
                switch (dateFilter) {
                    case "today":
                        return bookingDate.toDateString() === now.toDateString();
                    case "week":
                        const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
                        return bookingDate >= weekAgo;
                    case "month":
                        const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
                        return bookingDate >= monthAgo;
                    default:
                        return true;
                }
            });
        }

        // Sort by updated_at in descending order (most recently updated first)
        filtered.sort((a, b) => {
            const dateA = new Date(a.updated_at || a.created_at || 0).getTime();
            const dateB = new Date(b.updated_at || b.created_at || 0).getTime();
            return dateB - dateA;
        });

        setFilteredBookings(filtered);
    };

    const downloadCSV = () => {
        const headers = [
            "ID",
            "Customer Name",
            "Phone",
            "Email",
            "Type",
            "Status",
            "Platform",
            "Date",
        ];

        const csvContent = [
            headers.join(","),
            ...filteredBookings.map((b) =>
                [
                    b.id,
                    b.customer_name || "",
                    b.customer_phone || "",
                    b.customer_email || "",
                    b.booking_type,
                    b.status,
                    b.platform,
                    b.created_at,
                ]
                    .map((field) => `"${field}"`)
                    .join(",")
            ),
        ].join("\n");

        const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        if (link.download !== undefined) {
            const url = URL.createObjectURL(blob);
            link.setAttribute("href", url);
            link.setAttribute("download", `bookings_${new Date().toISOString().split("T")[0]}.csv`);
            link.style.visibility = "hidden";
            document.body.appendChild(link);
            link.click();
            document.body.removeChild(link);
        }
    };

    const getBookingTypeLabel = (type: string) => {
        switch (type) {
            case "hotel":
                return "Hotel";
            case "restaurant":
                return "Business Support";
            case "hospital":
                return "Hospital / Clinic";
            case "custom":
                return "Custom";
            default:
                return type;
        }
    };

    const getBookingTypeIcon = (type: string) => {
        switch (type) {
            case "hotel":
                return <Bed className="w-4 h-4" />;
            case "restaurant":
                return <BriefcaseBusiness className="w-4 h-4" />;
            case "hospital":
                return <Stethoscope className="w-4 h-4" />;
            default:
                return <Calendar className="w-4 h-4" />;
        }
    };

    const toggleExpanded = (bookingId: string) => {
        setExpandedBooking(expandedBooking === bookingId ? null : bookingId);
    };

    if (loading) {
        return (
            <AppLayout>
                <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
                    <PageHeaderSkeleton />
                    <CardSkeleton />
                </div>
            </AppLayout>
        );
    }

    return (
        <AppLayout>
            <div className="container mx-auto px-4 sm:px-6 py-6 sm:py-8">
                {/* Header */}
                <div className="mb-6 sm:mb-8">
                    <h1 className="text-2xl sm:text-4xl font-bold mb-2">Bookings</h1>
                    <p className="text-xs sm:text-base text-muted-foreground">
                        View and manage all customer bookings collected by your AI assistant
                    </p>
                </div>

                {/* Filters and Search */}
                <Card className="p-4 sm:p-6 mb-6">
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
                        {/* Search */}
                        <div className="lg:col-span-2">
                            <div className="relative">
                                <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                                <Input
                                    placeholder="Search bookings..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="pl-9 h-10 text-sm"
                                />
                            </div>
                        </div>

                        {/* Type Filter */}
                        <div className="w-full">
                            <Select value={filterType} onValueChange={setFilterType}>
                                <SelectTrigger className="h-10 text-sm">
                                    <SelectValue placeholder="All Types" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Types</SelectItem>
                                    <SelectItem value="hotel">Hotel</SelectItem>
                                    <SelectItem value="retail">Retail / Store</SelectItem>
                                    <SelectItem value="hospital">Hospital / Clinic</SelectItem>
                                    <SelectItem value="custom">Custom</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>

                        {/* Date Filter */}
                        <div className="w-full">
                            <Select value={dateFilter} onValueChange={setDateFilter}>
                                <SelectTrigger className="h-10 text-sm">
                                    <SelectValue placeholder="Date Range" />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="all">All Time</SelectItem>
                                    <SelectItem value="today">Today</SelectItem>
                                    <SelectItem value="week">This Week</SelectItem>
                                    <SelectItem value="month">This Month</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                    </div>

                    <div className="flex flex-col sm:flex-row justify-between items-center mt-4 sm:mt-6 pt-4 sm:pt-6 border-t border-border/50 gap-4">
                        <div className="flex items-center gap-2 bg-muted/50 p-1 rounded-xl w-full sm:w-auto">
                            <Button
                                variant={viewMode === "grid" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setViewMode("grid")}
                                className={`flex-1 sm:flex-none h-8 px-3 rounded-lg flex items-center justify-center gap-2 ${viewMode === "grid" ? "shadow-sm" : ""}`}
                            >
                                <LayoutGrid className="w-3.5 h-3.5" />
                                <span className="text-[11px] font-medium">Grid</span>
                            </Button>
                            <Button
                                variant={viewMode === "table" ? "default" : "ghost"}
                                size="sm"
                                onClick={() => setViewMode("table")}
                                className={`flex-1 sm:flex-none h-8 px-3 rounded-lg flex items-center justify-center gap-2 ${viewMode === "table" ? "shadow-sm" : ""}`}
                            >
                                <ListIcon className="w-3.5 h-3.5" />
                                <span className="text-[11px] font-medium">Table</span>
                            </Button>
                        </div>

                        <div className="flex items-center justify-between sm:justify-end gap-3 w-full sm:w-auto">
                            <span className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider">
                                {filteredBookings.length} Result{filteredBookings.length !== 1 ? 's' : ''}
                            </span>
                            <Button
                                variant="outline"
                                size="sm"
                                onClick={downloadCSV}
                                className="h-8 px-3 text-[11px] font-bold border-2 hover:bg-muted/50 transition-all"
                            >
                                <Download className="w-3.5 h-3.5 mr-1.5" />
                                Export
                            </Button>
                        </div>
                    </div>


                </Card>

                {/* Bookings List */}
                {filteredBookings.length === 0 ? (
                    <Card className="p-8 sm:p-12 text-center">
                        <Calendar className="w-16 h-16 mx-auto mb-4 text-muted-foreground opacity-50" />
                        <h3 className="text-xl font-semibold mb-2">No bookings found</h3>
                        <p className="text-muted-foreground mb-6">
                            {bookings.length === 0
                                ? "No bookings have been recorded yet. Once customers start making bookings through your AI assistant, they will appear here."
                                : "No bookings match your current filters. Try adjusting your search criteria."}
                        </p>
                        {bookings.length === 0 && (
                            <Button onClick={() => navigate("/knowledge")}>
                                Set Up Booking Flow
                            </Button>
                        )}
                    </Card>
                ) : viewMode === "grid" ? (
                    <div className="space-y-4">
                        {filteredBookings.map((booking) => (
                            <Card key={booking.id} className="overflow-hidden">
                                {/* Booking Header */}
                                <div
                                    className="p-4 sm:p-6 cursor-pointer hover:bg-muted/50 transition-colors"
                                    onClick={() => toggleExpanded(booking.id)}
                                >
                                    <div className="flex items-start justify-between gap-4">
                                        <div className="flex-1 min-w-0">
                                            <div className="flex items-center gap-2 mb-2">
                                                {getBookingTypeIcon(booking.booking_type)}
                                                <h3 className="text-lg font-semibold truncate">
                                                    {booking.customer_name || "Unknown Customer"}
                                                </h3>
                                                {booking.business_name && (
                                                    <Badge variant="outline" className="text-[10px] bg-primary/5 border-primary/20 text-primary">
                                                        {booking.business_name}
                                                    </Badge>
                                                )}
                                                <Badge
                                                    variant={
                                                        booking.status === "confirmed"
                                                            ? "default"
                                                            : booking.status === "cancelled"
                                                                ? "secondary"
                                                                : "outline"
                                                    }
                                                    className="capitalize"
                                                >
                                                    {booking.status}
                                                </Badge>
                                            </div>

                                            <div className="flex flex-wrap items-center gap-2 mb-3">
                                                {booking.customer_phone && (
                                                    <div className="flex items-center gap-1.5 text-xs bg-muted/50 px-2 py-1 rounded-md">
                                                        <Phone className="w-3 h-3 text-primary" />
                                                        <span>{booking.customer_phone}</span>
                                                    </div>
                                                )}
                                                {booking.customer_email && (
                                                    <div className="flex items-center gap-1.5 text-xs bg-muted/50 px-2 py-1 rounded-md max-w-full overflow-hidden">
                                                        <Mail className="w-3 h-3 text-primary" />
                                                        <span className="truncate">{booking.customer_email}</span>
                                                    </div>
                                                )}
                                                <div className="flex items-center gap-2 mt-1 w-full sm:w-auto">
                                                    <Badge variant="outline" className="text-[10px] capitalize bg-background">
                                                        {getBookingTypeLabel(booking.booking_type)}
                                                    </Badge>
                                                    <Badge variant="outline" className="text-[10px] capitalize bg-background">
                                                        {booking.platform}
                                                    </Badge>
                                                </div>
                                            </div>
                                        </div>

                                        <div className="flex items-center gap-2">
                                            {expandedBooking === booking.id ? (
                                                <ChevronUp className="w-5 h-5 text-muted-foreground" />
                                            ) : (
                                                <ChevronDown className="w-5 h-5 text-muted-foreground" />
                                            )}
                                        </div>
                                    </div>
                                </div>

                                {/* Expanded Details */}
                                {expandedBooking === booking.id && (
                                    <div className="border-t border-border p-4 sm:p-6 bg-muted/20">
                                        <div className="flex justify-end mb-4">
                                            <Button
                                                variant="destructive"
                                                size="sm"
                                                className="h-8 text-xs"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    setBookingToDelete(booking.id);
                                                }}
                                            >
                                                <Trash2 className="w-3.5 h-3.5 mr-2" />
                                                Delete Booking
                                            </Button>
                                        </div>
                                        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                                            {/* Customer Information */}
                                            <div>
                                                <h4 className="font-semibold mb-3 flex items-center justify-between">
                                                    <div className="flex items-center gap-2">
                                                        <User className="w-4 h-4" />
                                                        Customer Information
                                                    </div>
                                                    <Button
                                                        variant="outline"
                                                        size="sm"
                                                        className="h-7 text-xs"
                                                        onClick={(e) => {
                                                            e.stopPropagation();
                                                            navigate(`/messages?chat=${booking.customer_id}`);
                                                        }}
                                                    >
                                                        <MessageSquare className="w-3 h-3 mr-2" />
                                                        View Messages
                                                    </Button>
                                                </h4>
                                                <div className="space-y-2 text-sm">
                                                    <div>
                                                        <span className="text-muted-foreground">Name:</span>{" "}
                                                        <span className="font-medium">
                                                            {booking.customer_name || "Not provided"}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">Phone:</span>{" "}
                                                        <span className="font-medium">
                                                            {booking.customer_phone || "Not provided"}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">Email:</span>{" "}
                                                        <span className="font-medium">
                                                            {booking.customer_email || "Not provided"}
                                                        </span>
                                                    </div>
                                                    <div>
                                                        <span className="text-muted-foreground">Customer ID:</span>{" "}
                                                        <span className="font-mono text-xs">
                                                            {booking.customer_id}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>

                                            {/* Booking Details */}
                                            <div>
                                                <h4 className="font-semibold mb-3 flex items-center gap-2">
                                                    <Calendar className="w-4 h-4" />
                                                    Booking Details
                                                </h4>
                                                <div className="space-y-2 text-sm">
                                                    {/* Hotel Details */}
                                                    {booking.booking_type === "hotel" && (
                                                        <>
                                                            {booking.check_in_date && (
                                                                <div>
                                                                    <span className="text-muted-foreground">Check-in:</span>{" "}
                                                                    <span className="font-medium">
                                                                        {new Date(booking.check_in_date).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {booking.check_out_date && (
                                                                <div>
                                                                    <span className="text-muted-foreground">Check-out:</span>{" "}
                                                                    <span className="font-medium">
                                                                        {new Date(booking.check_out_date).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {booking.room_type && (
                                                                <div>
                                                                    <span className="text-muted-foreground">Room Type:</span>{" "}
                                                                    <span className="font-medium capitalize">
                                                                        {booking.room_type}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {booking.number_of_guests && (
                                                                <div>
                                                                    <span className="text-muted-foreground">Guests:</span>{" "}
                                                                    <span className="font-medium">
                                                                        {booking.number_of_guests}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}

                                                    {/* Retail Details */}
                                                    {booking.booking_type === "retail" && (
                                                        <>
                                                            {booking.custom_data?.product_inquiry && (
                                                                <div>
                                                                    <span className="text-muted-foreground">Inquiry:</span>{" "}
                                                                    <span className="font-medium">
                                                                        {booking.custom_data.product_inquiry}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}

                                                    {/* Hospital Details */}
                                                    {booking.booking_type === "hospital" && (
                                                        <>
                                                            {booking.appointment_date && (
                                                                <div>
                                                                    <span className="text-muted-foreground">Date:</span>{" "}
                                                                    <span className="font-medium">
                                                                        {new Date(booking.appointment_date).toLocaleDateString()}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {booking.appointment_time && (
                                                                <div>
                                                                    <span className="text-muted-foreground">Time:</span>{" "}
                                                                    <span className="font-medium">
                                                                        {booking.appointment_time}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {booking.department && (
                                                                <div>
                                                                    <span className="text-muted-foreground">Department:</span>{" "}
                                                                    <span className="font-medium capitalize">
                                                                        {booking.department}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {booking.doctor_name && (
                                                                <div>
                                                                    <span className="text-muted-foreground">Doctor:</span>{" "}
                                                                    <span className="font-medium">
                                                                        {booking.doctor_name}
                                                                    </span>
                                                                </div>
                                                            )}
                                                            {booking.reason_for_visit && (
                                                                <div>
                                                                    <span className="text-muted-foreground">Reason:</span>{" "}
                                                                    <span className="font-medium">
                                                                        {booking.reason_for_visit}
                                                                    </span>
                                                                </div>
                                                            )}
                                                        </>
                                                    )}

                                                    {/* Custom Data / Fields */}
                                                    {booking.custom_data && Object.keys(booking.custom_data).length > 0 && (
                                                        <>
                                                            {Object.entries(booking.custom_data)
                                                                .filter(([key]) => {
                                                                    const standardFields = [
                                                                        'customer_name', 'customer_phone', 'customer_email',
                                                                        'check_in_date', 'check_out_date', 'number_of_guests',
                                                                        'room_type', 'status', 'reservation_date', 'reservation_time',
                                                                        'number_of_people', 'table_preference', 'appointment_date',
                                                                        'appointment_time', 'department', 'doctor_name', 'reason_for_visit',
                                                                        'currency_clarification'
                                                                    ];
                                                                    const normalizedKey = key.toLowerCase().replace(/[\s_-]/g, '_');
                                                                    return !standardFields.includes(normalizedKey);
                                                                })
                                                                .map(([key, value]) => (
                                                                    <div key={key}>
                                                                        <span className="text-muted-foreground capitalize">
                                                                            {key.replace(/_/g, " ")}:
                                                                        </span>{" "}
                                                                        <span className="font-medium">
                                                                            {typeof value === 'boolean'
                                                                                ? (value ? 'Yes' : 'No')
                                                                                : String(value)}
                                                                        </span>
                                                                    </div>
                                                                ))}
                                                        </>
                                                    )}

                                                    {booking.notes && (
                                                        <div>
                                                            <span className="text-muted-foreground">Notes:</span>{" "}
                                                            <span className="font-medium">{booking.notes}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </div>
                                        </div>

                                        {/* Timestamps */}
                                        <div className="mt-6 pt-4 border-t border-border flex flex-wrap gap-4 text-xs text-muted-foreground">
                                            {booking.created_at && (
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    <span>
                                                        Created: {new Date(booking.created_at).toLocaleString()}
                                                    </span>
                                                </div>
                                            )}
                                            {booking.updated_at && (
                                                <div className="flex items-center gap-1">
                                                    <Clock className="w-3 h-3" />
                                                    <span>
                                                        Updated: {new Date(booking.updated_at).toLocaleString()}
                                                    </span>
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                )}
                            </Card>
                        ))}
                    </div>
                ) : (
                    <Card className="overflow-hidden">
                        <div className="overflow-x-auto">
                            <table className="w-full">
                                <thead className="bg-muted/50 border-b">
                                    <tr>
                                        <th className="text-left p-3 text-xs font-semibold">Customer</th>
                                        <th className="text-left p-3 text-xs font-semibold">Contact</th>
                                        <th className="text-left p-3 text-xs font-semibold">Type</th>
                                        <th className="text-left p-3 text-xs font-semibold">Status</th>
                                        <th className="text-left p-3 text-xs font-semibold">Date</th>
                                        <th className="text-left p-3 text-xs font-semibold">Platform</th>
                                        <th className="text-left p-3 text-xs font-semibold">Actions</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {filteredBookings.map((booking) => (
                                        <tr key={booking.id} className="border-b hover:bg-muted/30 transition-colors">
                                            <td className="p-3">
                                                <div className="flex items-center gap-2">
                                                    {getBookingTypeIcon(booking.booking_type)}
                                                    <div>
                                                        <div className="font-medium text-sm">
                                                            {booking.customer_name || "Unknown"}
                                                        </div>
                                                        {booking.business_name && (
                                                            <div className="text-[10px] text-muted-foreground">
                                                                {booking.business_name}
                                                            </div>
                                                        )}
                                                    </div>
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <div className="text-xs space-y-1">
                                                    {booking.customer_phone && (
                                                        <div className="flex items-center gap-1">
                                                            <Phone className="w-3 h-3 text-muted-foreground" />
                                                            <span>{booking.customer_phone}</span>
                                                        </div>
                                                    )}
                                                    {booking.customer_email && (
                                                        <div className="flex items-center gap-1">
                                                            <Mail className="w-3 h-3 text-muted-foreground" />
                                                            <span className="truncate max-w-[150px]">{booking.customer_email}</span>
                                                        </div>
                                                    )}
                                                </div>
                                            </td>
                                            <td className="p-3">
                                                <Badge variant="outline" className="text-[10px] capitalize">
                                                    {getBookingTypeLabel(booking.booking_type)}
                                                </Badge>
                                            </td>
                                            <td className="p-3">
                                                <Badge
                                                    variant={
                                                        booking.status === "confirmed"
                                                            ? "default"
                                                            : booking.status === "cancelled"
                                                                ? "secondary"
                                                                : "outline"
                                                    }
                                                    className="capitalize text-[10px]"
                                                >
                                                    {booking.status}
                                                </Badge>
                                            </td>
                                            <td className="p-3 text-xs text-muted-foreground">
                                                {booking.created_at && new Date(booking.created_at).toLocaleDateString()}
                                            </td>
                                            <td className="p-3">
                                                <Badge variant="outline" className="text-[10px] capitalize">
                                                    {booking.platform}
                                                </Badge>
                                            </td>
                                            <td className="p-3">
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 text-xs"
                                                    onClick={() => navigate(`/messages?chat=${booking.customer_id}`)}
                                                >
                                                    <MessageSquare className="w-3 h-3 mr-1" />
                                                    View
                                                </Button>
                                                <Button
                                                    variant="ghost"
                                                    size="sm"
                                                    className="h-7 text-xs text-destructive hover:text-destructive hover:bg-destructive/10"
                                                    onClick={() => setBookingToDelete(booking.id)}
                                                >
                                                    <Trash2 className="w-3 h-3" />
                                                </Button>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Card>
                )}

                <AlertDialog open={!!bookingToDelete} onOpenChange={(open) => !open && setBookingToDelete(null)}>
                    <AlertDialogContent>
                        <AlertDialogHeader>
                            <AlertDialogTitle>Are you absolutely sure?</AlertDialogTitle>
                            <AlertDialogDescription>
                                This action cannot be undone. This will permanently delete the booking
                                from the database.
                            </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                            <AlertDialogCancel>Cancel</AlertDialogCancel>
                            <AlertDialogAction
                                onClick={() => bookingToDelete && handleDeleteBooking(bookingToDelete)}
                                className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
                            >
                                Delete
                            </AlertDialogAction>
                        </AlertDialogFooter>
                    </AlertDialogContent>
                </AlertDialog>
            </div>
        </AppLayout>
    );
};

export default Bookings;
