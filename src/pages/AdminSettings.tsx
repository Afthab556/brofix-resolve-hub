import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save } from "lucide-react";

const AdminSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const [loading, setLoading] = useState(false);
  const [companyName, setCompanyName] = useState("");
  const [supportEmail, setSupportEmail] = useState("");
  const [supportPhone, setSupportPhone] = useState("");

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
        navigate("/admin/auth");
        return;
      }

      await fetchSettings();
    };

    checkAuth();
  }, [navigate]);

  const fetchSettings = async () => {
    const { data } = await supabase
      .from("settings")
      .select("*")
      .in("key", ["company_name", "support_email", "support_phone"]);

    if (data) {
      data.forEach((setting) => {
        const value = typeof setting.value === "string" 
          ? JSON.parse(setting.value) 
          : setting.value;
        
        if (setting.key === "company_name") setCompanyName(value);
        if (setting.key === "support_email") setSupportEmail(value);
        if (setting.key === "support_phone") setSupportPhone(value);
      });
    }
  };

  const handleSave = async () => {
    setLoading(true);

    const updates = [
      { key: "company_name", value: JSON.stringify(companyName) },
      { key: "support_email", value: JSON.stringify(supportEmail) },
      { key: "support_phone", value: JSON.stringify(supportPhone) },
    ];

    for (const update of updates) {
      await supabase
        .from("settings")
        .update({ value: update.value })
        .eq("key", update.key);
    }

    setLoading(false);
    
    toast({
      title: "Settings saved",
      description: "Your settings have been updated successfully",
    });
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/admin/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle className="text-2xl">Admin Settings</CardTitle>
            <CardDescription>
              Manage your system configuration and preferences
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="space-y-2">
              <Label htmlFor="companyName">Company Name</Label>
              <Input
                id="companyName"
                value={companyName}
                onChange={(e) => setCompanyName(e.target.value)}
                placeholder="BroFix"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supportEmail">Support Email</Label>
              <Input
                id="supportEmail"
                type="email"
                value={supportEmail}
                onChange={(e) => setSupportEmail(e.target.value)}
                placeholder="support@brofix.com"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="supportPhone">Support Phone</Label>
              <Input
                id="supportPhone"
                type="tel"
                value={supportPhone}
                onChange={(e) => setSupportPhone(e.target.value)}
                placeholder="+1234567890"
              />
            </div>

            <Button onClick={handleSave} disabled={loading} className="w-full">
              <Save className="mr-2 h-4 w-4" />
              {loading ? "Saving..." : "Save Settings"}
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminSettings;
