import { useState } from "react";
import {
  Play, Square, Loader2, AlertCircle, Pencil, Check, X,
  Mail, Server, FolderOpen, KeyRound, Eye, EyeOff, ShieldAlert, SendHorizonal, Trash2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Bot, useLaunchBot, useStopBot, useUpdateBot, useDeleteBot, getListBotsQueryKey
} from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

interface BotCardProps {
  bot: Bot;
}

export function BotCard({ bot }: BotCardProps) {
  const queryClient = useQueryClient();
  const { toast } = useToast();

  const [editing, setEditing] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [pendingCode, setPendingCode] = useState("");
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [draftEmail, setDraftEmail] = useState(bot.gfnEmail ?? "");
  const [draftPassword, setDraftPassword] = useState(bot.gfnPassword ?? "");
  const [draftServer, setDraftServer] = useState(bot.serverName ?? "Objective First");
  const [draftProfile, setDraftProfile] = useState(bot.browserProfilePath ?? "");

  const launchBot = useLaunchBot();
  const stopBot = useStopBot();
  const updateBot = useUpdateBot();
  const deleteBot = useDeleteBot();

  const invalidate = () =>
    queryClient.invalidateQueries({ queryKey: getListBotsQueryKey() });

  const handleLaunch = () => {
    launchBot.mutate({ id: bot.id }, {
      onSuccess: () => {
        toast({ title: "Command Sent", description: `Launching ${bot.name}...` });
        invalidate();
      },
      onError: () => {
        toast({ title: "Error", description: `Failed to launch ${bot.name}.`, variant: "destructive" });
      }
    });
  };

  const handleStop = () => {
    stopBot.mutate({ id: bot.id }, {
      onSuccess: () => {
        toast({ title: "Command Sent", description: `Stopping ${bot.name}...` });
        invalidate();
      },
      onError: () => {
        toast({ title: "Error", description: `Failed to stop ${bot.name}.`, variant: "destructive" });
      }
    });
  };

  const handleSubmitAuthCode = () => {
    if (!pendingCode.trim()) return;
    updateBot.mutate(
      { id: bot.id, data: { authCode: pendingCode.trim() } },
      {
        onSuccess: () => {
          toast({ title: "Code Sent", description: `Auth code submitted for ${bot.name}.` });
          setPendingCode("");
          invalidate();
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to submit auth code.", variant: "destructive" });
        }
      }
    );
  };

  const handleSave = () => {
    updateBot.mutate(
      {
        id: bot.id,
        data: {
          gfnEmail: draftEmail || null,
          gfnPassword: draftPassword || null,
          serverName: draftServer || "Objective First",
          browserProfilePath: draftProfile || null,
        }
      },
      {
        onSuccess: () => {
          toast({ title: "Saved", description: `${bot.name} config updated.` });
          setEditing(false);
          invalidate();
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to save config.", variant: "destructive" });
        }
      }
    );
  };

  const handleDelete = () => {
    if (!confirmDelete) {
      setConfirmDelete(true);
      setTimeout(() => setConfirmDelete(false), 3000);
      return;
    }
    deleteBot.mutate({ id: bot.id }, {
      onSuccess: () => {
        toast({ title: "Bot Deleted", description: `${bot.name} has been removed.` });
        queryClient.invalidateQueries({ queryKey: getListBotsQueryKey() });
      },
      onError: () => {
        toast({ title: "Error", description: "Failed to delete bot.", variant: "destructive" });
        setConfirmDelete(false);
      }
    });
  };

  const handleCancelEdit = () => {
    setDraftEmail(bot.gfnEmail ?? "");
    setDraftPassword(bot.gfnPassword ?? "");
    setDraftServer(bot.serverName ?? "Objective First");
    setDraftProfile(bot.browserProfilePath ?? "");
    setEditing(false);
  };

  const isRunning = bot.status === "running";
  const isLaunching = bot.status === "launching";
  const isStopped = bot.status === "stopped";
  const isError = bot.status === "error";
  const isAwaitingAuth = bot.status === "awaiting_auth";

  // How long ago was auth requested?
  const authAge = bot.authCodeRequestedAt
    ? Math.round((Date.now() - new Date(bot.authCodeRequestedAt).getTime()) / 1000)
    : null;

  return (
    <div className={`border rounded-lg p-4 flex flex-col relative overflow-hidden group transition-colors ${
      isAwaitingAuth
        ? "bg-amber-950/20 border-amber-500/50 hover:border-amber-500/70"
        : "bg-card border-border hover:border-border/80"
    }`}>

      {/* Auth code banner — full-width alert at top when awaiting */}
      {isAwaitingAuth && (
        <div className="mb-3 -mx-4 -mt-4 px-4 py-2.5 bg-amber-500/10 border-b border-amber-500/40 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-400 shrink-0 animate-pulse" />
          <span className="text-xs font-mono font-bold text-amber-400 uppercase tracking-wider">
            Auth Code Required
          </span>
          {authAge !== null && (
            <span className="ml-auto text-xs font-mono text-amber-500/60">
              {authAge}s ago
            </span>
          )}
        </div>
      )}

      {/* Header: name + launch/stop */}
      <div className="flex justify-between items-start mb-3">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <h3 className="font-bold text-foreground text-base leading-tight">{bot.name}</h3>
            <span className="text-xs font-mono text-muted-foreground bg-muted px-1.5 py-0.5 rounded">
              IDX:{bot.accountIndex}
            </span>
          </div>
          <div className="flex items-center gap-1.5">
            {isRunning && (
              <span className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_rgba(34,197,94,0.6)] animate-pulse" />
            )}
            {isLaunching && <Loader2 className="w-3 h-3 text-yellow-500 animate-spin" />}
            {isStopped && <span className="w-2 h-2 rounded-full bg-muted-foreground/50" />}
            {isError && <AlertCircle className="w-3 h-3 text-destructive" />}
            {isAwaitingAuth && <ShieldAlert className="w-3 h-3 text-amber-400" />}
            <span className={`text-xs font-mono font-medium uppercase tracking-wider ${
              isRunning ? "text-primary" :
              isLaunching ? "text-yellow-500" :
              isAwaitingAuth ? "text-amber-400" :
              isError ? "text-destructive" : "text-muted-foreground"
            }`}>
              {isAwaitingAuth ? "AWAITING AUTH" : bot.status}
            </span>
          </div>
        </div>

        <div className="flex gap-1.5">
          <Button
            size="icon"
            variant="outline"
            className="w-8 h-8 bg-background hover:bg-primary/20 hover:text-primary hover:border-primary/50 transition-colors"
            onClick={handleLaunch}
            disabled={isRunning || isLaunching || isAwaitingAuth || launchBot.isPending}
            title="Launch Bot"
          >
            {launchBot.isPending
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Play className="w-3.5 h-3.5 fill-current" />
            }
          </Button>
          <Button
            size="icon"
            variant="outline"
            className="w-8 h-8 bg-background hover:bg-destructive/20 hover:text-destructive hover:border-destructive/50 transition-colors"
            onClick={handleStop}
            disabled={isStopped || stopBot.isPending}
            title="Stop Bot"
          >
            {stopBot.isPending
              ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
              : <Square className="w-3.5 h-3.5 fill-current" />
            }
          </Button>
        </div>
      </div>

      {/* Auth code input — only shown when awaiting */}
      {isAwaitingAuth && (
        <div className="mb-3 flex gap-2">
          <Input
            className="h-8 font-mono text-sm bg-background border-amber-500/50 focus-visible:ring-amber-500/30 tracking-widest placeholder:tracking-normal"
            placeholder="Enter 6-digit code..."
            value={pendingCode}
            onChange={e => setPendingCode(e.target.value.replace(/\D/g, "").slice(0, 6))}
            onKeyDown={e => e.key === "Enter" && handleSubmitAuthCode()}
            maxLength={6}
            autoFocus
          />
          <Button
            className="h-8 px-3 bg-amber-500 hover:bg-amber-400 text-black font-mono font-bold shrink-0"
            onClick={handleSubmitAuthCode}
            disabled={pendingCode.length < 4 || updateBot.isPending}
          >
            {updateBot.isPending
              ? <Loader2 className="w-4 h-4 animate-spin" />
              : <SendHorizonal className="w-4 h-4" />
            }
          </Button>
        </div>
      )}

      {/* Config fields */}
      {!isAwaitingAuth && (
        <div className="flex-1 space-y-1.5 mb-3">
          {editing ? (
            <>
              <div className="flex items-center gap-1.5">
                <Mail className="w-3 h-3 text-muted-foreground shrink-0" />
                <Input
                  className="h-6 text-xs font-mono bg-background border-border/70 px-2 py-0"
                  placeholder="gfn-account@email.com"
                  value={draftEmail}
                  onChange={e => setDraftEmail(e.target.value)}
                  autoFocus
                />
              </div>
              <div className="flex items-center gap-1.5">
                <KeyRound className="w-3 h-3 text-muted-foreground shrink-0" />
                <div className="flex-1 relative">
                  <Input
                    className="h-6 text-xs font-mono bg-background border-border/70 px-2 py-0 pr-7"
                    placeholder="password"
                    type={showPassword ? "text" : "password"}
                    value={draftPassword}
                    onChange={e => setDraftPassword(e.target.value)}
                  />
                  <button
                    type="button"
                    className="absolute right-1.5 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                    onClick={() => setShowPassword(v => !v)}
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  </button>
                </div>
              </div>
              <div className="flex items-center gap-1.5">
                <Server className="w-3 h-3 text-muted-foreground shrink-0" />
                <Input
                  className="h-6 text-xs font-mono bg-background border-border/70 px-2 py-0"
                  placeholder="Objective First"
                  value={draftServer}
                  onChange={e => setDraftServer(e.target.value)}
                />
              </div>
              <div className="flex items-center gap-1.5">
                <FolderOpen className="w-3 h-3 text-muted-foreground shrink-0" />
                <Input
                  className="h-6 text-xs font-mono bg-background border-border/70 px-2 py-0"
                  placeholder="C:\EdgeProfiles\Bot01"
                  value={draftProfile}
                  onChange={e => setDraftProfile(e.target.value)}
                />
              </div>
            </>
          ) : (
            <>
              <div className="flex items-center gap-1.5">
                <Mail className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className={`text-xs font-mono truncate ${bot.gfnEmail ? "text-foreground/80" : "text-muted-foreground/50 italic"}`}>
                  {bot.gfnEmail || "no account set"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <KeyRound className="w-3 h-3 text-muted-foreground shrink-0" />
                {bot.gfnPassword ? (
                  <span className="text-xs font-mono text-foreground/80 tracking-widest">••••••••</span>
                ) : (
                  <span className="text-xs font-mono text-amber-500/70 italic">no password set</span>
                )}
              </div>
              <div className="flex items-center gap-1.5">
                <Server className="w-3 h-3 text-muted-foreground shrink-0" />
                <span className="text-xs font-mono text-foreground/80 truncate">
                  {bot.serverName || "Objective First"}
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <FolderOpen className="w-3 h-3 text-muted-foreground shrink-0" />
                {bot.browserProfilePath ? (
                  <span className="text-xs font-mono text-foreground/80 truncate" title={bot.browserProfilePath}>
                    {bot.browserProfilePath}
                  </span>
                ) : (
                  <span className="text-xs font-mono text-amber-500/70 italic">no session saved</span>
                )}
              </div>
            </>
          )}
        </div>
      )}

      {/* Footer: last activity + edit/save */}
      <div className="pt-2.5 border-t border-border/50 flex justify-between items-center">
        <span className="text-xs font-mono text-muted-foreground/60">
          {bot.lastActivity ? new Date(bot.lastActivity).toLocaleTimeString() : "NEVER"}
        </span>

        {!isAwaitingAuth && (
          <div className="flex gap-1">
            {editing ? (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-6 h-6 text-primary hover:bg-primary/20"
                  onClick={handleSave}
                  disabled={updateBot.isPending}
                  title="Save"
                >
                  {updateBot.isPending
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <Check className="w-3 h-3" />
                  }
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-6 h-6 text-muted-foreground hover:bg-muted"
                  onClick={handleCancelEdit}
                  title="Cancel"
                >
                  <X className="w-3 h-3" />
                </Button>
              </>
            ) : (
              <>
                <Button
                  size="icon"
                  variant="ghost"
                  className="w-6 h-6 text-muted-foreground/50 hover:text-foreground hover:bg-muted opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={() => setEditing(true)}
                  title="Edit config"
                >
                  <Pencil className="w-3 h-3" />
                </Button>
                <Button
                  size="icon"
                  variant="ghost"
                  className={`w-6 h-6 opacity-0 group-hover:opacity-100 transition-all ${
                    confirmDelete
                      ? "text-destructive bg-destructive/20 opacity-100 animate-pulse"
                      : "text-muted-foreground/50 hover:text-destructive hover:bg-destructive/10"
                  }`}
                  onClick={handleDelete}
                  disabled={deleteBot.isPending}
                  title={confirmDelete ? "Click again to confirm delete" : "Delete bot"}
                >
                  {deleteBot.isPending
                    ? <Loader2 className="w-3 h-3 animate-spin" />
                    : <Trash2 className="w-3 h-3" />
                  }
                </Button>
              </>
            )}
          </div>
        )}
      </div>

      {isError && bot.errorMessage && (
        <div className="mt-2 text-xs font-mono text-destructive truncate" title={bot.errorMessage}>
          {bot.errorMessage}
        </div>
      )}

      {/* Decorative corners */}
      <div className="absolute top-0 left-0 w-2 h-2 border-t-2 border-l-2 border-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
      <div className="absolute bottom-0 right-0 w-2 h-2 border-b-2 border-r-2 border-primary/20 opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}
