const DURATION_PATTERN = /^(\d+)(ms|s|m|h|d)$/;

const UNIT_MULTIPLIERS: Readonly<Record<string, number>> = {
  ms: 1,
  s: 1_000,
  m: 60_000,
  h: 3_600_000,
  d: 86_400_000
};

export function durationToMilliseconds(duration: string): number {
  const match = DURATION_PATTERN.exec(duration.trim());

  if (!match) {
    throw new Error(`Durata JWT non valida: ${duration}`);
  }

  const amount = Number(match[1]);
  const multiplier = UNIT_MULTIPLIERS[match[2]];

  if (!Number.isSafeInteger(amount) || multiplier === undefined) {
    throw new Error(`Durata JWT non valida: ${duration}`);
  }

  return amount * multiplier;
}
