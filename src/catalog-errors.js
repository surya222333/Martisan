export function catalogErrorMessage(detail, copy) {
  const message = String(detail || '').trim();
  if (/\b429\b|rate.?limit|quota|billing|credit|spend.?limit|usage.?limit|insufficient[_ -]quota|organization.?usage.?limit/i.test(message)) {
    return copy.aiLimitReached;
  }
  if (/not configured|not reachable|unavailable|failed to fetch|timed out|connection refused|backend|server could not complete/i.test(message)) {
    return copy.aiUnavailable;
  }
  // Backend details are deliberately sanitized; preserve them so a new provider/API
  // failure does not get hidden behind an unhelpful generic message.
  return message || copy.analysisFailed;
}
