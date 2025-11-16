import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useToast } from "@/hooks/use-toast";
import { ArrowLeft, Send, Clock, User, Download, FileText } from "lucide-react";
import { useTranslation } from "react-i18next";

interface Complaint {
  id: string;
  title: string;
  description: string;
  status: string;
  priority: string;
  created_at: string;
  resolution_notes: string | null;
  user_id: string;
  attachments: string[] | null;
  complaint_categories: {
    name: string;
  } | null;
}

interface Message {
  id: string;
  message: string;
  sender_type: string;
  sender_id: string;
  created_at: string;
}

const AdminComplaintDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { toast } = useToast();
  const { t } = useTranslation();
  const [complaint, setComplaint] = useState<Complaint | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [newMessage, setNewMessage] = useState("");
  const [status, setStatus] = useState("");
  const [resolutionNotes, setResolutionNotes] = useState("");
  const [loading, setLoading] = useState(true);
  const [updating, setUpdating] = useState(false);

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
      navigate("/admin/dashboard");
    } else {
      setComplaint(data);
      setStatus(data.status);
      setResolutionNotes(data.resolution_notes || "");
    }
    setLoading(false);
  };

  const fetchMessages = async () => {
    const { data } = await supabase
      .from("complaint_messages")
      .select("*")
      .eq("complaint_id", id)
      .order("created_at", { ascending: true });

    setMessages(data || []);
  };

  const handleUpdateStatus = async () => {
    setUpdating(true);
    
    const updateData: any = { status };
    if (resolutionNotes) {
      updateData.resolution_notes = resolutionNotes;
    }
    if (status === "resolved" || status === "closed") {
      updateData.resolved_at = new Date().toISOString();
    }

    const { error } = await supabase
      .from("complaints")
      .update(updateData)
      .eq("id", id);

    setUpdating(false);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to update complaint",
        variant: "destructive",
      });
    } else {
      toast({
        title: "Success",
        description: "Complaint updated successfully",
      });
      await fetchComplaint();
    }
  };

  const sendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMessage.trim()) return;

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { error } = await supabase.from("complaint_messages").insert([{
      complaint_id: id!,
      sender_id: user.id,
      sender_type: "admin" as const,
      message: newMessage,
    }]);

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
        description: "Your message has been sent to the user",
      });
    }
  };

  const handleDownloadDocument = async (url: string) => {
    try {
      // Extract the path from the full URL
      const urlParts = url.split('/storage/v1/object/public/complaint-documents/');
      if (urlParts.length < 2) {
        throw new Error('Invalid file URL');
      }
      const filePath = urlParts[1];

      // Create a signed URL for download (valid for 60 seconds)
      const { data: signedUrlData, error: signedUrlError } = await supabase
        .storage
        .from('complaint-documents')
        .createSignedUrl(filePath, 60);

      if (signedUrlError) throw signedUrlError;

      // Open the signed URL in a new tab
      window.open(signedUrlData.signedUrl, '_blank');
      
      toast({
        title: "Download started",
        description: "Your document is being downloaded",
      });
    } catch (error) {
      console.error('Download error:', error);
      toast({
        title: "Download failed",
        description: "Failed to download the document. Please try again.",
        variant: "destructive",
      });
    }
  };

  if (loading || !complaint) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

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

      <main className="container mx-auto px-4 py-8 max-w-5xl">
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-6">
            <Card className="shadow-elevated">
              <CardHeader>
                <CardTitle className="text-2xl">{complaint.title}</CardTitle>
                <CardDescription>
                  {complaint.complaint_categories?.name || "Uncategorized"}
                </CardDescription>
                <div className="flex items-center text-sm text-muted-foreground gap-4 pt-2">
                  <div className="flex items-center gap-1">
                    <Clock className="h-4 w-4" />
                    {new Date(complaint.created_at).toLocaleDateString()}
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
                  
                  {complaint.attachments && complaint.attachments.length > 0 && (
                    <div>
                      <h3 className="font-semibold mb-2">Attached Documents</h3>
                      <div className="space-y-2">
                        {complaint.attachments.map((url, index) => {
                          const fileName = url.split("/").pop() || `document-${index + 1}`;
                          return (
                            <div
                              key={index}
                              className="flex items-center justify-between p-3 bg-muted rounded-lg"
                            >
                              <div className="flex items-center gap-2">
                                <FileText className="h-4 w-4 text-muted-foreground" />
                                <span className="text-sm truncate max-w-xs">
                                  Document {index + 1}
                                </span>
                              </div>
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleDownloadDocument(url)}
                              >
                                <Download className="mr-2 h-4 w-4" />
                                Download
                              </Button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

            <Card className="shadow-elevated">
              <CardHeader>
                <CardTitle>Messages</CardTitle>
                <CardDescription>Communication thread with the user</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4 mb-4 max-h-96 overflow-y-auto">
                  {messages.length === 0 ? (
                    <p className="text-center text-muted-foreground py-8">
                      No messages yet
                    </p>
                  ) : (
                    messages.map((message) => (
                      <div
                        key={message.id}
                        className={`flex gap-3 ${
                          message.sender_type === "admin" ? "flex-row-reverse" : "flex-row"
                        }`}
                      >
                        <div
                          className={`flex-1 rounded-lg p-3 ${
                            message.sender_type === "admin"
                              ? "bg-primary text-primary-foreground"
                              : "bg-secondary"
                          }`}
                        >
                          <div className="flex items-center gap-2 mb-1">
                            <User className="h-3 w-3" />
                            <span className="text-xs font-semibold">
                              {message.sender_type === "admin" ? "You (Admin)" : "User"}
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
                  />
                  <Button type="submit">
                    <Send className="h-4 w-4" />
                  </Button>
                </form>
              </CardContent>
            </Card>
          </div>

          <div className="space-y-6">
            <Card className="shadow-elevated">
              <CardHeader>
                <CardTitle>Update Complaint</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Status</label>
                  <Select value={status} onValueChange={setStatus}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="new">New</SelectItem>
                      <SelectItem value="in_progress">In Progress</SelectItem>
                      <SelectItem value="resolved">Resolved</SelectItem>
                      <SelectItem value="closed">Closed</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">Resolution Notes</label>
                  <Textarea
                    placeholder="Add resolution notes..."
                    value={resolutionNotes}
                    onChange={(e) => setResolutionNotes(e.target.value)}
                    rows={4}
                  />
                </div>

                <Button 
                  onClick={handleUpdateStatus} 
                  disabled={updating}
                  className="w-full"
                >
                  {updating ? "Updating..." : "Update Complaint"}
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </main>
    </div>
  );
};

export default AdminComplaintDetail;
