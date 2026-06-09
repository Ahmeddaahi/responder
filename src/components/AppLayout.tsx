import { ReactNode, useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { Bot, Settings, MessageSquare, LogOut, LayoutDashboard, Shield, HelpCircle, BarChart3, Calendar, Zap, Database } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarProvider,
  SidebarTrigger,
  SidebarInset,
} from "@/components/ui/sidebar";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { supabase } from "@/integrations/supabase/client";
import { useToast } from "@/hooks/use-toast";
import type { User as SupabaseUser } from "@supabase/supabase-js";
import { CommandPalette } from "@/components/CommandPalette";

interface AppLayoutProps {
  children: ReactNode;
}

const AppLayout = ({ children }: AppLayoutProps) => {
  const navigate = useNavigate();
  const location = useLocation();
  const { toast } = useToast();
  const [user, setUser] = useState<SupabaseUser | null>(null);
  const [userProfile, setUserProfile] = useState<{ full_name: string | null } | null>(null);
  const [isAdmin, setIsAdmin] = useState(false);
  const [plan, setPlan] = useState<string | null>(null);

  useEffect(() => {
    const checkUser = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user.id);
        checkAdminStatus(session.user.id);
        loadUserPlan(session.user.id);
      }
    };

    checkUser();

    const { data: { subscription } } = supabase.auth.onAuthStateChange((event, session) => {
      setUser(session?.user ?? null);
      if (session?.user) {
        loadUserProfile(session.user.id);
        checkAdminStatus(session.user.id);
        loadUserPlan(session.user.id);
      } else {
        setUserProfile(null);
        setIsAdmin(false);
        setPlan(null);
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loadUserProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('profiles')
        .select('full_name')
        .eq('id', userId)
        .maybeSingle();

      if (error) {
        console.error('Error loading profile:', error);
        return;
      }

      if (data) {
        setUserProfile(data);
      }
    } catch (error) {
      console.error('Error loading user profile:', error);
    }
  };

  const loadUserPlan = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('subscriptions')
        .select('plan')
        .eq('user_id', userId)
        .maybeSingle();

      if (!error && data) {
        setPlan(data.plan);
      }
    } catch (error) {
      console.error('Error loading user plan:', error);
    }
  };

  const checkAdminStatus = async (userId: string) => {
    try {
      const { data: roleData } = await supabase
        .from('user_roles')
        .select('role')
        .eq('user_id', userId)
        .eq('role', 'admin')
        .maybeSingle();

      setIsAdmin(!!roleData);
    } catch (error) {
      // User is not admin or error occurred
      setIsAdmin(false);
    }
  };

  const getDisplayName = (): string => {
    if (userProfile?.full_name) {
      return userProfile.full_name;
    }
    if (user?.email) {
      return user.email.split('@')[0];
    }
    return 'User';
  };

  const getInitials = (): string => {
    const displayName = getDisplayName();
    const parts = displayName.trim().split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }
    return displayName.substring(0, 2).toUpperCase();
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    toast({
      title: "Logged out",
      description: "You have been logged out successfully.",
    });
    navigate("/");
  };

  const menuItems = [
    {
      title: "Dashboard",
      icon: LayoutDashboard,
      path: "/dashboard",
    },
    {
      title: "Booking Config",
      icon: Bot,
      path: "/knowledge",
    },
    {
      title: "Bookings",
      icon: Calendar,
      path: "/bookings",
    },

    {
      title: "Messages",
      icon: MessageSquare,
      path: "/messages",
    },
    {
      title: "Settings",
      icon: Settings,
      path: "/settings",
    },
    {
      title: "WhatsApp Guide",
      icon: HelpCircle,
      path: "/whatsapp-guide",
    },
  ];

  return (
    <SidebarProvider>
      <Sidebar side="left" variant="sidebar" collapsible="offcanvas">
        <SidebarHeader className="border-b border-border">
          <div className="flex items-center gap-2 p-2">
            <img src="/favicon.webp" alt="Resbonder Logo" className="w-12 h-12" loading="eager" fetchpriority="high" width="48" height="48" style={{ aspectRatio: '1 / 1' }} />
            <span className="text-lg font-bold bg-gradient-primary bg-clip-text text-transparent">
              Resbonder
            </span>
          </div>
        </SidebarHeader>

        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                {menuItems.map((item) => {
                  const Icon = item.icon;
                  const isActive = location.pathname === item.path;

                  return (
                    <SidebarMenuItem key={item.path}>
                      <SidebarMenuButton
                        isActive={isActive}
                        onClick={() => navigate(item.path)}
                        tooltip={item.title}
                      >
                        <Icon className="w-4 h-4" />
                        <span>{item.title}</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  );
                })}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>

        <SidebarFooter className="border-t border-border flex flex-col gap-2 p-4">
          {plan !== 'enterprise' && (
            <div className="bg-gradient-to-br from-primary/20 via-primary/10 to-transparent border border-primary/20 rounded-xl p-3 mb-2">
              <div className="flex items-center gap-2 mb-2">
                <div className="p-1.5 bg-primary rounded-lg text-primary-foreground">
                  <Zap className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-bold">Upgrade to {plan === 'free' ? 'Pro' : 'Business'}</span>
              </div>
              <p className="text-[10px] text-muted-foreground mb-3 leading-tight">
                Unlock manual replies, unlimited custom fields, and priority AI.
              </p>
              <Button
                onClick={() => navigate("/pricing")}
                size="sm"
                className="w-full h-8 text-xs bg-primary hover:opacity-90 font-bold"
              >
                Upgrade Now
              </Button>
            </div>
          )}
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton onClick={handleLogout} tooltip="Logout">
                <LogOut className="w-4 h-4" />
                <span>Logout</span>
              </SidebarMenuButton>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>

      <SidebarInset>
        <header className="sticky top-0 z-10 flex h-14 items-center justify-between gap-2 sm:gap-4 border-b border-border bg-card/50 backdrop-blur-sm px-4 sm:px-6">
          <div className="flex items-center gap-2 sm:gap-4 min-w-0">
            <SidebarTrigger className="h-9 w-9" />
            <div className="flex items-center gap-2 min-w-0">
              <img src="/favicon.webp" alt="Resbonder Logo" className="w-8 h-8 sm:w-10 sm:h-10 flex-shrink-0" loading="eager" width="40" height="40" style={{ aspectRatio: '1 / 1' }} />
              <span className="text-base sm:text-lg font-bold bg-gradient-primary bg-clip-text text-transparent hidden xs:inline truncate">
                Resbonder
              </span>
            </div>
          </div>
          {user && (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 sm:gap-3 cursor-pointer min-w-0 hover:bg-muted/50 transition-colors focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 rounded-full p-1 sm:pr-3">
                  <Avatar className="h-7 w-7 sm:h-8 sm:w-8 flex-shrink-0 border-2 border-primary/20">
                    <AvatarFallback className="bg-primary text-primary-foreground text-[10px] sm:text-xs font-bold">
                      {getInitials()}
                    </AvatarFallback>
                  </Avatar>
                  <div className="flex flex-col items-start leading-none hidden sm:flex">
                    <span className="text-xs font-bold text-foreground truncate max-w-[100px] lg:max-w-[150px]">
                      {getDisplayName()}
                    </span>
                    <span className="text-[10px] text-muted-foreground uppercase font-semibold tracking-wider">
                      {isAdmin ? 'Admin' : (plan === 'starter' ? 'Pro' : plan === 'enterprise' ? 'Business' : plan === 'free' ? 'Free Trial' : plan ? plan.charAt(0).toUpperCase() + plan.slice(1) : 'Member')}
                    </span>
                  </div>
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{getDisplayName()}</p>
                    <p className="text-xs leading-none text-muted-foreground truncate">
                      {user.email}
                    </p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                {isAdmin && (
                  <DropdownMenuItem
                    onClick={() => navigate("/admin")}
                    className="cursor-pointer"
                  >
                    <Shield className="mr-2 h-4 w-4" />
                    <span>Admin</span>
                  </DropdownMenuItem>
                )}
                <DropdownMenuItem
                  onClick={() => navigate("/pricing")}
                  className="cursor-pointer text-primary font-bold"
                >
                  <Zap className="mr-2 h-4 w-4 fill-primary" />
                  <span>Upgrade Plan</span>
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleLogout} className="cursor-pointer">
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Logout</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          )}
        </header>

        <div className="flex-1 overflow-auto">
          {children}
        </div>
      </SidebarInset>
      <CommandPalette />
    </SidebarProvider>
  );
};

export default AppLayout;

