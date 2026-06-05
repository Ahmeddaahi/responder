import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Circle, MessageSquare, Database, Settings } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";

export const GettingStartedWidget = () => {
  const navigate = useNavigate();
  const [tasks, setTasks] = useState([
    { id: "account", title: "Create Account", completed: true, icon: Settings, link: "/settings" },
    { id: "knowledge", title: "Upload Business Knowledge", completed: false, icon: Database, link: "/knowledge" },
    { id: "whatsapp", title: "Connect WhatsApp or Web Chat", completed: false, icon: MessageSquare, link: "/settings" },
  ]);
  const [isLoading, setIsLoading] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    const checkProgress = async () => {
      try {
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) return;

        // Check if user has uploaded knowledge
        const { count: kbCount } = await supabase
          .from("knowledge_base")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        // Check if user has connected an agent
        const { count: agentCount } = await supabase
          .from("agents")
          .select("*", { count: "exact", head: true })
          .eq("user_id", user.id);

        const updatedTasks = [...tasks];
        updatedTasks[1].completed = (kbCount || 0) > 0;
        updatedTasks[2].completed = (agentCount || 0) > 0;
        setTasks(updatedTasks);

        // Hide widget if all tasks are complete
        if (updatedTasks.every(t => t.completed)) {
          setIsVisible(false);
        }
      } catch (error) {
        console.error("Error checking progress:", error);
      } finally {
        setIsLoading(false);
      }
    };

    checkProgress();
  }, []);

  if (!isVisible || isLoading) return null;

  const completedCount = tasks.filter(t => t.completed).length;
  const progressPercentage = (completedCount / tasks.length) * 100;

  return (
    <Card className="mb-8 border-primary/20 bg-primary/5">
      <CardHeader className="pb-4">
        <CardTitle className="text-lg flex items-center justify-between">
          <span>Getting Started</span>
          <span className="text-sm font-normal text-muted-foreground">
            {completedCount} of {tasks.length} completed
          </span>
        </CardTitle>
        <div className="w-full bg-background rounded-full h-2 mt-2 border">
          <div
            className="bg-primary h-2 rounded-full transition-all duration-500 ease-in-out"
            style={{ width: `${progressPercentage}%` }}
          />
        </div>
      </CardHeader>
      <CardContent>
        <div className="grid gap-4 md:grid-cols-3">
          {tasks.map((task) => {
            const Icon = task.icon;
            return (
              <div
                key={task.id}
                className={`flex items-center p-4 rounded-xl border transition-colors ${
                  task.completed ? "bg-background/50 border-border" : "bg-background border-primary/20 shadow-sm"
                }`}
              >
                <div className="mr-4 flex-shrink-0">
                  {task.completed ? (
                    <CheckCircle2 className="w-6 h-6 text-emerald-500" />
                  ) : (
                    <Circle className="w-6 h-6 text-muted-foreground" />
                  )}
                </div>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${task.completed ? "text-muted-foreground line-through" : ""}`}>
                    {task.title}
                  </p>
                </div>
                {!task.completed && (
                  <Button
                    variant="ghost"
                    size="sm"
                    className="ml-2 flex-shrink-0"
                    onClick={() => navigate(task.link)}
                  >
                    Start
                  </Button>
                )}
              </div>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
