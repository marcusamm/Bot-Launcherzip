import { useState } from "react";
import { Plus, Loader2, Mail, KeyRound, Server, FolderOpen, Hash, Eye, EyeOff, Bot } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { useCreateBot, getListBotsQueryKey } from "@workspace/api-client-react";
import { useQueryClient } from "@tanstack/react-query";
import { useToast } from "@/hooks/use-toast";

const DEFAULTS = {
  name: "",
  accountIndex: "",
  gfnEmail: "",
  gfnPassword: "",
  serverName: "Objective First",
  browserProfilePath: "",
};

export function CreateBotDialog() {
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState(DEFAULTS);
  const [showPassword, setShowPassword] = useState(false);

  const queryClient = useQueryClient();
  const { toast } = useToast();
  const createBot = useCreateBot();

  const set = (key: keyof typeof DEFAULTS) => (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm((f) => ({ ...f, [key]: e.target.value }));

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const idx = Number(form.accountIndex);
    if (!form.name.trim()) {
      toast({ title: "Validation Error", description: "Bot name is required.", variant: "destructive" });
      return;
    }
    if (!Number.isInteger(idx) || idx < 0) {
      toast({ title: "Validation Error", description: "Account index must be a whole number ≥ 0.", variant: "destructive" });
      return;
    }

    createBot.mutate(
      {
        data: {
          name: form.name.trim(),
          accountIndex: idx,
          gfnEmail: form.gfnEmail.trim() || null,
          gfnPassword: form.gfnPassword || null,
          serverName: form.serverName.trim() || "Objective First",
          browserProfilePath: form.browserProfilePath.trim() || null,
        },
      },
      {
        onSuccess: (bot) => {
          toast({ title: "Bot Created", description: `${bot.name} added successfully.` });
          queryClient.invalidateQueries({ queryKey: getListBotsQueryKey() });
          setForm(DEFAULTS);
          setOpen(false);
        },
        onError: () => {
          toast({ title: "Error", description: "Failed to create bot.", variant: "destructive" });
        },
      }
    );
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          className="font-mono font-bold text-xs tracking-widest uppercase border-border/60 text-primary border-primary/40 hover:bg-primary/10 hover:border-primary/60 gap-2"
        >
          <Plus className="w-3.5 h-3.5" />
          Add Bot
        </Button>
      </DialogTrigger>

      <DialogContent className="bg-card border-border text-foreground sm:max-w-md font-mono">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-sm tracking-widest uppercase text-foreground">
            <Bot className="w-4 h-4 text-primary" />
            New Bot Configuration
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="mt-2 space-y-3">
          {/* Name + Index row */}
          <div className="flex gap-2">
            <div className="flex-1">
              <label className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 block">
                Bot Name <span className="text-destructive">*</span>
              </label>
              <Input
                className="h-8 text-xs bg-background border-border/70"
                placeholder="Bot-01"
                value={form.name}
                onChange={set("name")}
                autoFocus
                required
              />
            </div>
            <div className="w-24">
              <label className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 block">
                Acct Index <span className="text-destructive">*</span>
              </label>
              <div className="relative">
                <Hash className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
                <Input
                  className="h-8 text-xs bg-background border-border/70 pl-6"
                  placeholder="0"
                  type="number"
                  min={0}
                  step={1}
                  value={form.accountIndex}
                  onChange={set("accountIndex")}
                  required
                />
              </div>
            </div>
          </div>

          {/* Email */}
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 block">
              GFN Email
            </label>
            <div className="relative">
              <Mail className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <Input
                className="h-8 text-xs bg-background border-border/70 pl-6"
                placeholder="account@email.com"
                type="email"
                value={form.gfnEmail}
                onChange={set("gfnEmail")}
              />
            </div>
          </div>

          {/* Password */}
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 block">
              GFN Password
            </label>
            <div className="relative">
              <KeyRound className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <Input
                className="h-8 text-xs bg-background border-border/70 pl-6 pr-8"
                placeholder="password"
                type={showPassword ? "text" : "password"}
                value={form.gfnPassword}
                onChange={set("gfnPassword")}
              />
              <button
                type="button"
                className="absolute right-2 top-1/2 -translate-y-1/2 text-muted-foreground hover:text-foreground"
                onClick={() => setShowPassword((v) => !v)}
                tabIndex={-1}
              >
                {showPassword ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
              </button>
            </div>
          </div>

          {/* Server */}
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 block">
              Server Name
            </label>
            <div className="relative">
              <Server className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <Input
                className="h-8 text-xs bg-background border-border/70 pl-6"
                placeholder="Objective First"
                value={form.serverName}
                onChange={set("serverName")}
              />
            </div>
          </div>

          {/* Browser Profile */}
          <div>
            <label className="text-[10px] text-muted-foreground uppercase tracking-widest mb-1 block">
              Browser Profile Path
              <span className="normal-case text-muted-foreground/60 ml-1">(optional — saves session)</span>
            </label>
            <div className="relative">
              <FolderOpen className="absolute left-2 top-1/2 -translate-y-1/2 w-3 h-3 text-muted-foreground" />
              <Input
                className="h-8 text-xs bg-background border-border/70 pl-6"
                placeholder="C:\EdgeProfiles\Bot01"
                value={form.browserProfilePath}
                onChange={set("browserProfilePath")}
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex justify-end gap-2 pt-2 border-t border-border/50">
            <Button
              type="button"
              variant="ghost"
              size="sm"
              className="text-xs tracking-widest uppercase"
              onClick={() => setOpen(false)}
            >
              Cancel
            </Button>
            <Button
              type="submit"
              size="sm"
              className="text-xs tracking-widest uppercase font-bold gap-2"
              disabled={createBot.isPending}
            >
              {createBot.isPending ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <Plus className="w-3.5 h-3.5" />
              )}
              Create Bot
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
