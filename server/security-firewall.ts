/**
 * ASG Nexus — Security Firewall
 * Integrates AI Security Guardian logic for prompt screening.
 * Detects: PII leakage, prompt injection, harmful content, crypto key exposure.
 */

export interface FirewallResult {
  blocked: boolean;
  threatTypes: string[];
  confidence: number;
  sanitized?: string;
}

// Threat pattern definitions (from ai-security-guardian)
const THREAT_PATTERNS: Array<{ name: string; pattern: RegExp; confidence: number }> = [
  { name: "PII_CREDIT_CARD", pattern: /\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/, confidence: 0.95 },
  { name: "PII_SSN", pattern: /\b\d{3}-\d{2}-\d{4}\b/, confidence: 0.95 },
  { name: "CRYPTO_PRIVATE_KEY", pattern: /\b(0x)?[0-9a-fA-F]{64}\b/, confidence: 0.85 },
  { name: "CRYPTO_SEED_PHRASE", pattern: /\b(abandon|ability|able|about|above|absent|absorb|abstract|absurd|abuse|access|accident)\b.{0,200}\b(abandon|ability|able|about|above|absent|absorb|abstract|absurd|abuse|access|accident)\b/i, confidence: 0.8 },
  { name: "PROMPT_INJECTION", pattern: /ignore\s+(all\s+)?(previous|above|prior)?\s*(instructions?|prompts?|rules?|constraints?)/i, confidence: 0.9 },
  { name: "JAILBREAK", pattern: /(DAN|do anything now|jailbreak|bypass|override).{0,50}(mode|prompt|instruction)/i, confidence: 0.85 },
  { name: "HARMFUL_CONTENT", pattern: /(how to (make|create|build).{0,30}(bomb|weapon|poison|malware|virus))/i, confidence: 0.9 },
  { name: "API_KEY_LEAK", pattern: /\b(sk-[a-zA-Z0-9]{32,}|AIza[0-9A-Za-z-_]{35}|AKIA[0-9A-Z]{16})\b/, confidence: 0.95 },
];

export function screenInput(input: string): FirewallResult {
  const threats: string[] = [];
  let maxConfidence = 0;

  for (const { name, pattern, confidence } of THREAT_PATTERNS) {
    if (pattern.test(input)) {
      threats.push(name);
      maxConfidence = Math.max(maxConfidence, confidence);
    }
  }

  if (threats.length > 0) {
    return {
      blocked: true,
      threatTypes: threats,
      confidence: maxConfidence,
    };
  }

  return { blocked: false, threatTypes: [], confidence: 0 };
}

export function sanitizeOutput(output: string): string {
  // Redact any patterns that slipped through
  return output
    .replace(/\b\d{4}[\s-]?\d{4}[\s-]?\d{4}[\s-]?\d{4}\b/g, "[REDACTED-CC]")
    .replace(/\b\d{3}-\d{2}-\d{4}\b/g, "[REDACTED-SSN]")
    .replace(/\b(sk-[a-zA-Z0-9]{32,})\b/g, "[REDACTED-KEY]")
    .replace(/\b(0x)?[0-9a-fA-F]{64}\b/g, "[REDACTED-HASH]");
}
