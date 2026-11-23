import type { EChartsOption } from 'echarts';
import ReactECharts from 'echarts-for-react';
import { useTheme } from '@/lib/theme';

export interface ChartColors {
  text: string;
  grid: string;
  primary: string;
  palette: string[];
}

export function useChartColors(): ChartColors {
  const { theme } = useTheme();
  return theme === 'dark'
    ? {
        text: '#94a3b8',
        grid: '#334155',
        primary: '#60a5fa',
        palette: ['#60a5fa', '#2dd4bf', '#fbbf24', '#fb7185', '#c084fc'],
      }
    : {
        text: '#64748b',
        grid: '#e2e8f0',
        primary: '#2563eb',
        palette: ['#2563eb', '#0d9488', '#d97706', '#e11d48', '#9333ea'],
      };
}

/**
 * Thin ECharts wrapper. The option is rebuilt by the caller so charts always
 * follow the active theme; the component remounts on theme change because
 * ECharts does not read CSS custom properties.
 */
export function Chart({
  option,
  height = 280,
  ariaLabel,
  summary,
}: {
  option: EChartsOption;
  height?: number;
  ariaLabel: string;
  summary?: string;
}): React.JSX.Element {
  const { theme } = useTheme();

  return (
    <div role="img" aria-label={ariaLabel} className="w-full">
      <ReactECharts
        key={theme}
        option={option}
        style={{ height, width: '100%' }}
        opts={{ renderer: 'canvas' }}
        notMerge
      />
      {summary ? <p className="sr-only">{summary}</p> : null}
    </div>
  );
}
