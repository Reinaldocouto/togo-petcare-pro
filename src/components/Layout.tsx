import { SidebarProvider, SidebarTrigger } from "@/components/ui/sidebar";
import { AppSidebar } from "@/components/AppSidebar";
import { useAuth } from "@/contexts/AuthContext";
import { Button } from "@/components/ui/button";
import { LogOut } from "lucide-react";

export function Layout({ children }: { children: React.ReactNode }) {
  const { signOut, user } = useAuth();

  const getGreeting = () => {
    const hour = new Date().getHours();
    const userName = user?.user_metadata?.nome || "Usuário";
    
    if (hour >= 1 && hour < 12) {
      return `Bom dia Dr ${userName}`;
    } else if (hour >= 13 && hour < 18) {
      return `Boa tarde Dr ${userName}`;
    } else {
      return `Boa noite Dr ${userName}`;
    }
  };

  return (
    <SidebarProvider>
      <div className="min-h-screen flex w-full">
        <AppSidebar />
        <div className="flex-1 flex flex-col">
          <header className="h-14 border-b bg-background flex items-center justify-between px-4">
            <SidebarTrigger />
            <div className="flex items-center gap-4">
              <span className="text-sm text-muted-foreground">{getGreeting()}</span>
              <Button variant="ghost" size="sm" onClick={signOut}>
                <LogOut className="h-4 w-4 mr-2" />
                Sair
              </Button>
            </div>
          </header>
          <main className="flex-1 p-6 bg-secondary/20">
            {children}
          </main>
        </div>
      </div>
    </SidebarProvider>
  );
}
