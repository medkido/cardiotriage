export type FlagGroup =
  | "cardiacHistory"
  | "cardiacPain"
  | "cardiacExam"
  | "reassuringHistory"
  | "reassuringPain"
  | "reassuringExam";

export interface FlagDef {
  id: string;
  label: string;
  group: FlagGroup;
}

export type RiskTier = "high" | "indeterminate" | "low";

export interface TriageResult {
  tier: RiskTier;
  cardiacFlagsMatched: FlagDef[];
  reassuringFlagsMatched: FlagDef[];
  headline: string;
  recommendation: string;
}
