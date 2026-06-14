import { Metadata } from "next";
import { requireAuth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { DeleteAccountButton } from "./delete-account-button";

export const metadata: Metadata = {
  title: "Settings",
  description: "Manage your AIVerse account settings",
};

export default async function SettingsPage() {
  const session = await requireAuth();
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { id: true, email: true, username: true, role: true, plan: true, isActive: true, createdAt: true },
  });

  return (
    <div className="container-main py-8 max-w-2xl">
      <h1 className="text-2xl font-bold text-theme mb-8">Settings</h1>

      <Card className="mb-6">
        <CardHeader>
          <h2 className="font-semibold text-theme">Profile</h2>
        </CardHeader>
        <CardContent className="space-y-4">
          <div>
            <p className="text-sm text-secondary">Email</p>
            <p className="text-theme">{user?.email}</p>
          </div>
          <div>
            <p className="text-sm text-secondary">Username</p>
            <p className="text-theme">{user?.username || "Not set"}</p>
          </div>
          <div>
            <p className="text-sm text-secondary">Role</p>
            <p className="text-theme">{user?.role}</p>
          </div>
          <div>
            <p className="text-sm text-secondary">Plan</p>
            <p className="text-theme">{user?.plan}</p>
          </div>
          <div>
            <p className="text-sm text-secondary">Account Status</p>
            <p className="text-theme">{user?.isActive ? "Active" : "Inactive"}</p>
          </div>
          <div>
            <p className="text-sm text-secondary">Member Since</p>
            <p className="text-theme">{user?.createdAt.toLocaleDateString()}</p>
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <h2 className="font-semibold text-theme">Danger Zone</h2>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-secondary mb-4">
            Once you delete your account, there is no going back. Please be certain.
          </p>
          <DeleteAccountButton />
        </CardContent>
      </Card>
    </div>
  );
}
