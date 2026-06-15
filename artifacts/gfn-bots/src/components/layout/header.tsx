import { Play, Square, AlertCircle, CheckCircle2, Loader2, Power, Download, ChevronDown } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useLaunchAllBots, useStopAllBots, getListBotsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";
import { CreateBotDialog } from "@/components/bots/create-bot-dialog";

interface HeaderProps {
  runningCount: number;
  totalCount: number;
  errorCount: number;
  stoppedCount: number;
}

export function Header({ runningCount, totalCount, errorCount, stoppedCount }: HeaderProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();
  
  const launchAll = useLaunchAllBots();
  const stopAll = useStopAllBots();

  const handleLaunchAll = () => {
    launchAll.mutate(undefined, {
      onSuccess: () => {
        toast({ title: "Command Sent", description: "Launching all bots..." });
        queryClient.invalidateQueries({ queryKey: getListBotsQueryKey() });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to launch bots.", variant: "destructive" });
      }
    });
  };

  const handleStopAll = () => {
    stopAll.mutate(undefined, {
      onSuccess: () => {
        toast({ title: "Command Sent", description: "Stopping all bots..." });
        queryClient.invalidateQueries({ queryKey: getListBotsQueryKey() });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to stop bots.", variant: "destructive" });
      }
    });
  };

  return (
    <div className="flex flex-col border-b border-border bg-card">
      <div className="flex items-center justify-between px-6 py-4">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-foreground uppercase flex items-center">
            <Power className="w-6 h-6 mr-3 text-muted-foreground" />
            GFN Bot Seeder
          </h1>
          <p className="text-sm text-muted-foreground mt-1 font-mono">
            OPERATIONAL STATUS: {runningCount} RUNNING / {totalCount} TOTAL
          </p>
        </div>
        
        <div className="flex gap-3 items-center">
          <CreateBotDialog />
          {/* Launcher download dropdown */}
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button
                variant="outline"
                className="font-mono font-bold text-xs tracking-widest uppercase border-border/60 text-muted-foreground hover:text-foreground gap-2"
              >
                <Download className="w-3.5 h-3.5" />
                Download Launcher
                <ChevronDown className="w-3.5 h-3.5 opacity-60" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-72 font-mono">
              <DropdownMenuLabel className="text-xs uppercase tracking-widest text-muted-foreground">
                Windows Launcher Files
              </DropdownMenuLabel>
              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <a
                  href="/api/launcher/download-vbs"
                  download="start-background.vbs"
                  className="flex flex-col items-start gap-0.5 cursor-pointer py-2.5"
                >
                  <span className="font-bold text-primary flex items-center gap-2">
                    <Download className="w-3.5 h-3.5" />
                    start-background.vbs
                    <span className="text-[10px] bg-primary/20 text-primary px-1.5 py-0.5 rounded uppercase tracking-wide">Recommended</span>
                  </span>
                  <span className="text-xs text-muted-foreground pl-5">
                    Silent — no console window. Bots run in background while you play.
                  </span>
                </a>
              </DropdownMenuItem>

              <DropdownMenuItem asChild>
                <a
                  href="/api/launcher/download-bat"
                  download="bot-launcher.bat"
                  className="flex flex-col items-start gap-0.5 cursor-pointer py-2.5"
                >
                  <span className="font-bold flex items-center gap-2">
                    <Download className="w-3.5 h-3.5" />
                    bot-launcher.bat
                  </span>
                  <span className="text-xs text-muted-foreground pl-5">
                    Debug mode — shows a console window with live logs.
                  </span>
                </a>
              </DropdownMenuItem>

              <DropdownMenuSeparator />

              <DropdownMenuItem asChild>
                <a
                  href="/api/launcher/download"
                  download="gfn-launcher.js"
                  className="flex flex-col items-start gap-0.5 cursor-pointer py-2"
                >
                  <span className="text-muted-foreground flex items-center gap-2 text-xs">
                    <Download className="w-3 h-3" />
                    gfn-launcher.js
                  </span>
                  <span className="text-xs text-muted-foreground pl-5">
                    Required — download alongside the .vbs or .bat file.
                  </span>
                </a>
              </DropdownMenuItem>

              <DropdownMenuSeparator />
              <div className="px-2 py-1.5 text-[10px] text-muted-foreground leading-relaxed">
                Place all files in the same folder.<br />
                First run installs Node.js deps automatically.<br />
                Logs saved to <span className="text-foreground">launcher.log</span> in that folder.
              </div>
            </DropdownMenuContent>
          </DropdownMenu>

          <Button 
            variant="default" 
            size="lg" 
            className="font-bold tracking-widest px-8 shadow-lg transition-transform active:scale-95"
            onClick={handleLaunchAll}
            disabled={launchAll.isPending}
          >
            {launchAll.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Play className="mr-2 h-5 w-5 fill-current" />}
            LAUNCH ALL
          </Button>
          <Button 
            variant="destructive" 
            size="lg" 
            className="font-bold tracking-widest px-8 shadow-lg transition-transform active:scale-95"
            onClick={handleStopAll}
            disabled={stopAll.isPending}
          >
            {stopAll.isPending ? <Loader2 className="mr-2 h-5 w-5 animate-spin" /> : <Square className="mr-2 h-5 w-5 fill-current" />}
            STOP ALL
          </Button>
        </div>
      </div>
      
      {/* Tactical Status Bar */}
      <div className="flex items-center px-6 py-2 bg-black/20 text-xs font-mono border-t border-border/50">
        <div className="flex items-center mr-8">
          <CheckCircle2 className="w-4 h-4 mr-2 text-primary" />
          <span className="text-muted-foreground mr-2">RUNNING:</span>
          <span className="text-foreground font-bold">{runningCount}</span>
        </div>
        <div className="flex items-center mr-8">
          <Square className="w-4 h-4 mr-2 text-muted-foreground" />
          <span className="text-muted-foreground mr-2">STOPPED:</span>
          <span className="text-foreground font-bold">{stoppedCount}</span>
        </div>
        {errorCount > 0 && (
          <div className="flex items-center text-destructive">
            <AlertCircle className="w-4 h-4 mr-2" />
            <span className="mr-2">ERRORS:</span>
            <span className="font-bold">{errorCount}</span>
          </div>
        )}
        <div className="ml-auto text-muted-foreground flex items-center">
          <span className="inline-block w-2 h-2 rounded-full bg-primary animate-pulse mr-2"></span>
          SYSTEM ONLINE
        </div>
      </div>
    </div>
  );
}
