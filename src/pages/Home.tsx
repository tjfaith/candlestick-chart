import { ChartPanel } from "@/components";
import { DATA, OHLCV, SERIES } from "@/data/chartData.ts";

const Home = () => {
  return (
    <div className="p-6 min-h-screen bg-gray-50">
      <h1 className="text-2xl font-bold mb-4">OHLCV Candlestick Chart</h1>
      <ChartPanel DATA={DATA} OHLCV={OHLCV} SERIES={SERIES} />
    </div>
  );
};

export default Home;
