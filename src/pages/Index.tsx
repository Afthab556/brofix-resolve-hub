import { useNavigate } from "react-router-dom";
import { Button } from "@/components/ui/button";
import { Shield, Users, MessageSquare, CheckCircle } from "lucide-react";

const Index = () => {
  const navigate = useNavigate();

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
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => navigate("/auth")}>Login</Button>
            <Button onClick={() => navigate("/admin/auth")}>Admin</Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-20 text-center">
        <div className="max-w-3xl mx-auto space-y-8">
          <div className="space-y-4">
            <h2 className="text-5xl font-bold tracking-tight">Smart Complaint Management</h2>
            <p className="text-xl text-muted-foreground">
              Submit, track, and resolve complaints with ease. Professional support at your fingertips.
            </p>
          </div>

          <div className="flex gap-4 justify-center">
            <Button size="lg" onClick={() => navigate("/auth")}>
              Get Started
            </Button>
            <Button size="lg" variant="outline" onClick={() => navigate("/admin/auth")}>
              Admin Access
            </Button>
          </div>

          <div className="grid md:grid-cols-3 gap-6 pt-16">
            <div className="p-6 rounded-lg bg-card shadow-card space-y-3">
              <Users className="h-10 w-10 text-primary mx-auto" />
              <h3 className="font-semibold">Easy Submission</h3>
              <p className="text-sm text-muted-foreground">Submit complaints quickly with our simple form</p>
            </div>
            <div className="p-6 rounded-lg bg-card shadow-card space-y-3">
              <MessageSquare className="h-10 w-10 text-primary mx-auto" />
              <h3 className="font-semibold">Real-time Updates</h3>
              <p className="text-sm text-muted-foreground">Stay informed with instant notifications</p>
            </div>
            <div className="p-6 rounded-lg bg-card shadow-card space-y-3">
              <CheckCircle className="h-10 w-10 text-primary mx-auto" />
              <h3 className="font-semibold">Quick Resolution</h3>
              <p className="text-sm text-muted-foreground">Get your issues resolved efficiently</p>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
};

export default Index;
