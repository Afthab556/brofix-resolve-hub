import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send, Clock, User } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Complaint {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  updated_at: string;
  resolution_notes: string | null;
  complaint_categories: {
    name: string;
  } | null;
}

interface Message {
  id: string;
  message: string;
  sender_type: string;
  created_at: string;
  profiles: {
    name: string;
  } | null;
}

const ComplaintDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);

  useEffect(() => {
    const checkAuth = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) {
        navigate("/auth");
        return;
      }
      await fetchComplaint();
      await fetchMessages();
    };

    checkAuth();
  }, [id, navigate]);

  const fetchComplaint = async () => {
    const { data, error } = await supabase
      .from("complaints")
      .select(`
        *,
        complaint_categories (
          name
        )
      `)
      .eq("id", id)
      .single();

    if (error) {
      toast({
        title: "Error",
        description: "Failed to fetch complaint details",
        variant: "destructive",
      });
      navigate("/dashboard");
    } else {
      setComplaint(data);
    }
    setLoading(false);
  };

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("complaint_messages")
      .select("*")
      .eq("complaint_id", id)
      .order("created_at", { ascending: true });

    if (data) {
      // Fetch sender names separately
      const messagesWithNames = await Promise.all(
        data.map(async (msg) => {
          const { data: profile } = await supabase
            .from("profiles")
            .select("name")
            .eq("id", msg.sender_id)
            .single();
          
          return {
            ...msg,
            profiles: profile || { name: "Unknown" },
          };
        })
      );
      setMessages(messagesWithNames as any);
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    setSending(true);
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      navigate("/auth");
      return;
    }

    const { error } = await supabase.from("complaint_messages").insert([{
      complaint_id: id!,
      sender_id: user.id,
      sender_type: "user" as const,
      message: newMessage,
    }]);

    setSending(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to send message",
        variant: "destructive",
      });
    } else {
      setNewMessage("");
      await fetchMessages();
      toast({
        title: "Message sent",
        description: "Your message has been sent successfully",
      });
    }
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

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  if (!complaint) {
    return null;
  }

  return (
    <div className="min-h-screen bg-background">
      <header className="border-b bg-card shadow-card">
        <div className="container mx-auto px-4 py-4">
          <Button variant="ghost" onClick={() => navigate("/dashboard")}>
            <ArrowLeft className="mr-2 h-4 w-4" />
            Back to Dashboard
          </Button>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8 max-w-4xl">
        <Card className="shadow-elevated mb-6">
          <CardHeader>
            <div className="flex justify-between items-start mb-2">
              <div className="space-y-1 flex-1">
                <CardTitle className="text-2xl">{complaint.title}</CardTitle>
                <CardDescription>
                  {complaint.complaint_categories?.name || "Uncategorized"}
                </CardDescription>
              </div>
              <Badge className={getStatusColor(complaint.status)}>
                {formatStatus(complaint.status)}
              </Badge>
            </div>
            <div className="flex items-center text-sm text-muted-foreground gap-4 pt-2">
              <div className="flex items-center gap-1">
                <Clock className="h-4 w-4" />
                Created: {new Date(complaint.created_at).toLocaleDateString()}
              </div>
              <Badge variant="outline">{complaint.priority}</Badge>
            </div>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold mb-2">Description</h3>
                <p className="text-muted-foreground">{complaint.description}</p>
              </div>
              {complaint.resolution_notes && (
                <div className="bg-success/10 border border-success/20 rounded-lg p-4">
                  <h3 className="font-semibold mb-2 text-success">Resolution Notes</h3>
                  <p className="text-sm">{complaint.resolution_notes}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        <Card className="shadow-elevated">
          <CardHeader>
            <CardTitle>Messages</CardTitle>
            <CardDescription>
              Communicate with our support team about this complaint
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
              {messages.length === 0 ? (
                <p className="text-center text-muted-foreground py-8">
                  No messages yet. Start a conversation!
                </p>
              ) : (
                messages.map((message) => (
                  <div
                    key={message.id}
                    className={`flex gap-3 ${
                      message.sender_type === "admin" ? "flex-row" : "flex-row-reverse"
                    }`}
                  >
                    <div
                      className={`flex-1 rounded-lg p-3 ${
                        message.sender_type === "admin"
                          ? "bg-secondary"
                          : "bg-primary text-primary-foreground"
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-1">
                        <User className="h-3 w-3" />
                        <span className="text-xs font-semibold">
                          {message.sender_type === "admin"
                            ? "Support Team"
                            : message.profiles?.name || "You"}
                        </span>
                      </div>
                      <p className="text-sm">{message.message}</p>
                      <p className="text-xs opacity-70 mt-1">
                        {new Date(message.created_at).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            <form onSubmit={sendMessage} className="flex gap-2">
              <Input
                placeholder="Type your message..."
                value={newMessage}
                onChange={(e) => setNewMessage(e.target.value)}
                disabled={sending}
              />
              <Button type="submit" disabled={sending}>
                <Send className="h-4 w-4" />
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

export default ComplaintDetail;
