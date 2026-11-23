const numberFormatter = new Intl.NumberFormat('en', {
  maximumFractionDigits: 0,
});

const oneDecimalFormatter = new Intl.NumberFormat('en', {
  maximumFractionDigits: 1,
});

const compactFormatter = new Intl.NumberFormat('en', {
  notation: 'compact',
  maximumFractionDigits: 1,
});

const dateFormatter = new Intl.DateTimeFormat('en', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
});

const dateTimeFormatter = new Intl.DateTimeFormat('en', {
  year: 'numeric',
  month: 'short',
  day: 'numeric',
  hour: '2-digit',
  minute: '2-digit',
});

export function formatNumber(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return numberFormatter.format(value);
}

export function formatDecimal(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return oneDecimalFormatter.format(value);
}

export function formatCompact(value: number | null | undefined): string {
  if (value === null || value === undefined || Number.isNaN(value)) return '—';
  return compactFormatter.format(value);
}

export function formatPopulation(value: number | null | undefined): string {
  return formatCompact(value);
}

export function formatArea(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return `${formatCompact(value)} km²`;
}

export function formatDensity(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return `${formatDecimal(value)} /km²`;
}

export function formatUsdCompact(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return `$${formatCompact(value)}`;
}

export function formatPercent(value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  return `${oneDecimalFormatter.format(value)}%`;
}

/** Formats a metric according to the unit declared by the indicator. */
export function formatMetric(unit: string, value: number | null | undefined): string {
  if (value === null || value === undefined) return '—';
  if (unit.includes('%')) return formatPercent(value);
  if (unit.includes('US$')) return formatUsdCompact(value);
  if (unit === 'people') return formatNumber(value);
  return formatNumber(value);
}

export function formatDate(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return dateFormatter.format(date);
}

export function formatDateTime(value: string | null | undefined): string {
  if (!value) return '—';
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return value;
  return dateTimeFormatter.format(date);
}

export function formatYear(value: string | number | null | undefined): string {
  if (value === null || value === undefined || value === '') return '—';
  return String(value);
}
