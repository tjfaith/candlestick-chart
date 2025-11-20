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
      key2: s.key2,
      value: last?.[s.key],
      color: s.color,
      label: s.label,
    }));
  }, [DATA, SERIES]);

  const handlePointer = (clientX: number, clientY: number) => {
    const wrap = chartWrapperRef.current;
    if (!wrap) return;

    const rect = wrap.getBoundingClientRect();

    // chart margins (must match your <ComposedChart margin={...} />)
    const LEFT = 24;
    const RIGHT = 120;

    // raw relative positions
    const rawX = clientX - rect.left;
    const rawY = clientY - rect.top;

    // clamp inside wrapper
    const xRel = Math.min(Math.max(0, rawX), rect.width);
    const yRel = Math.min(Math.max(0, rawY), rect.height);

    setCrosshairPos({ x: xRel, y: yRel });

    // -------------------------------
    // REAL FIX: account for margins
    // -------------------------------
    const plotWidth = rect.width - LEFT - RIGHT;

    // X inside the plotted chart area
    const xInsidePlot = Math.min(plotWidth, Math.max(0, rawX - LEFT));

    const xRatio = plotWidth <= 0 ? 0 : xInsidePlot / plotWidth;
    // -------------------------------

    const source = mode === "line" ? DATA : OHLCV;
    if (!source || source.length === 0) return;

    const index = Math.round(xRatio * (source.length - 1));

    const idx = Math.max(0, Math.min(source.length - 1, index));

    // LINE MODE
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

      return;
    }

    // OHLCV MODE
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

    console.log(hover, "hover data...");
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
  }, [mode]);

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

                <Tooltip
                  cursor={{ stroke: "#94a3b8", strokeWidth: 1 }}
                  content={(props) => (
                    <CustomTooltip {...props} activeLine={activeLine} />
                  )}
                />

                {SERIES.map((s) => (
                  <React.Fragment key={s.key + "-group"}>
                    <Line
                      key={`${s.key}-background`}
                      type="linear"
                      dataKey={s.key2}
                      name={`${s.key}-bg`}
                      stroke={s.color}
                      strokeWidth={8}
                      dot={false}
                      activeDot={false}
                      isAnimationActive={false}
                      legendType="none"
                      strokeOpacity={0.06}
                      onMouseEnter={undefined}
                      onMouseLeave={undefined}
                      onMouseMove={undefined}
                      onClick={undefined}
                      pointerEvents="none"
                    />

                    <Line
                      key={`${s.key}-main`}
                      type="linear"
                      dataKey={s.key}
                      name={`${s.key}-main`}
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
                    key={p.key + "-dot"}
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

                <Tooltip
                  cursor={{ stroke: "#94a3b8", strokeWidth: 1 }}
                  content={(props) => <CustomTooltip {...props} />}
                />

                <Bar dataKey="volume" barSize={14} fill="#222" opacity={0.06} />

                <Customized component={<RenderCandles />} />
              </ComposedChart>
            )}
          </ResponsiveContainer>
        </div>

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
            <div
              key={s.key + "-legend"}
              className="flex items-center gap-2 text-xs"
            >
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
                    {Object.entries(hover.values || {}).map(([k, v], index) => (
                      <div key={index} className="flex justify-between">
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
