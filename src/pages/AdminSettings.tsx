import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Moon, Sun, Languages } from "lucide-react";
import { useTheme } from "next-themes";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useTranslation } from "react-i18next";
import { languages } from "@/i18n/config";

const AdminSettings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { t, i18n } = useTranslation();
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
      title: t("settings.profileUpdated"),
      description: t("settings.profileUpdated"),
    });
  };

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    toast({
      title: t("settings.profileUpdated"),
      description: `Language changed to ${languages.find(l => l.code === languageCode)?.name}`,
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
          <CardContent>
            <Tabs defaultValue="general" className="w-full">
              <TabsList className="grid w-full grid-cols-2">
                <TabsTrigger value="general">General</TabsTrigger>
                <TabsTrigger value="appearance">Appearance</TabsTrigger>
              </TabsList>
              
              <TabsContent value="general" className="space-y-6">
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
              </TabsContent>

              <TabsContent value="appearance" className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label>{t("settings.theme")}</Label>
                    <p className="text-sm text-muted-foreground mb-4">
                      Select the theme for the application
                    </p>
                  </div>
                  
                  <div className="grid grid-cols-3 gap-4">
                    <Button
                      variant={theme === "light" ? "default" : "outline"}
                      onClick={() => setTheme("light")}
                      className="flex flex-col items-center gap-2 h-auto py-4"
                    >
                      <Sun className="h-6 w-6" />
                      <span>{t("settings.lightMode")}</span>
                    </Button>
                    
                    <Button
                      variant={theme === "dark" ? "default" : "outline"}
                      onClick={() => setTheme("dark")}
                      className="flex flex-col items-center gap-2 h-auto py-4"
                    >
                      <Moon className="h-6 w-6" />
                      <span>{t("settings.darkMode")}</span>
                    </Button>
                    
                    <Button
                      variant={theme === "system" ? "default" : "outline"}
                      onClick={() => setTheme("system")}
                      className="flex flex-col items-center gap-2 h-auto py-4"
                    >
                      <div className="h-6 w-6 flex">
                        <Sun className="h-4 w-4" />
                        <Moon className="h-4 w-4" />
                      </div>
                      <span>System</span>
                    </Button>
                  </div>
                </div>

                <div className="space-y-4 pt-6 border-t">
                  <div>
                    <Label className="flex items-center gap-2">
                      <Languages className="h-4 w-4" />
                      {t("settings.language")}
                    </Label>
                    <p className="text-sm text-muted-foreground mb-4">
                      {t("settings.selectLanguage")}
                    </p>
                  </div>

                  <Select value={i18n.language} onValueChange={handleLanguageChange}>
                    <SelectTrigger>
                      <SelectValue placeholder={t("settings.selectLanguage")} />
                    </SelectTrigger>
                    <SelectContent>
                      {languages.map((lang) => (
                        <SelectItem key={lang.code} value={lang.code}>
                          {lang.nativeName} ({lang.name})
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default AdminSettings;
