import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DeleteAccountButton } from "./delete-account-button";

export default async function SettingsPage() {
  const session = await requireAuth();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, username: true, role: true, plan: true, isActive: true, createdAt: true },
  });

  return (
    <div className="container-main py-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-white mb-8 font-[family-name:var(--font-neural)]">Settings</h1>

      <Card className="mb-6">
        <CardHeader>
          <h2 className="font-semibold text-zinc-100 font-[family-name:var(--font-neural)]">Profile</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-zinc-500">Email</p>
            <p className="text-zinc-200">{user?.email}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-500">Username</p>
            <p className="text-zinc-200">{user?.username || "Not set"}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-500">Role</p>
            <p className="text-zinc-200">{user?.role}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-500">Plan</p>
            <p className="text-zinc-200">{user?.plan}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-500">Account Status</p>
            <p className="text-zinc-200">{user?.isActive ? "Active" : "Inactive"}</p>
          </div>
          <div>
            <p className="text-sm text-zinc-500">Member Since</p>
            <p className="text-zinc-200">{user?.createdAt.toLocaleDateString()}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-zinc-100 font-[family-name:var(--font-neural)]">Danger Zone</h2>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-zinc-500 mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <DeleteAccountButton />
        </CardContent>
      </Card>
    </div>
  );
}
