import { getSession } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { notFound } from "next/navigation";
import Link from "next/link";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { AgentRunner } from "@/components/agent/agent-runner";
import { ReviewForm } from "@/components/agent/review-form";
import { NeuralText } from "@/components/effects/neural-text";
import { cacheGet, cacheSet, CACHE_TTL } from "@/lib/redis";

interface AgentDetailPageProps {
  params: Promise<{ slug: string }>;
}

interface AgentDetail {
  id: string;
  slug: string;
  name: string;
  category: string;
  status: string;
  pricingType: string;
  creditsPerRun: number;
  systemPrompt: string | null;
  totalRuns: number;
  creatorId: string;
  creator: { username: string | null; id: string };
  reviews: Array<{
    id: string;
    rating: number;
    title: string | null;
    body: string | null;
    user: { username: string | null };
  }>;
}

export default async function AgentDetailPage({ params }: AgentDetailPageProps) {
  const { slug } = await params;
  const session = await getSession();

  const cacheKey = `agent:${slug}`;
  let agent = await cacheGet<AgentDetail>(cacheKey);
  if (!agent) {
    agent = await prisma.agent.findUnique({
      where: { slug },
      include: {
        creator: { select: { username: true, id: true } },
        reviews: { include: { user: { select: { username: true } } }, take: 5, orderBy: { createdAt: "desc" } },
      },
    }) as unknown as AgentDetail | null;
    if (agent) await cacheSet(cacheKey, agent, CACHE_TTL.AGENT_DETAIL);
  }

  if (!agent) notFound();

  const isCreator = session?.user?.id === agent.creatorId;

  return (
    <div className="container-main py-8">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2 space-y-6">
          <Card>
            <CardContent className="p-6">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <div className="flex items-center gap-2 mb-2">
                    <Badge variant={agent.category === "CHAT" ? "purple" : agent.category === "CODE" ? "success" : agent.category === "DATA" ? "warning" : "default"}>
                      {agent.category}
                    </Badge>
                    {agent.pricingType === "FREE" ? (
                      <Badge variant="success">Free</Badge>
                    ) : (
                      <Badge>{agent.creditsPerRun} credits/run</Badge>
                    )}
                  </div>
                  <h1 className="text-2xl font-bold text-white font-[family-name:var(--font-neural)]">
                    <NeuralText>{agent.name}</NeuralText>
                  </h1>
                  <p className="text-sm text-zinc-500 mt-1">
                    by {agent.creator.username || "anonymous"} &middot; {agent.totalRuns} runs
                  </p>
                </div>
                {isCreator && (
                  <Badge variant="purple">Your Agent</Badge>
                )}
              </div>
              {agent.systemPrompt && (
                <div className="mt-4 p-4 rounded-lg glass border border-purple-500/10">
                  <div className="flex items-center gap-2 mb-2">
                    <svg className="w-3 h-3 text-purple-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    <span className="text-xs text-zinc-500 font-[family-name:var(--font-neural)]">System Prompt</span>
                  </div>
                  <p className="text-sm text-zinc-300">{agent.systemPrompt}</p>
                </div>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <h2 className="font-semibold text-zinc-100 font-[family-name:var(--font-neural)]">Run Agent</h2>
                {isCreator && (
                  <Badge variant="cyan" className="animate-float">Test Mode active</Badge>
                )}
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <AgentRunner
                agentId={agent.id}
                slug={agent.slug}
                agentName={agent.name}
                category={agent.category}
                systemPrompt={agent.systemPrompt}
                pricingType={agent.pricingType}
                creditsPerRun={agent.creditsPerRun}
                isTestMode={isCreator}
                isCreator={isCreator}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <h2 className="font-semibold text-zinc-100 font-[family-name:var(--font-neural)]">Write a Review</h2>
            </CardHeader>
            <CardContent>
              <ReviewForm agentId={agent.id} slug={agent.slug} />
            </CardContent>
          </Card>

          {agent.reviews.length > 0 && (
            <Card>
              <CardHeader>
                <h2 className="font-semibold text-zinc-100 font-[family-name:var(--font-neural)]">Reviews</h2>
              </CardHeader>
              <CardContent className="space-y-4">
                {agent.reviews.map((review) => (
                  <div key={review.id} className="border-b border-white/5 last:border-0 pb-4 last:pb-0">
                    <div className="flex items-center gap-2 mb-1">
                      <div className="relative flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-purple-600 to-stream-500 text-[10px] font-medium text-white">
                        {(review.user.username || "A")[0].toUpperCase()}
                      </div>
                      <span className="text-sm font-medium text-zinc-300">{review.user.username || "Anonymous"}</span>
                      <span className="text-xs text-yellow-400">{Array(review.rating).fill("★").join("")}</span>
                    </div>
                    {review.title && <p className="text-sm text-zinc-200">{review.title}</p>}
                    {review.body && <p className="text-xs text-zinc-500 mt-1">{review.body}</p>}
                  </div>
                ))}
              </CardContent>
            </Card>
          )}
        </div>

        <div className="space-y-4">
          <Card>
            <CardContent className="p-5 space-y-3">
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Category</span>
                <Badge variant={agent.category === "CHAT" ? "purple" : agent.category === "CODE" ? "success" : agent.category === "DATA" ? "warning" : "default"}>
                  {agent.category}
                </Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Status</span>
                <Badge>{agent.status}</Badge>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Pricing</span>
                <span className="text-zinc-300">
                  {agent.pricingType === "FREE" ? "Free" : `${agent.creditsPerRun} credits`}
                </span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-zinc-500">Total Runs</span>
                <span className="text-zinc-300 font-mono">{agent.totalRuns}</span>
              </div>
            </CardContent>
          </Card>

          {isCreator && (
            <Card>
              <CardContent className="p-5 space-y-3">
                <h3 className="text-sm font-semibold text-zinc-200 font-[family-name:var(--font-neural)]">Management</h3>
                <Link href={`/agents/${agent.slug}/edit`} className="w-full">
                  <Button variant="secondary" size="sm" className="w-full">Edit Agent</Button>
                </Link>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
