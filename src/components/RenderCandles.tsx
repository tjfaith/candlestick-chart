import type { CandleEntry } from "@/types/chart.type";
import type { ScaleBand, ScaleLinear } from "d3-scale";

const RenderCandles = ({
  payload = [],
  xAxisMap = {},
  yAxisMap = {},
}: {
  payload?: CandleEntry[];
  xAxisMap?: Record<
    string,
    { scale: ScaleBand<string> | ScaleLinear<number, number> }
  >;
  yAxisMap?: Record<
    string,
    { scale: ScaleBand<string> | ScaleLinear<number, number> }
  >;
}) => {
  const xScale = Object.values(xAxisMap)[0]?.scale as ScaleBand<string>;
  const yScale = Object.values(yAxisMap)[0]?.scale as ScaleLinear<
    number,
    number
  >;
  if (!xScale || !yScale) return null;

  return (
    <g>
      {payload.map((entry, i: number) => {
        const x = xScale(entry.time);
        if (x === undefined) return null;
        const yOpen = yScale(entry.open);
        const yClose = yScale(entry.close);
        const yHigh = yScale(entry.high);
        const yLow = yScale(entry.low);

        const candleWidth = Math.max(
          6,
          Math.min(22, xScale.bandwidth ? xScale.bandwidth() : 18)
        );
        const left = x - candleWidth / 2;
        const top = Math.min(yOpen, yClose);
        const heightRect = Math.max(1, Math.abs(yClose - yOpen));
        const isBull = entry.close >= entry.open;
        const fill = isBull ? "#26a69a" : "#ef5350";
        const stroke = "#222";

        return (
          <g key={`candle-${i}`}>
            <line
              x1={x}
              x2={x}
              y1={yHigh}
              y2={yLow}
              stroke={stroke}
              strokeWidth={1}
            />
            <rect
              x={left}
              y={top}
              width={candleWidth}
              height={heightRect}
              fill={fill}
              stroke={stroke}
            />
          </g>
        );
      })}
    </g>
  );
};

export default RenderCandles;
