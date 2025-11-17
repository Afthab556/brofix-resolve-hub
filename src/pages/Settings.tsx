import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Save, Moon, Sun, Upload, Languages } from "lucide-react";
import { useTheme } from "next-themes";
import { useTranslation } from "react-i18next";
import { languages } from "@/i18n/config";

const Settings = () => {
  const navigate = useNavigate();
  const { toast } = useToast();
  const { theme, setTheme } = useTheme();
  const { t, i18n } = useTranslation();
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [avatarUrl, setAvatarUrl] = useState("");

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }

      await fetchProfile(session.user.id);
    };

    checkAuth();
  }, [navigate]);

  const fetchProfile = async (userId: string) => {
    const { data, error } = await supabase
      .from("profiles")
      .select("*")
      .eq("id", userId)
      .single();

    if (data) {
      setName(data.name || "");
      setEmail(data.email || "");
      setPhone(data.phone || "");
      setAvatarUrl(data.avatar_url || "");
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type
    if (!file.type.startsWith("image/")) {
      toast({
        title: "Invalid file type",
        description: "Please upload an image file",
        variant: "destructive",
      });
      return;
    }

    // Validate file size (max 2MB)
    if (file.size > 2 * 1024 * 1024) {
      toast({
        title: "File too large",
        description: "Please upload an image smaller than 2MB",
        variant: "destructive",
      });
      return;
    }

    setUploading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const fileExt = file.name.split(".").pop();
    const filePath = `${session.user.id}/avatar.${fileExt}`;

    // Delete old avatar if exists
    if (avatarUrl) {
      const oldPath = avatarUrl.split("/").slice(-2).join("/");
      await supabase.storage.from("avatars").remove([oldPath]);
    }

    const { error: uploadError } = await supabase.storage
      .from("avatars")
      .upload(filePath, file, { upsert: true });

    if (uploadError) {
      toast({
        title: "Upload failed",
        description: uploadError.message,
        variant: "destructive",
      });
      setUploading(false);
      return;
    }

    const { data: { publicUrl } } = supabase.storage
      .from("avatars")
      .getPublicUrl(filePath);

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ avatar_url: publicUrl })
      .eq("id", session.user.id);

    if (updateError) {
      toast({
        title: "Update failed",
        description: updateError.message,
        variant: "destructive",
      });
    } else {
      setAvatarUrl(publicUrl);
      toast({
        title: t("settings.profileUpdated"),
        description: t("settings.profileUpdated"),
      });
    }

    setUploading(false);
  };

  const handleLanguageChange = (languageCode: string) => {
    i18n.changeLanguage(languageCode);
    toast({
      title: t("settings.profileUpdated"),
      description: `Language changed to ${languages.find(l => l.code === languageCode)?.name}`,
    });
  };

  const handleSave = async () => {
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();
    if (!session) return;

    const { error } = await supabase
      .from("profiles")
      .update({ name, phone })
      .eq("id", session.user.id);

    setLoading(false);

    if (error) {
      toast({
        title: t("settings.profileUpdated"),
        description: error.message,
        variant: "destructive",
      });
    } else {
      toast({
        title: t("settings.profileUpdated"),
        description: t("settings.profileUpdated"),
      });
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            {t("common.back")}
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-2xl">
        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle className="text-2xl">{t("settings.title")}</CardTitle>
            <CardDescription>
              {t("settings.profile")}
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="profile" className="w-full">
              <TabsList className="grid w-full grid-cols-3">
                <TabsTrigger value="profile">{t("settings.profile")}</TabsTrigger>
                <TabsTrigger value="appearance">{t("settings.appearance")}</TabsTrigger>
                <TabsTrigger value="about">{t("settings.about")}</TabsTrigger>
              </TabsList>

              <TabsContent value="profile" className="space-y-6">
                <div className="flex flex-col items-center gap-4">
                  <Avatar className="h-24 w-24">
                    <AvatarImage src={avatarUrl} alt={name} />
                    <AvatarFallback className="text-2xl">
                      {name.charAt(0).toUpperCase()}
                    </AvatarFallback>
                  </Avatar>
                  <div>
                    <input
                      type="file"
                      id="avatar-upload"
                      accept="image/*"
                      className="hidden"
                      onChange={handleAvatarUpload}
                      disabled={uploading}
                    />
                    <Label htmlFor="avatar-upload">
                      <Button
                        variant="outline"
                        disabled={uploading}
                        asChild
                      >
                        <span className="cursor-pointer">
                          <Upload className="mr-2 h-4 w-4" />
                          {uploading ? "Uploading..." : "Change Photo"}
                        </span>
                      </Button>
                    </Label>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="name">{t("settings.name")}</Label>
                  <Input
                    id="name"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder={t("settings.name")}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="email">{t("settings.email")}</Label>
                  <Input
                    id="email"
                    type="email"
                    value={email}
                    disabled
                    className="bg-muted"
                  />
                  <p className="text-xs text-muted-foreground">
                    Email cannot be changed
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="phone">{t("settings.phone")}</Label>
                  <Input
                    id="phone"
                    type="tel"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="+1234567890"
                  />
                </div>

                <Button onClick={handleSave} disabled={loading} className="w-full">
                  <Save className="mr-2 h-4 w-4" />
                  {loading ? t("common.loading") : t("settings.saveChanges")}
                </Button>
              </TabsContent>

              <TabsContent value="appearance" className="space-y-6">
                <div className="space-y-4">
                  <div>
                    <Label>{t("settings.theme")}</Label>
                    <p className="text-sm text-muted-foreground mb-4">
                      {t("settings.selectTheme")}
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
                      <span>{t("settings.system")}</span>
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

              <TabsContent value="about" className="space-y-4">
                <div className="space-y-4">
                  <div>
                    <Label className="text-lg font-semibold">{t('settings.about')}</Label>
                    <p className="text-sm text-muted-foreground mt-4 leading-relaxed">
                      {t('settings.aboutDesc')}
                    </p>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default Settings;
