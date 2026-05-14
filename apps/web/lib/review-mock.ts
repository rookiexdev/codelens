import type { ReviewReport } from "./review-types";

export function fetchMockReview(): Promise<ReviewReport> {
  return new Promise((resolve) => {
    setTimeout(() => resolve(MOCK_REPORT), 2000);
  });
}

const MOCK_REPORT: ReviewReport = {
  score: 72,
  verdict: "needs_attention",
  findings: {
    bugs: [
      {
        id: "b1",
        severity: "critical",
        title: "Missing await on async createUser call",
        description:
          "The result is never resolved before the response is sent, so newly created users won't appear in the returned payload.",
        file: "src/users/users.service.ts",
        line: 84,
      },
      {
        id: "b2",
        severity: "warning",
        title: "Potential null dereference on findUnique result",
        description:
          "findUnique can return null. The follow-up call accesses .email without a guard.",
        file: "src/auth/auth.service.ts",
        line: 132,
      },
    ],
    security: [
      {
        id: "s1",
        severity: "critical",
        title: "JWT secret may fall back to a hardcoded default",
        description:
          "If process.env.JWT_SECRET is missing the code falls through to a dev-only string. This must throw in production.",
        file: "src/auth/auth.module.ts",
        line: 22,
      },
      {
        id: "s2",
        severity: "info",
        title: "Consider tightening CORS origin",
        description:
          "WEB_ORIGIN currently accepts a single value — consider an allowlist for staging/preview deployments.",
        file: "src/main.ts",
        line: 21,
      },
    ],
    suggestions: [
      {
        id: "u1",
        severity: "info",
        title: "Use Prisma select instead of full row",
        description:
          "Fetching the entire user row when only id and email are needed adds 30%+ to the query payload.",
        file: "src/users/users.service.ts",
        line: 51,
      },
      {
        id: "u2",
        severity: "warning",
        title: "N+1 in oauthConnections enumeration",
        description:
          "Looping per-user to list connections will N+1 once you have >50 users — switch to a single findMany with where.userId in [...].",
        file: "src/oauth/oauth.service.ts",
        line: 78,
      },
    ],
  },
};
