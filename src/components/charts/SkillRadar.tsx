"use client";

import { PolarAngleAxis, PolarGrid, Radar, RadarChart, ResponsiveContainer, Tooltip } from "recharts";

interface SkillRadarProps {
  data: { skill: string; current: number; required: number }[];
  height?: number;
}

export default function SkillRadar({ data, height = 260 }: SkillRadarProps) {
  return (
    <div style={{ height }} className="w-full">
      <ResponsiveContainer width="100%" height="100%">
        <RadarChart data={data} outerRadius="72%" margin={{ top: 8, right: 16, bottom: 8, left: 16 }}>
          <PolarGrid stroke="rgba(255,255,255,0.08)" />
          <PolarAngleAxis dataKey="skill" tick={{ fill: "#a1a1ba", fontSize: 11, fontFamily: "var(--font-manrope)" }} />
          <Tooltip
            cursor={false}
            contentStyle={{
              background: "rgba(16,16,26,0.95)",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: 14,
              fontSize: 12,
              color: "#f3f3f8",
            }}
            formatter={(value, name) => [`${value}%`, name === "current" ? "You" : "Required"]}
          />
          <Radar name="required" dataKey="required" stroke="#22d3ee" strokeDasharray="4 4" fill="#22d3ee" fillOpacity={0.08} animationDuration={1400} />
          <Radar name="current" dataKey="current" stroke="#a78bfa" strokeWidth={2} fill="#8b5cf6" fillOpacity={0.35} animationDuration={1600} />
        </RadarChart>
      </ResponsiveContainer>
    </div>
  );
}
