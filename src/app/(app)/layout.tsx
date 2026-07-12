import { addDays } from "date-fns";
import { requireSession } from "@/lib/auth";
import { logout } from "@/server/actions/auth";
import { db } from "@/lib/db";
import { AppSidebar, MobileNav } from "@/components/app-sidebar";
import { Topbar } from "@/components/topbar";
import { CommandMenu } from "@/components/command-menu";
import { KeyboardShortcuts } from "@/components/keyboard-shortcuts";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const session = await requireSession();

  const soon = addDays(new Date(), 30);
  const [expiringLicenses, expiringDocuments] = await Promise.all([
    db.driver.count({ where: { licenseExpiry: { lte: soon } } }),
    db.vehicleDocument.count({ where: { expiryDate: { lte: soon } } }),
  ]);

  return (
    <div className="flex min-h-svh w-full">
      <AppSidebar />
      <div className="flex min-w-0 flex-1 flex-col">
        <Topbar
          name={session.name}
          role={session.role}
          expiringLicenses={expiringLicenses}
          expiringDocuments={expiringDocuments}
          logout={logout}
        />
        <main className="flex-1 overflow-x-auto p-4 md:p-6">{children}</main>
        <MobileNav />
      </div>

      <CommandMenu />
      <KeyboardShortcuts />
    </div>
  );
}
