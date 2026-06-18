/**
 * Centralized time utilities.
 * No direct Date logic inside components.
 */

export function getElapsedSeconds(isoTimestamp) {
  if (!isoTimestamp) return 0;

  return Math.floor(
    (Date.now() - new Date(isoTimestamp).getTime()) / 1000
  );
}

export function formatElapsed(seconds) {
  if (seconds < 60) return `${seconds}s`;

  const m = Math.floor(seconds / 60);
  const s = seconds % 60;

  return `${m}m ${s}s`;
}

export function formatETA(estimatedEtaMinutes) {
  if (!estimatedEtaMinutes) return 'Unknown';

  return `~${estimatedEtaMinutes} min`;
}

export function formatTime(isoTimestamp) {
  if (!isoTimestamp) return '';

  return new Date(isoTimestamp).toLocaleTimeString([], {
    hour: '2-digit',
    minute: '2-digit',
  });
}