import { useListBots } from "@workspace/api-client-react";
import { Sidebar } from "@/components/layout/sidebar";
import { Header } from "@/components/layout/header";
import { BotCard } from "@/components/bots/bot-card";
import { Loader2 } from "lucide-react";

export function Dashboard() {
  const { data: bots, isLoading, isError } = useListBots({
    query: { refetchInterval: 5000 }
  });

  const totalCount = bots?.length || 0;
  const runningCount = bots?.filter(b => b.status === "running").length || 0;
  const stoppedCount = bots?.filter(b => b.status === "stopped").length || 0;
  const errorCount = bots?.filter(b => b.status === "error").length || 0;

  return (
    <div className="flex h-screen w-full bg-background dark text-foreground overflow-hidden font-sans">
      <Sidebar />
      <main className="flex-1 flex flex-col min-w-0">
        <Header 
          totalCount={totalCount} 
          runningCount={runningCount} 
          errorCount={errorCount} 
          stoppedCount={stoppedCount} 
        />
        
        <div className="flex-1 overflow-y-auto p-6 lg:p-8 bg-[#0a0d14] relative">
          {/* Subtle grid background pattern for tactical feel */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,#1a2332_1px,transparent_1px),linear-gradient(to_bottom,#1a2332_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />
          
          <div className="relative z-10 max-w-7xl mx-auto">
            {isLoading ? (
              <div className="flex items-center justify-center h-64 text-primary">
                <Loader2 className="w-8 h-8 animate-spin mr-3" />
                <span className="font-mono tracking-widest uppercase">Initializing Systems...</span>
              </div>
            ) : isError ? (
              <div className="bg-destructive/10 border border-destructive text-destructive p-4 rounded-md font-mono flex items-center">
                System Error: Failed to connect to bot control server. Retrying...
              </div>
            ) : bots?.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-64 border border-dashed border-border rounded-lg bg-card/50">
                <span className="text-muted-foreground font-mono tracking-widest mb-4">NO BOTS CONFIGURED</span>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
                {bots?.map(bot => (
                  <BotCard key={bot.id} bot={bot} />
                ))}
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}
