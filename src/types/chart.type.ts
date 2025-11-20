// import type { TooltipProps } from "recharts";
// import type {
//   ValueType,
//   NameType,
// } from "recharts/types/component/DefaultTooltipContent";

export interface LinePoint {
  time: string;
  [key: string]: number | string;
}

export interface HoverData {
  time?: string;
  yValue?: number;
  open?: number;
  high?: number;
  low?: number;
  close?: number;
  volume?: number;
  values?: Record<string, string | number>;
  xPx?: number;
  yPx?: number;
  chartWidth?: number;
  chartHeight?: number;
}

export interface OhlcvPoint {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume?: number;
}

export interface CandleEntry {
  time: string;
  open: number;
  high: number;
  low: number;
  close: number;
  volume: number;
}

export interface SeriesItem {
  key: string;
  label: string;
  color: string;
  icon: string;
}

export interface CustomTooltipProps {
  active?: boolean;
  label?: string | number;
  payload?: readonly {
    value: number;
    name?: string;
    dataKey?: string;
    color?: string;
  }[];
}

// export type CustomTooltipProps = TooltipProps<ValueType, NameType>;

export interface ChartProps {
  DATA: LinePoint[];
  OHLCV: OhlcvPoint[];
  SERIES: SeriesItem[];
}
