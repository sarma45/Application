"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";

interface Organization {
  id: string;
  name: string;
  slug: string;
  plan: string;
  owner: { email: string; username: string | null };
  _count: { members: number };
}

interface Member {
  id: string;
  role: string;
  joinedAt: string;
  user: { email: string; username: string | null };
}

interface Invite {
  id: string;
  email: string;
  role: string;
  token: string;
  expiresAt: string;
}

export default function OrganizationsPage() {
  const [orgs, setOrgs] = useState<Organization[]>([]);
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<Member[]>([]);
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [orgName, setOrgName] = useState("");
  const [inviteEmail, setInviteEmail] = useState("");

  useEffect(() => { loadOrgs(); }, []);

  async function loadOrgs() {
    try {
      const res = await fetch("/api/organizations");
      if (res.ok) {
        const data = await res.json();
        setOrgs(data.organizations || []);
      }
    } catch {} finally { setLoading(false); }
  }

  async function createOrg() {
    if (!orgName.trim()) return;
    try {
      const res = await fetch("/api/organizations", {
        method: "POST", body: JSON.stringify({ name: orgName }),
      });
      if (res.ok) {
        setShowCreate(false);
        setOrgName("");
        loadOrgs();
      }
    } catch {}
  }

  async function loadOrgDetail(org: Organization) {
    setSelectedOrg(org);
    try {
      const res = await fetch(`/api/organizations/members?organizationId=${org.id}`);
      if (res.ok) {
        const data = await res.json();
        setMembers(data.members || []);
        setInvites(data.invites || []);
      }
    } catch {}
  }

  async function inviteMember() {
    if (!inviteEmail.trim() || !selectedOrg) return;
    try {
      await fetch("/api/organizations/invite", {
        method: "POST", body: JSON.stringify({ organizationId: selectedOrg.id, email: inviteEmail }),
      });
      setInviteEmail("");
      loadOrgDetail(selectedOrg);
    } catch {}
  }

  async function removeMember(userId: string) {
    if (!selectedOrg || !confirm("Remove this member?")) return;
    try {
      await fetch("/api/organizations/members", {
        method: "DELETE", body: JSON.stringify({ organizationId: selectedOrg.id, userId }),
      });
      loadOrgDetail(selectedOrg);
    } catch {}
  }

  return (
    <div className="container-main py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Organizations</h1>
          <p className="text-sm text-zinc-500">Manage teams and workspaces</p>
        </div>
        <Button onClick={() => setShowCreate(!showCreate)} size="sm">
          {showCreate ? "Cancel" : "Create Organization"}
        </Button>
      </div>

      {showCreate && (
        <Card className="mb-6">
          <CardContent className="p-5 space-y-4">
            <input
              value={orgName}
              onChange={(e) => setOrgName(e.target.value)}
              placeholder="Organization name"
              className="w-full px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-purple-500"
            />
            <Button onClick={createOrg} disabled={!orgName.trim()}>Create</Button>
          </CardContent>
        </Card>
      )}

      {loading ? (
        <div className="space-y-4">
          {[1, 2].map((i) => <div key={i} className="h-20 rounded-xl bg-zinc-800/50 animate-pulse" />)}
        </div>
      ) : orgs.length === 0 ? (
        <Card>
          <CardContent className="p-12 text-center">
            <p className="text-zinc-500 text-sm">No organizations yet. Create your first team workspace.</p>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="space-y-3">
            {orgs.map((org) => (
              <button
                key={org.id}
                onClick={() => loadOrgDetail(org)}
                className={`w-full text-left p-4 rounded-xl border transition-colors ${
                  selectedOrg?.id === org.id
                    ? "border-purple-500/50 bg-purple-500/5"
                    : "border-zinc-800 bg-zinc-900/30 hover:border-zinc-700"
                }`}
              >
                <h3 className="font-semibold text-zinc-200">{org.name}</h3>
                <p className="text-xs text-zinc-500 mt-1">{org._count.members} members · {org.plan}</p>
              </button>
            ))}
          </div>

          {selectedOrg && (
            <div className="lg:col-span-2 space-y-6">
              <Card>
                <CardContent className="p-5">
                  <h3 className="text-lg font-semibold text-zinc-100 mb-4">Members ({members.length})</h3>
                  <div className="space-y-2">
                    {members.map((m) => (
                      <div key={m.id} className="flex items-center justify-between p-3 rounded-lg bg-zinc-800/50">
                        <div>
                          <p className="text-sm text-zinc-300">{m.user.email}</p>
                          <p className="text-xs text-zinc-600">Joined {new Date(m.joinedAt).toLocaleDateString()}</p>
                        </div>
                        <div className="flex items-center gap-2">
                          <Badge variant={m.role === "OWNER" ? "purple" : "default"}>{m.role}</Badge>
                          {m.role !== "OWNER" && (
                            <Button size="sm" variant="ghost" className="text-red-400" onClick={() => removeMember(m.user.email)}>Remove</Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardContent className="p-5">
                  <h3 className="text-lg font-semibold text-zinc-100 mb-4">Invite Members</h3>
                  <div className="flex gap-2">
                    <input
                      value={inviteEmail}
                      onChange={(e) => setInviteEmail(e.target.value)}
                      placeholder="Email address"
                      type="email"
                      className="flex-1 px-3 py-2 rounded-lg bg-zinc-800 border border-zinc-700 text-white text-sm focus:outline-none focus:border-purple-500"
                    />
                    <Button onClick={inviteMember} disabled={!inviteEmail.trim()}>Send Invite</Button>
                  </div>

                  {invites.length > 0 && (
                    <div className="mt-4 space-y-2">
                      <p className="text-xs text-zinc-500 font-medium">Pending Invites</p>
                      {invites.map((inv) => (
                        <div key={inv.id} className="flex items-center justify-between p-2 rounded-lg bg-zinc-800/30">
                          <span className="text-sm text-zinc-400">{inv.email}</span>
                          <span className="text-xs text-zinc-600">Expires {new Date(inv.expiresAt).toLocaleDateString()}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      )}
    </div>
  );
}