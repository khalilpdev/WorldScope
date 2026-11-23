import type { EChartsOption } from 'echarts';
import { formatMetric } from '@/lib/format';
import { Chart, useChartColors } from './chart';

interface LineSeries {
  name: string;
  points: Array<{ year: number; value: number | null }>;
}

export function LineChart({
  series,
  unit,
  height = 320,
  ariaLabel,
}: {
  series: LineSeries[];
  unit: string;
  height?: number;
  ariaLabel: string;
}): React.JSX.Element {
  const colors = useChartColors();
  const years = [...new Set(series.flatMap((item) => item.points.map((point) => point.year)))].sort(
    (a, b) => a - b,
  );

  const option: EChartsOption = {
    backgroundColor: 'transparent',
    grid: { left: 8, right: 16, top: 32, bottom: 8, containLabel: true },
    tooltip: {
      trigger: 'axis',
      valueFormatter: (value) => (value === null ? 'n/a' : formatMetric(unit, Number(value))),
    },
    legend:
      series.length > 1
        ? { top: 0, textStyle: { color: colors.text } }
        : undefined,
    xAxis: {
      type: 'category',
      data: years.map(String),
      axisLabel: { color: colors.text },
      axisLine: { lineStyle: { color: colors.grid } },
      axisTick: { show: false },
    },
    yAxis: {
      type: 'value',
      scale: true,
      axisLabel: { color: colors.text, formatter: (value: number) => formatMetric(unit, value) },
      splitLine: { lineStyle: { color: colors.grid } },
    },
    series: series.map((item, index) => ({
      name: item.name,
      type: 'line',
      smooth: true,
      showSymbol: item.points.length <= 20,
      connectNulls: false,
      data: years.map((year) => item.points.find((point) => point.year === year)?.value ?? null),
      lineStyle: { width: 2, color: colors.palette[index % colors.palette.length] },
      itemStyle: { color: colors.palette[index % colors.palette.length] },
      areaStyle:
        series.length === 1
          ? {
              color: {
                type: 'linear',
                x: 0,
                y: 0,
                x2: 0,
                y2: 1,
                colorStops: [
                  { offset: 0, color: `${colors.palette[0]}55` },
                  { offset: 1, color: `${colors.palette[0]}00` },
                ],
              },
            }
          : undefined,
    })),
  };

  const summary = series
    .map((item) => `${item.name}: ${item.points.map((point) => `${point.year} ${point.value ?? 'n/a'}`).join(', ')}`)
    .join('; ');

  return <Chart option={option} height={height} ariaLabel={ariaLabel} summary={summary} />;
}
