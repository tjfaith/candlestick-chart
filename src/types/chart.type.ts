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

export interface ChartProps {
  DATA: LinePoint[];
  OHLCV: OhlcvPoint[];
  SERIES: SeriesItem[];
}
