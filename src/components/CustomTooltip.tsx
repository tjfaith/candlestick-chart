// import type { CustomTooltipProps } from "@/types/chart.type";

// const CustomTooltip = ({ active, payload, label }: CustomTooltipProps) => {
//   if (!active || !payload || payload.length === 0) return null;

//   return (
//     <div className="bg-white shadow-lg rounded-md p-2 border text-xs">
//       <div className="font-semibold mb-1">{label}</div>

//       {payload.map((p) => (
//         <div
//           key={p.dataKey}
//           className="flex items-center justify-between gap-2"
//         >
//           <span className="flex items-center gap-2">
//             <span
//               className="inline-block w-2 h-2 rounded-full"
//               style={{ background: p.color || "#999" }}
//             />
//             {p.dataKey}
//           </span>

//           <span>${p.value?.toLocaleString()}</span>
//         </div>
//       ))}
//     </div>
//   );
// };

// export default CustomTooltip;
import type { CustomTooltipProps } from "@/types/chart.type";

const CustomTooltip = ({
  active,
  payload,
  label,
  activeLine,
}: CustomTooltipProps) => {
  if (!active || !payload || payload.length === 0) return null;

  let filtered = payload;

  // Only show the active line if one is selected
  if (activeLine) {
    filtered = payload.filter((p) => p.dataKey === activeLine);
  }

  return (
    <div className="bg-white shadow-lg rounded-md p-2 border text-xs">
      <div className="font-semibold mb-1">{label}</div>

      {filtered.map((p) => (
        <div
          key={p.dataKey}
          className="flex items-center justify-between gap-2"
        >
          <span className="flex items-center gap-2">
            <span
              className="inline-block w-2 h-2 rounded-full"
              style={{ background: p.color || "#999" }}
            />
            {p.dataKey}
          </span>

          <span>${p.value?.toLocaleString()}</span>
        </div>
      ))}
    </div>
  );
};

export default CustomTooltip;
