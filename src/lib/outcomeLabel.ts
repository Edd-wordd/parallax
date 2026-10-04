/** Map outcome_score (1–10) to a short UI label. Not stored in DB. */
export function outcomeScoreLabel(score: number): string {
  if (score >= 9) return "Excellent";
  if (score >= 7) return "Good";
  if (score >= 5) return "Fair";
  if (score >= 3) return "Poor";
  return "Failed";
}
