import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { LogOut, Settings, TrendingUp, Clock, CheckCircle, AlertCircle } from "lucide-react";

interface Complaint {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  profiles: {
    name: string;
    email: string;
  } | null;
  complaint_categories: {
    name: string;
  } | null;
}

const AdminDashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [stats, setStats] = useState({ new: 0, inProgress: 0, resolved: 0, total: 0 });
  const [loading, setLoading] = useState(true);
  const [filterStatus, setFilterStatus] = useState<string>("all");

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/admin/auth");
        return;
      }

      const { data: roleData } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", session.user.id)
        .eq("role", "admin")
        .maybeSingle();

      if (!roleData) {
        await supabase.auth.signOut();
        toast({
          title: "Access Denied",
          description: "You don't have admin privileges.",
          variant: "destructive",
        });
        navigate("/admin/auth");
        return;
      }

      await fetchComplaints();
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        if (!session) {
          navigate("/admin/auth");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate, toast]);

  const fetchComplaints = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("complaints")
      .select(`
        *,
        complaint_categories (
          name
        )
      `)
      .order("created_at", { ascending: false });

    setLoading(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch complaints",
        variant: "destructive",
      });
    } else if (data) {
      // Fetch user profiles separately
      const complaintsWithProfiles = await Promise.all(
        data.map(async (complaint) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("name, email")
            .eq("id", complaint.user_id)
            .single();
          
          return {
            ...complaint,
            profiles: profile || { name: "Unknown", email: "N/A" },
          };
        })
      );
      
      setComplaints(complaintsWithProfiles as any);
      
      const newCount = data?.filter((c) => c.status === "new").length || 0;
      const inProgressCount = data?.filter((c) => c.status === "in_progress").length || 0;
      const resolvedCount = data?.filter((c) => c.status === "resolved" || c.status === "closed").length || 0;
      
      setStats({
        new: newCount,
        inProgress: inProgressCount,
        resolved: resolvedCount,
        total: data?.length || 0,
      });
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/admin/auth");
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "new":
        return "bg-accent text-accent-foreground";
      case "in_progress":
        return "bg-warning text-warning-foreground";
      case "resolved":
        return "bg-success text-success-foreground";
      case "closed":
        return "bg-muted text-muted-foreground";
      default:
        return "bg-secondary text-secondary-foreground";
    }
  };

  const formatStatus = (status: string) => {
    return status.replace("_", " ").replace(/\b\w/g, (l) => l.toUpperCase());
  };

  const filteredComplaints = filterStatus === "all" 
    ? complaints 
    : complaints.filter((c) => c.status === filterStatus);

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-primary">BroFix Admin</h1>
            <p className="text-sm text-muted-foreground">Complaint Management Dashboard</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/admin/settings")}>
              <Settings className="mr-2 h-4 w-4" />
              Settings
            </Button>
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="mr-2 h-4 w-4" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Total Complaints</CardTitle>
              <TrendingUp className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.total}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">New</CardTitle>
              <AlertCircle className="h-4 w-4 text-accent" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.new}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">In Progress</CardTitle>
              <Clock className="h-4 w-4 text-warning" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.inProgress}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium">Resolved</CardTitle>
              <CheckCircle className="h-4 w-4 text-success" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.resolved}</div>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between items-center mb-6">
          <h2 className="text-2xl font-bold">All Complaints</h2>
          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="new">New</SelectItem>
              <SelectItem value="in_progress">In Progress</SelectItem>
              <SelectItem value="resolved">Resolved</SelectItem>
              <SelectItem value="closed">Closed</SelectItem>
            </SelectContent>
          </Select>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Loading complaints...</p>
          </div>
        ) : filteredComplaints.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent className="pt-6">
              <p className="text-muted-foreground">No complaints found</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {filteredComplaints.map((complaint) => (
              <Card
                key={complaint.id}
                className="hover:shadow-elevated transition-shadow cursor-pointer"
                onClick={() => navigate(`/admin/complaint/${complaint.id}`)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1 flex-1">
                      <CardTitle className="text-lg">{complaint.title}</CardTitle>
                      <CardDescription>
                        {complaint.profiles?.name || "Unknown"} ({complaint.profiles?.email})
                      </CardDescription>
                      <div className="flex gap-2 mt-2">
                        <Badge variant="outline">{complaint.complaint_categories?.name}</Badge>
                        <Badge variant="outline">{complaint.priority}</Badge>
                      </div>
                    </div>
                    <Badge className={getStatusColor(complaint.status)}>
                      {formatStatus(complaint.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2">
                    {complaint.description}
                  </p>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default AdminDashboard;
