import React, { useMemo, useRef, useState } from "react";
import type { ChartProps, HoverData } from "@/types/chart.type";

import {
  ResponsiveContainer,
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ReferenceDot,
  ComposedChart,
  Bar,
  Customized,
} from "recharts";
import { RenderCandles } from "@/components";

function formatMoney(v: number | string | undefined) {
  if (v == null) return "-";
  return typeof v === "number"
    ? v.toLocaleString(undefined, { maximumFractionDigits: 2 })
    : v;
}

function EmptyTooltip() {
  return null;
}

const Crosshair = ({ xPx, yPx }: { xPx: number; yPx: number }) => {
  return (
    <g>
      <line
        x1={xPx}
        x2={xPx}
        y1={0}
        y2="100%"
        stroke="#94a3b8"
        strokeDasharray="4 4"
        strokeWidth={1}
      />
      <line
        x1={0}
        x2="100%"
        y1={yPx}
        y2={yPx}
        stroke="#94a3b8"
        strokeDasharray="4 4"
        strokeWidth={1}
      />
    </g>
  );
};

const ChartPanel = ({ DATA, OHLCV, SERIES }: ChartProps) => {
  const [mode, setMode] = useState<"line" | "ohlcv">("line");
  const [hover, setHover] = useState<HoverData | null>(null);
  const chartWrapperRef = useRef<HTMLDivElement | null>(null);
  const LINE_Y_MIN = 9900;
  const LINE_Y_MAX = 10750;
  const OHLCV_Y_MIN = 9000;
  const OHLCV_Y_MAX = 10800;

  const lastPoints = useMemo(() => {
    if (!DATA || DATA.length === 0) return [];
    const last = DATA[DATA.length - 1];
    return SERIES.map((s) => ({
      key: s.key,
      value: last?.[s.key],
      color: s.color,
      label: s.label,
    }));
  }, [DATA, SERIES]);

  const handlePointer = (clientX: number, clientY: number) => {
    const wrap = chartWrapperRef.current;
    if (!wrap) return;

    const rect = wrap.getBoundingClientRect();

    const xRel = Math.min(Math.max(0, clientX - rect.left), rect.width);
    const yRel = Math.min(Math.max(0, clientY - rect.top), rect.height);

    const xRatio = rect.width <= 0 ? 0 : xRel / rect.width;
    const source = mode === "line" ? DATA : OHLCV;
    if (!source || source.length === 0) return;

    const index = Math.round(xRatio * (source.length - 1));

    const idx = Math.max(
      0,
      Math.min((mode === "line" ? DATA.length : OHLCV.length) - 1, index)
    );

    if (mode === "line") {
      const row = DATA[idx];
      const yRatio = rect.height <= 0 ? 0 : yRel / rect.height;
      const yValue = LINE_Y_MAX - yRatio * (LINE_Y_MAX - LINE_Y_MIN);

      const values: Record<string, string | number> = {};
      for (const s of SERIES) values[s.key] = row[s.key];

      setHover({
        time: row.time,
        yValue: Number(yValue.toFixed(2)),
        values,
        xPx: xRel,
        yPx: yRel,
      });
    } else {
      if (!OHLCV || OHLCV.length === 0) return;
      const row = OHLCV[idx];
      const yRatio = rect.height <= 0 ? 0 : yRel / rect.height;
      const yValue = OHLCV_Y_MAX - yRatio * (OHLCV_Y_MAX - OHLCV_Y_MIN);

      setHover({
        time: row.time,
        yValue: Number(yValue.toFixed(2)),
        open: row.open,
        high: row.high,
        low: row.low,
        close: row.close,
        volume: row.volume,
        xPx: xRel,
        yPx: yRel,
      });
    }
  };

  const onMouseMoveOverlay = (e: React.MouseEvent) => {
    handlePointer(e.clientX, e.clientY);
  };

  const onTouchMoveOverlay = (e: React.TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    handlePointer(touch.clientX, touch.clientY);
  };

  const onLeaveOverlay = () => setHover(hover);

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6 items-start">
      <div
        ref={chartWrapperRef}
        className="flex-1 relative bg-white rounded-xl p-4 shadow-sm"
        style={{ minHeight: 320 }}
      >
        <h3 className="text-center text-sm tracking-wider font-bold select-none">
          AVERAGE TOTAL ACCOUNT VALUE
        </h3>

        <div
          className="w-full"
          style={{
            height: window?.innerWidth && window.innerWidth < 768 ? 360 : 520,
          }}
        >
          <ResponsiveContainer width="100%" height="100%">
            {mode === "line" ? (
              <LineChart
                data={DATA}
                margin={{ top: 20, right: 120, left: 24, bottom: 60 }}
              >
                <CartesianGrid stroke="#eee" vertical={false} strokeWidth={1} />
                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                  padding={{ left: 10, right: 10 }}
                />
                <YAxis
                  domain={[LINE_Y_MIN, LINE_Y_MAX]}
                  tickFormatter={(v) => `$${v}`}
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />

                {hover && (
                  <Customized
                    component={<Crosshair xPx={hover.xPx!} yPx={hover.yPx!} />}
                  />
                )}

                <Tooltip
                  cursor={{ stroke: "#94a3b8", strokeWidth: 1 }}
                  content={<EmptyTooltip />}
                />

                {SERIES.map((s, idx) => (
                  <React.Fragment key={s.key}>
                    <Line
                      type="linear"
                      dataKey={s.key}
                      stroke={s.color}
                      strokeWidth={8}
                      dot={false}
                      opacity={0.06}
                      isAnimationActive={false}
                      style={{ pointerEvents: "none" }}
                    />

                    <Line
                      type="linear"
                      dataKey={s.key}
                      stroke={s.color}
                      strokeWidth={idx === 0 || s.key === "deepseek" ? 3 : 2}
                      dot={true}
                      opacity={s.key === "mystery" ? 0.7 : 0.98}
                      isAnimationActive={true}
                    />
                  </React.Fragment>
                ))}

                {lastPoints.map((p) => (
                  <ReferenceDot
                    key={p.key}
                    x={DATA[DATA.length - 1].time}
                    y={p.value}
                    r={8}
                    fill={p.color}
                    stroke="#fff"
                    strokeWidth={2}
                    label={{
                      value: `$${formatMoney(p.value)}`,
                      position: "right",
                      fill: "#111",
                      fontSize: 12,
                    }}
                  />
                ))}
              </LineChart>
            ) : (
              <ComposedChart
                data={OHLCV}
                margin={{ top: 20, right: 120, left: 24, bottom: 60 }}
              >
                <CartesianGrid stroke="#eee" vertical={false} strokeWidth={1} />

                <XAxis
                  dataKey="time"
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />

                <YAxis
                  domain={[OHLCV_Y_MIN, OHLCV_Y_MAX]}
                  tickFormatter={(v) => `$${v}`}
                  tick={{ fontSize: 12 }}
                  axisLine={false}
                  tickLine={false}
                />

                {hover && (
                  <Customized
                    component={<Crosshair xPx={hover.xPx!} yPx={hover.yPx!} />}
                  />
                )}

                <Tooltip
                  cursor={{ stroke: "#94a3b8", strokeWidth: 1 }}
                  content={<EmptyTooltip />}
                />

                <Bar dataKey="volume" barSize={14} fill="#222" opacity={0.06} />

                <Customized component={<RenderCandles />} />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>

        <div
          onMouseMove={onMouseMoveOverlay}
          onMouseLeave={onLeaveOverlay}
          onTouchMove={onTouchMoveOverlay}
          onTouchEnd={onLeaveOverlay}
          className="absolute inset-0 z-30"
          style={{ touchAction: "none", background: "transparent" }}
        />
        <div className="mt-3 flex flex-wrap items-center gap-3 px-1">
          {SERIES.map((s) => (
            <div key={s.key} className="flex items-center gap-2 text-xs">
              <div
                className="w-3 h-3 rounded-sm"
                style={{ background: s.color }}
              />
              <div className="truncate max-w-[110px]">
                {s.label}{" "}
                <span className="text-gray-400 text-xs">
                  {" "}
                  ${formatMoney(DATA[DATA.length - 1][s.key])}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div className="w-full lg:w-72 bg-white rounded-xl p-4 shadow-sm mt-2 lg:mt-0">
        <div className="flex justify-between items-center">
          <div className="text-xs text-gray-500">SELECTED</div>
          <div className="text-sm text-gray-400">All models</div>
        </div>

        <div className="mt-3 min-h-[72px]">
          {!hover ? (
            <div className="text-sm text-gray-400">
              Tap or drag the chart to select time & price
            </div>
          ) : (
            <div className="space-y-2">
              <div className="text-xs text-gray-400">Time</div>
              <div className="font-semibold">{hover.time}</div>

              <div className="text-xs text-gray-400 mt-2">Price</div>
              <div className="font-semibold text-lg">
                ${formatMoney(hover.yValue)}
              </div>

              {mode === "line" ? (
                <>
                  <div className="text-xs text-gray-400 mt-2">Model values</div>
                  <div className="grid grid-cols-2 gap-1 text-xs">
                    {Object.entries(hover.values || {}).map(([k, v]) => (
                      <div key={k} className="flex justify-between">
                        <div className="capitalize">{k}</div>
                        <div>${formatMoney(v as number)}</div>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <>
                  <div className="text-xs text-gray-400 mt-2">Open</div>
                  <div>${formatMoney(hover.open)}</div>
                  <div className="text-xs text-gray-400">High</div>
                  <div>${formatMoney(hover.high)}</div>
                  <div className="text-xs text-gray-400">Low</div>
                  <div>${formatMoney(hover.low)}</div>
                  <div className="text-xs text-gray-400">Close</div>
                  <div>${formatMoney(hover.close)}</div>
                  <div className="text-xs text-gray-400">Vol</div>
                  <div>{formatMoney(hover.volume)}</div>
                </>
              )}
            </div>
          )}
        </div>

        <div className="mt-4 flex gap-2">
          <button
            onClick={() => setMode("line")}
            className={`px-3 py-1 rounded text-xs ${
              mode === "line" ? "bg-black text-white" : "border"
            }`}
          >
            Multi-Line
          </button>
          <button
            onClick={() => setMode("ohlcv")}
            className={`px-3 py-1 rounded text-xs ${
              mode === "ohlcv" ? "bg-black text-white" : "border"
            }`}
          >
            OHLCV
          </button>
        </div>
      </div>
    </div>
  );
};

export default ChartPanel;
