"use client";

import { useCallback, useRef } from "react";
import * as echarts from "echarts/core";
import { BarChart as EBarChart } from "echarts/charts";
import { GridComponent, TooltipComponent } from "echarts/components";
import { CanvasRenderer } from "echarts/renderers";

echarts.use([EBarChart, GridComponent, TooltipComponent, CanvasRenderer]);

export type GenreFormat = "movie" | "book" | "music";

interface GenreFormatChartProps {
  data: { genre: string; count: number }[];
  format: GenreFormat;
}

const FORMAT_TONE: Record<
  GenreFormat,
  { fill: string; track: string; dark: string }
> = {
  movie: { fill: "#f59e0b", track: "#fef3c7", dark: "#451a03" },
  book: { fill: "#10b981", track: "#d1fae5", dark: "#022c22" },
  music: { fill: "#f43f5e", track: "#ffe4e6", dark: "#4c0519" },
};

/**
 * Compact per-format horizontal bar chart. Renders up to 5 genres for one
 * content type. Removes legend, stacking, and per-bar labels — each card
 * is self-contained and color-coded so the dashboard reads as three small
 * comparable charts rather than a single dense one.
 */
const GenreFormatChart = ({ data, format }: GenreFormatChartProps) => {
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

      const tone = FORMAT_TONE[format];
      const max = Math.max(...data.map((d) => d.count), 1);

      chart.setOption({
        grid: { left: 0, right: 28, top: 4, bottom: 4, containLabel: true },
        tooltip: {
          trigger: "item",
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
          formatter: (params: { name: string; value: number }) =>
            `${params.name}<br/><strong>${params.value}</strong> pick${params.value === 1 ? "" : "s"}`,
        },
        xAxis: { type: "value", show: false, max },
        yAxis: {
          type: "category",
          inverse: true,
          data: data.map((d) => d.genre),
          axisTick: { show: false },
          axisLine: { show: false },
          axisLabel: {
            color: isDark ? "#cbd5e1" : "#334155",
            fontSize: 11,
            fontWeight: 600,
          },
        },
        series: [
          {
            type: "bar",
            barWidth: 10,
            // Render a background track so empty space reads as "0 of max"
            // not "missing data".
            showBackground: true,
            backgroundStyle: {
              color: isDark ? "rgba(148,163,184,0.10)" : tone.track,
              borderRadius: 6,
            },
            itemStyle: { color: tone.fill, borderRadius: 6 },
            data: data.map((d) => d.count),
            label: {
              show: true,
              position: "right",
              formatter: (params: { value: number }) => `${params.value}`,
              color: isDark ? "#94a3b8" : "#64748b",
              fontSize: 10,
              fontWeight: 700,
            },
          },
        ],
        animationDuration: 500,
        animationEasing: "cubicOut",
      });

      const handleResize = () => chart.resize();
      window.addEventListener("resize", handleResize);

      return () => {
        window.removeEventListener("resize", handleResize);
      };
    },
    [data, format],
  );

  const height = Math.max(140, data.length * 28 + 24);
  return <div ref={initChart} style={{ height }} className="w-full" />;
};

export default GenreFormatChart;
