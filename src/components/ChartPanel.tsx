import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { CustomTooltip, RenderCandles } from "@/components";
import { Icon } from "@iconify/react";

function formatMoney(v: number | string | undefined) {
  if (v == null) return "-";
  return typeof v === "number"
    ? v.toLocaleString(undefined, { maximumFractionDigits: 2 })
    : v;
}

// const Crosshair = ({ x, y }: { x: number; y: number }) => (
//   <g pointerEvents="none">
//     <line
//       x1={x}
//       x2={x}
//       y1={0}
//       y2="100%"
//       stroke="#94a3b8"
//       strokeWidth={1}
//       strokeDasharray="4 4"
//     />
//     <line
//       x1={0}
//       x2="100%"
//       y1={y}
//       y2={y}
//       stroke="#94a3b8"
//       strokeWidth={1}
//       strokeDasharray="4 4"
//     />
//   </g>
// );

const CustomReferenceDot = (props: {
  cx: number;
  cy: number;
  fill?: "gold" | undefined;
  icon: string;
}) => {
  const { cx, cy, fill = "gold", icon } = props;

  return (
    <g>
      {/* Glow ring */}
      <circle cx={cx} cy={cy} r="10" fill={fill} opacity="0.4">
        <animate
          attributeName="r"
          from="10"
          to="22"
          dur="1.6s"
          repeatCount="indefinite"
        />
        <animate
          attributeName="opacity"
          from="0.4"
          to="0"
          dur="1.6s"
          repeatCount="indefinite"
        />
      </circle>

      {/* Inner solid circle */}
      <circle cx={cx} cy={cy} r="10" fill={fill}>
        <Icon icon={icon} className="text-2xl text-red-500" />
      </circle>

      {/* Icon at center */}
      <foreignObject
        x={cx - 8}
        y={cy - 8}
        width={16}
        height={16}
        style={{ pointerEvents: "none" }}
      >
        <Icon icon={icon} className="text-2xl text-red-500" />
      </foreignObject>
    </g>
  );
};

const ChartPanel = ({ DATA, OHLCV, SERIES }: ChartProps) => {
  const [activeLine, setActiveLine] = useState<string | null>(null);
  const [crosshairPos, setCrosshairPos] = useState<{
    x: number;
    y: number;
  } | null>(null);
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

    setCrosshairPos({ x: xRel, y: yRel });

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

  const onMouseMoveOverlay = (e: MouseEvent) => {
    handlePointer(e.clientX, e.clientY);
  };

  const onTouchMoveOverlay = (e: TouchEvent) => {
    const touch = e.touches[0];
    if (!touch) return;
    handlePointer(touch.clientX, touch.clientY);
  };

  const onLeaveOverlay = () => setHover(hover);

  useEffect(() => {
    window.addEventListener("mousemove", onMouseMoveOverlay);
    window.addEventListener("mouseleave", onLeaveOverlay);
    window.addEventListener("touchmove", onTouchMoveOverlay);
    window.addEventListener("touchend", onLeaveOverlay);

    return () => {
      window.removeEventListener("mousemove", onMouseMoveOverlay);
      window.removeEventListener("mouseleave", onLeaveOverlay);
      window.removeEventListener("touchmove", onTouchMoveOverlay);
      window.removeEventListener("touchend", onLeaveOverlay);
    };
  }, []);

  return (
    <div className="w-full flex flex-col lg:flex-row gap-6 items-start">
      <div
        ref={chartWrapperRef}
        className="flex-1 relative bg-white rounded-xl md:px-4 px-0 py-4 shadow-sm"
        style={{ minHeight: 320 }}
      >
        <h3 className="text-center text-sm tracking-wider font-bold select-none">
          AVERAGE TOTAL ACCOUNT VALUE
        </h3>

        <div className="w-full h-[300px] sm:h-[380px] md:h-[460px] lg:h-[520px]">
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

                {crosshairPos && (
                  <div className="pointer-events-none absolute inset-0 z-50">
                    {/* Vertical line */}
                    <div
                      className="absolute top-0 w-px h-full bg-slate-400"
                      style={{
                        left: crosshairPos.x + "px",
                        opacity: 0.8,
                      }}
                    />

                    {/* Horizontal line */}
                    <div
                      className="absolute left-0 h-px w-full bg-slate-400"
                      style={{
                        top: crosshairPos.y + "px",
                        opacity: 0.8,
                      }}
                    />
                  </div>
                )}

                {/* <Tooltip
                  cursor={{ stroke: "#94a3b8", strokeWidth: 1 }}
                  content={(props) => <CustomTooltip {...props} />}
                /> */}

                <Tooltip
                  cursor={{ stroke: "#94a3b8", strokeWidth: 1 }}
                  content={(props) => (
                    <CustomTooltip {...props} activeLine={activeLine} />
                  )}
                />

                {SERIES.map((s) => (
                  <React.Fragment key={s.key}>
                    {/* Background faint line */}
                    <Line
                      type="linear"
                      dataKey={s.key}
                      stroke={s.color}
                      strokeWidth={8}
                      dot={false}
                      opacity={0.06}
                      isAnimationActive={false}
                      pointerEvents="none"
                    />

                    {/* MAIN INTERACTIVE LINE */}
                    {/* <Line
                      type="linear"
                      dataKey={s.key}
                      stroke={s.color}
                      strokeWidth={
                        activeLine === s.key
                          ? 4
                          : idx === 0 || s.key === "deepseek"
                          ? 3
                          : 2
                      }
                      opacity={activeLine === s.key ? 1 : 0.4}
                      dot={false}
                      isAnimationActive={true}
                      activeDot={{
                        r: activeLine === s.key ? 6 : 0,
                        style: { transition: "0.2s" },
                        tabIndex: 0, // enables focus
                      }}
                      onMouseEnter={() => setActiveLine(s.key)}
                      onMouseLeave={() => setActiveLine(null)}
                      onClick={() => setActiveLine(s.key)}
                    /> */}

                    <Line
                      type="linear"
                      dataKey={s.key}
                      stroke={s.color}
                      strokeWidth={activeLine === s.key ? 4 : 2}
                      opacity={activeLine === s.key ? 1 : 0.4}
                      dot={false}
                      activeDot={{ r: 6 }}
                      onMouseEnter={() => setActiveLine(s.key)}
                      onMouseLeave={() => setActiveLine(null)}
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
                    shape={CustomReferenceDot}
                    label={{
                      value: `$${formatMoney(p.value)}`,
                      position: "right",
                      fill: p.color,
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

                {crosshairPos && (
                  <div className="pointer-events-none absolute inset-0 z-50">
                    {/* Vertical line */}
                    <div
                      className="absolute top-0 w-px h-full bg-slate-400"
                      style={{
                        left: crosshairPos.x + "px",
                        opacity: 0.8,
                      }}
                    />

                    {/* Horizontal line */}
                    <div
                      className="absolute left-0 h-px w-full bg-slate-400"
                      style={{
                        top: crosshairPos.y + "px",
                        opacity: 0.8,
                      }}
                    />
                  </div>
                )}

                <Tooltip
                  cursor={{ stroke: "#94a3b8", strokeWidth: 1 }}
                  content={(props) => <CustomTooltip {...props} />}
                  // content={<CustomTooltip />}
                />

                <Bar dataKey="volume" barSize={14} fill="#222" opacity={0.06} />

                <Customized component={<RenderCandles />} />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>

        {/* 1. POINTER CAPTURE LAYER — sits UNDER overlay, OVER the chart */}
        {/* <div
          onMouseMove={onMouseMoveOverlay}
          onMouseLeave={onLeaveOverlay}
          onTouchMove={onTouchMoveOverlay}
          onTouchEnd={onLeaveOverlay}
          className="absolute inset-0 z-30"
          style={{
            touchAction: "none",
            background: "transparent",
            pointerEvents: "auto", // IMPORTANT
          }}
        /> */}

        <div
          className="absolute inset-0 z-30"
          style={{
            pointerEvents: "none",
            background: "transparent",
            touchAction: "none",
          }}
        />

        {/* 2. CROSSHAIR OVERLAY — sits ABOVE everything, but doesn't block */}
        {crosshairPos && (
          <div className="absolute inset-0 z-50 pointer-events-none">
            {/* Vertical line */}
            <div
              className="absolute top-0 w-px h-full bg-slate-400"
              style={{
                left: crosshairPos.x + "px",
                opacity: 0.8,
              }}
            />

            {/* Horizontal line */}
            <div
              className="absolute left-0 h-px w-full bg-slate-400"
              style={{
                top: crosshairPos.y + "px",
                opacity: 0.8,
              }}
            />
          </div>
        )}

        <div className="mt-3 flex flex-wrap items-center gap-3 px-4 md:px-1">
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

      {/* SIDEBAR */}

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
