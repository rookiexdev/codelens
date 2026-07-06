import { Suspense } from "react";
import { ReviewClient } from "./review-client";

interface ReviewPageProps {
  searchParams: Promise<{
    sessionId?: string | string[];
    repo?: string | string[];
    provider?: string | string[];
  }>;
}

function pickFirst(v: string | string[] | undefined): string | null {
  if (typeof v === "string") return v;
  if (Array.isArray(v)) return v[0] ?? null;
  return null;
}

export default async function ReviewPage({ searchParams }: ReviewPageProps) {
  const sp = await searchParams;
  const sessionId = pickFirst(sp.sessionId);
  const repo = pickFirst(sp.repo);
  const provider = pickFirst(sp.provider);

  return (
    <Suspense fallback={null}>
      <ReviewClient sessionId={sessionId} repo={repo} provider={provider} />
    </Suspense>
  );
}
