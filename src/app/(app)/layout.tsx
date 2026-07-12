import { requireSession } from "@/lib/auth";
import { logout } from "@/server/actions/auth";
import { AppSidebar, MobileNav } from "@/components/app-sidebar";
import { ThemeToggle } from "@/components/theme-toggle";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { ROLE_LABELS } from "@/lib/constants";
import { LogOut } from "lucide-react";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  return (
    <div className="flex min-h-svh w-full">
      <AppSidebar />
      <div className="flex flex-1 flex-col min-w-0">
        <header className="flex h-14 items-center justify-end gap-3 border-b px-4 print:hidden">
          <span className="text-sm font-medium">{session.name}</span>
          <Badge variant="secondary">{ROLE_LABELS[session.role]}</Badge>
          <ThemeToggle />
          <form action={logout}>
            <Button variant="ghost" size="icon" aria-label="Log out" type="submit">
              <LogOut className="h-5 w-5" />
            </Button>
          </form>
        </header>
        <main className="flex-1 p-4 md:p-6 overflow-x-auto">{children}</main>
        <MobileNav />
      </div>
    </div>
  );
}
