import type { EChartsOption } from 'echarts';
import { formatCompact, formatDecimal, formatMetric } from '@/lib/format';
import { Chart, useChartColors } from './chart';

interface BarDatum {
  label: string;
  value: number;
  /** Preformatted display value; falls back to a formatted number. */
  display?: string;
}

export function BarChart({
  data,
  unit,
  horizontal = false,
  height = 300,
  ariaLabel,
}: {
  data: BarDatum[];
  unit?: string;
  horizontal?: boolean;
  height?: number;
  ariaLabel: string;
}): React.JSX.Element {
  const colors = useChartColors();
  const categoryAxis = {
    type: 'category' as const,
    data: data.map((item) => item.label),
    axisLabel: { color: colors.text, interval: 0, width: 110, overflow: 'truncate' as const },
    axisLine: { lineStyle: { color: colors.grid } },
    axisTick: { show: false },
  };
  const valueAxis = {
    type: 'value' as const,
    axisLabel: {
      color: colors.text,
      formatter: (value: number) => (unit === 'people' ? formatCompact(value) : formatDecimal(value)),
    },
    splitLine: { lineStyle: { color: colors.grid } },
  };

  const option: EChartsOption = {
    backgroundColor: 'transparent',
    grid: { left: 8, right: 16, top: 16, bottom: 8, containLabel: true },
    tooltip: {
      trigger: 'axis',
      axisPointer: { type: 'shadow' },
      valueFormatter: (value) =>
        unit === 'people'
          ? formatMetric('people', Number(value))
          : `${formatDecimal(Number(value))}${unit ? ` ${unit}` : ''}`,
    },
    xAxis: horizontal ? valueAxis : categoryAxis,
    yAxis: horizontal ? categoryAxis : valueAxis,
    series: [
      {
        type: 'bar',
        data: data.map((item, index) => ({
          value: item.value,
          itemStyle: { color: colors.palette[index % colors.palette.length], borderRadius: 4 },
        })),
        barMaxWidth: 42,
        label: horizontal
          ? { show: false }
          : { show: false },
      },
    ],
  };

  const summary = data
    .map((item) => `${item.label}: ${item.display ?? formatDecimal(item.value)}`)
    .join(', ');

  return <Chart option={option} height={height} ariaLabel={ariaLabel} summary={summary} />;
}
