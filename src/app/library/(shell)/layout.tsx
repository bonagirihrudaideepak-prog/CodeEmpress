import { redirect } from "next/navigation";
import { auth } from "@/lib/auth";
import { AppShell } from "@/components/ui/app-shell";

export default async function LibraryShell({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();
  if (!session?.user?.email) redirect("/login");
  const user = { name: session.user.name, targetRole: null };

  return <AppShell user={user}>{children}</AppShell>;
}
