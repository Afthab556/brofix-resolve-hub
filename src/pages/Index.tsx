import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Users, MessageSquare, CheckCircle, Settings, Moon, Sun } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useTheme } from "next-themes";

const Index = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const { theme, setTheme } = useTheme();

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-secondary/20 to-primary/5">
      <header className="border-b bg-card/80 backdrop-blur-sm">
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-accent flex items-center justify-center">
              <Shield className="h-4 w-4 text-white" />
            </div>
            <h1 className="text-xl font-bold text-primary">BroFix</h1>
          </div>
          <div className="flex gap-2 items-center">
            <Button
              variant="ghost"
              size="icon"
              onClick={() => setTheme(theme === "dark" ? "light" : "dark")}
            >
              {theme === "dark" ? (
                <Sun className="h-5 w-5" />
              ) : (
                <Moon className="h-5 w-5" />
              )}
            </Button>
            <Button variant="ghost" size="icon" onClick={() => navigate("/settings")}>
              <Settings className="h-5 w-5" />
            </Button>
            <Button variant="outline" onClick={() => navigate("/auth")}>{t('home.login')}</Button>
            <Button onClick={() => navigate("/admin/auth")}>{t('home.admin')}</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="space-y-4">
            <h2 className="text-5xl font-bold tracking-tight">{t('home.title')}</h2>
            <p className="text-xl text-muted-foreground">
              {t('home.subtitle')}
            </p>
          </div>

          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/auth")}>
              {t('home.getStarted')}
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/admin/auth")}>
              {t('home.adminAccess')}
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6 pt-16">
            <div className="p-6 rounded-lg bg-card shadow-card space-y-3">
              <Users className="h-10 w-10 text-primary mx-auto" />
              <h3 className="font-semibold">{t('home.easySubmission')}</h3>
              <p className="text-sm text-muted-foreground">{t('home.easySubmissionDesc')}</p>
            </div>
            <div className="p-6 rounded-lg bg-card shadow-card space-y-3">
              <MessageSquare className="h-10 w-10 text-primary mx-auto" />
              <h3 className="font-semibold">{t('home.realTimeUpdates')}</h3>
              <p className="text-sm text-muted-foreground">{t('home.realTimeUpdatesDesc')}</p>
            </div>
            <div className="p-6 rounded-lg bg-card shadow-card space-y-3">
              <CheckCircle className="h-10 w-10 text-primary mx-auto" />
              <h3 className="font-semibold">{t('home.quickResolution')}</h3>
              <p className="text-sm text-muted-foreground">{t('home.quickResolutionDesc')}</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
