import { Shield, LayoutDashboard, Bot as BotIcon, Activity, Map, UserMinus, FileText, Wifi, RefreshCcw } from "lucide-react";
import { Button } from "@/components/ui/button";

export function Sidebar() {
  return (
    <aside className="w-64 border-r border-sidebar-border bg-sidebar h-screen flex flex-col hidden md:flex shrink-0">
      <div className="h-16 flex items-center px-6 border-b border-sidebar-border">
        <Shield className="w-6 h-6 mr-3 text-primary" />
        <span className="font-bold tracking-widest text-sm text-sidebar-foreground">
          OBJECTIVE FIRST
        </span>
      </div>
      
      <nav className="flex-1 py-6 px-3 space-y-1 overflow-y-auto">
        <SidebarItem icon={<LayoutDashboard size={18} />} label="Dashboard" />
        <SidebarItem icon={<BotIcon size={18} />} label="Bots" />
        <SidebarItem icon={<Activity size={18} />} label="Seeding" />
        <SidebarItem icon={<Map size={18} />} label="Live Map" />
        <SidebarItem icon={<UserMinus size={18} />} label="Ban Manager" />
        <SidebarItem icon={<FileText size={18} />} label="Audit" />
        <SidebarItem icon={<BotIcon size={18} />} label="GFN Seeder" active />
      </nav>

      <div className="p-4 border-t border-sidebar-border bg-black/10">
        <div className="text-xs font-mono text-muted-foreground mb-2 flex items-center justify-between">
          <span>CONNECTION</span>
          <Wifi size={12} className="text-primary" />
        </div>
        <div className="flex gap-2">
          <input 
            type="text" 
            readOnly 
            value="http://127.0.0.1:8787" 
            className="flex-1 bg-background border border-border rounded px-2 py-1.5 text-xs font-mono text-foreground focus:outline-none focus:border-primary"
          />
          <Button size="icon" variant="outline" className="h-auto w-8 shrink-0 bg-background border-border hover:bg-accent">
            <RefreshCcw size={14} className="text-muted-foreground" />
          </Button>
        </div>
      </div>
    </aside>
  );
}

function SidebarItem({ icon, label, active }: { icon: React.ReactNode; label: string; active?: boolean }) {
  return (
    <button
      className={`w-full flex items-center px-3 py-2.5 rounded-md text-sm transition-colors ${
        active 
          ? "bg-sidebar-accent text-sidebar-accent-foreground font-medium" 
          : "text-muted-foreground hover:bg-sidebar-accent/50 hover:text-sidebar-foreground"
      }`}
    >
      <span className="mr-3 opacity-80">{icon}</span>
      {label}
    </button>
  );
}
