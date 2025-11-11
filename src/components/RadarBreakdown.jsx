import { memo } from "react";
// ⚠️ importiamo Recharts dentro il chunk lazy
import {
  Radar,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  ResponsiveContainer,
  Tooltip,
} from "recharts";

function RadarBreakdown({ data }) {
  return (
    <div className="h-80 w-full">
      <ResponsiveContainer>
        <RadarChart data={data}>
          <PolarGrid />
          <PolarAngleAxis dataKey="level" />
          <Tooltip />
          <Radar name="Items" dataKey="count" fillOpacity={0.35} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}

export default memo(RadarBreakdown);
