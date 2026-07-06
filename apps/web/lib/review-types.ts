export type Severity = "critical" | "warning" | "info";
export type FindingCategory = "bugs" | "security" | "suggestions";
export type Verdict = "approved" | "needs_attention" | "changes_required";

export interface Finding {
  id: string;
  severity: Severity;
  title: string;
  description: string;
  file: string;
  line: number;
}

export interface ReviewReport {
  score: number;
  verdict: Verdict;
  findings: Record<FindingCategory, Finding[]>;
}

export const VERDICT_LABEL: Record<Verdict, string> = {
  approved: "Approved",
  needs_attention: "Needs Attention",
  changes_required: "Changes Required",
};
