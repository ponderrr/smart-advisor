"use client";

import { useCallback, useRef } from "react";
import * as echarts from "echarts/core";
import { PieChart as EPieChart } from "echarts/charts";
import {
  TooltipComponent,
  LegendComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([EPieChart, TooltipComponent, LegendComponent, CanvasRenderer]);

interface GenrePieChartProps {
  data: { genre: string; total: number }[];
}

const GenrePieChart = ({ data }: GenrePieChartProps) => {
  const chartInstanceRef = useRef<echarts.ECharts | null>(null);

  const initChart = useCallback(
    (node: HTMLDivElement | null) => {
      if (chartInstanceRef.current) {
        chartInstanceRef.current.dispose();
        chartInstanceRef.current = null;
      }
      if (!node || data.length === 0) return;

      const isDark = document.documentElement.classList.contains("dark");
      const chart = echarts.init(node);
      chartInstanceRef.current = chart;

      const palette = [
        "#6366f1", "#22c55e", "#f59e0b", "#ec4899",
        "#06b6d4", "#f97316", "#8b5cf6", "#14b8a6",
      ];

      chart.setOption({
        tooltip: {
          trigger: "item",
          backgroundColor: isDark ? "rgba(15, 23, 42, 0.95)" : "rgba(255,255,255,0.95)",
          borderColor: isDark ? "rgba(100,116,139,0.3)" : "rgba(203,213,225,0.5)",
          textStyle: { color: isDark ? "#e2e8f0" : "#334155", fontSize: 12 },
          formatter: "{b}: {c} ({d}%)",
        },
        legend: {
          orient: "vertical",
          right: 12,
          top: "center",
          textStyle: { color: isDark ? "#94a3b8" : "#64748b", fontSize: 14, fontWeight: 500 },
          itemWidth: 14,
          itemHeight: 14,
          itemGap: 14,
        },
        series: [
          {
            type: "pie",
            radius: ["40%", "70%"],
            center: ["35%", "50%"],
            avoidLabelOverlap: true,
            itemStyle: {
              borderRadius: 6,
              borderColor: isDark ? "#0f172a" : "#ffffff",
              borderWidth: 2,
            },
            label: { show: false },
            emphasis: {
              label: { show: true, fontSize: 13, fontWeight: "bold", color: isDark ? "#e2e8f0" : "#334155" },
              itemStyle: { shadowBlur: 10, shadowOffsetX: 0, shadowColor: "rgba(0, 0, 0, 0.2)" },
            },
            data: data.map((d, i) => ({
              name: d.genre,
              value: d.total,
              itemStyle: { color: palette[i % palette.length] },
            })),
          },
        ],
        animationDuration: 600,
        animationEasing: "cubicOut",
      });

      const handleResize = () => chart.resize();
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
      };
    },
    [data],
  );

  return <div ref={initChart} className="h-72 w-full" />;
};

export default GenrePieChart;
