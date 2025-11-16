import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { Plus, LogOut, MessageSquare, Clock, Settings } from "lucide-react";
import type { User } from "@supabase/supabase-js";
import { useTranslation } from "react-i18next";

interface Complaint {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  complaint_categories: {
    name: string;
  } | null;
}

const Dashboard = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [user, setUser] = useState<User | null>(null);
  const [complaints, setComplaints] = useState<Complaint[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        navigate("/auth");
        return;
      }

      setUser(session.user);
      await fetchComplaints(session.user.id);
    };

    checkAuth();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      (event, session) => {
        setUser(session?.user ?? null);
        if (!session) {
          navigate("/auth");
        }
      }
    );

    return () => subscription.unsubscribe();
  }, [navigate]);

  const fetchComplaints = async (userId: string) => {
    setLoading(true);
    const { data, error } = await supabase
      .from("complaints")
      .select(`
        *,
        complaint_categories (
          name
        )
      `)
      .eq("user_id", userId)
      .order("created_at", { ascending: false });

    setLoading(false);

    if (error) {
      toast({
        title: t('dashboard.error'),
        description: t('dashboard.fetchError'),
        variant: "destructive",
      });
    } else {
      setComplaints(data || []);
    }
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    navigate("/auth");
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
    return t(`status.${status}`);
  };

  const formatPriority = (priority: string) => {
    return t(`priority.${priority}`);
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-card">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-4">
            <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
              <Settings className="h-5 w-5" />
            </Button>
            <h1 className="text-2xl font-bold text-primary">BroFix</h1>
          </div>
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="mr-2 h-4 w-4" />
            {t('nav.logout')}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h2 className="text-3xl font-bold">{t('dashboard.myComplaints')}</h2>
            <p className="text-muted-foreground mt-1">
              {t('dashboard.trackAndManage')}
            </p>
          </div>
          <Button onClick={() => navigate("/submit-complaint")}>
            <Plus className="mr-2 h-4 w-4" />
            {t('dashboard.newComplaint')}
          </Button>
        </div>

        {loading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">{t('common.loading')}</p>
          </div>
        ) : complaints.length === 0 ? (
          <Card className="text-center py-12">
            <CardContent className="pt-6">
              <MessageSquare className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">{t('dashboard.noComplaints')}</h3>
              <p className="text-muted-foreground mb-4">
                {t('dashboard.submitFirst')}
              </p>
              <Button onClick={() => navigate("/submit-complaint")}>
                <Plus className="mr-2 h-4 w-4" />
                {t('complaint.submitComplaint')}
              </Button>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4">
            {complaints.map((complaint) => (
              <Card
                key={complaint.id}
                className="hover:shadow-elevated transition-shadow cursor-pointer"
                onClick={() => navigate(`/complaint/${complaint.id}`)}
              >
                <CardHeader>
                  <div className="flex justify-between items-start">
                    <div className="space-y-1">
                      <CardTitle className="text-xl">{complaint.title}</CardTitle>
                      <CardDescription>
                        {complaint.complaint_categories?.name || "Uncategorized"}
                      </CardDescription>
                    </div>
                    <Badge className={getStatusColor(complaint.status)}>
                      {formatStatus(complaint.status)}
                    </Badge>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground line-clamp-2 mb-3">
                    {complaint.description}
                  </p>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <Clock className="h-3 w-3 mr-1" />
                    {new Date(complaint.created_at).toLocaleDateString()}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard;
