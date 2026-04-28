"use client";

import { useCallback, useRef } from "react";
import * as echarts from "echarts/core";
import { BarChart as EBarChart } from "echarts/charts";
import {
  GridComponent,
  LegendComponent,
  TooltipComponent,
} from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([
  EBarChart,
  GridComponent,
  LegendComponent,
  TooltipComponent,
  CanvasRenderer,
]);

interface GenreBarChartProps {
  data: { genre: string; movie: number; book: number; total: number }[];
}

const MOVIE_COLOR = "#6366f1";
const BOOK_COLOR = "#f59e0b";

const GenreBarChart = ({ data }: GenreBarChartProps) => {
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

      const grandTotal = data.reduce((sum, d) => sum + d.total, 0);

      chart.setOption({
        grid: { left: 0, right: 44, top: 36, bottom: 4, containLabel: true },
        legend: {
          show: true,
          top: 4,
          right: 0,
          itemWidth: 10,
          itemHeight: 10,
          itemGap: 14,
          icon: "circle",
          textStyle: {
            color: isDark ? "#94a3b8" : "#64748b",
            fontSize: 11,
            fontWeight: 700,
          },
          data: ["Movies", "Books"],
        },
        tooltip: {
          trigger: "axis",
          axisPointer: { type: "shadow" },
          backgroundColor: isDark
            ? "rgba(15, 23, 42, 0.95)"
            : "rgba(255,255,255,0.95)",
          borderColor: isDark
            ? "rgba(100,116,139,0.3)"
            : "rgba(203,213,225,0.5)",
          textStyle: {
            color: isDark ? "#e2e8f0" : "#334155",
            fontSize: 12,
          },
        },
        xAxis: { type: "value", show: false },
        yAxis: {
          type: "category",
          inverse: true,
          data: data.map((d) => d.genre),
          axisTick: { show: false },
          axisLine: { show: false },
          axisLabel: {
            color: isDark ? "#cbd5e1" : "#334155",
            fontSize: 12,
            fontWeight: 600,
          },
        },
        series: [
          {
            name: "Movies",
            type: "bar",
            stack: "total",
            barWidth: 14,
            itemStyle: { color: MOVIE_COLOR, borderRadius: 4 },
            data: data.map((d) => d.movie),
          },
          {
            name: "Books",
            type: "bar",
            stack: "total",
            barWidth: 14,
            itemStyle: { color: BOOK_COLOR, borderRadius: 4 },
            data: data.map((d) => d.book),
            label: {
              show: true,
              position: "right",
              formatter: (params: { dataIndex: number }) => {
                const d = data[params.dataIndex];
                const pct = grandTotal
                  ? Math.round((d.total / grandTotal) * 100)
                  : 0;
                return `${pct}%`;
              },
              color: isDark ? "#94a3b8" : "#64748b",
              fontSize: 11,
              fontWeight: 700,
            },
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

  const height = Math.max(180, data.length * 32 + 50);

  return <div ref={initChart} style={{ height }} className="w-full" />;
};

export default GenreBarChart;
