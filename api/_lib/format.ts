/** Formats a duration in seconds as "m:ss". Returns undefined for
 *  missing/invalid input so callers can omit the field entirely. */
export function formatDuration(totalSeconds?: number | null): string | undefined {
  if (totalSeconds == null || !Number.isFinite(totalSeconds) || totalSeconds < 0) {
    return undefined;
  }
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = Math.floor(totalSeconds % 60)
    .toString()
    .padStart(2, '0');
  return `${minutes}:${seconds}`;
}
