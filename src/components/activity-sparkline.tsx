"use client";

interface ActivitySparklineProps {
  data: number[];
  className?: string;
  strokeColor?: string;
  fillColor?: string;
}

const ActivitySparkline = ({
  data,
  className,
  strokeColor = "#6366f1",
  fillColor = "rgba(99, 102, 241, 0.18)",
}: ActivitySparklineProps) => {
  const width = 200;
  const height = 48;
  const padX = 2;
  const padY = 4;

  if (data.length === 0) {
    return (
      <svg
        viewBox={`0 0 ${width} ${height}`}
        preserveAspectRatio="none"
        className={className}
        aria-hidden="true"
      />
    );
  }

  const max = Math.max(...data, 1);
  const stepX = data.length > 1 ? (width - padX * 2) / (data.length - 1) : 0;

  const points = data.map((v, i) => {
    const x = padX + i * stepX;
    const y = height - padY - (v / max) * (height - padY * 2);
    return [x, y] as const;
  });

  const linePath = points
    .map(([x, y], i) => `${i === 0 ? "M" : "L"} ${x.toFixed(2)} ${y.toFixed(2)}`)
    .join(" ");

  const areaPath =
    points.length > 1
      ? `${linePath} L ${points[points.length - 1][0].toFixed(2)} ${height} L ${points[0][0].toFixed(2)} ${height} Z`
      : "";

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="none"
      className={className}
      aria-hidden="true"
    >
      {areaPath && <path d={areaPath} fill={fillColor} />}
      <path
        d={linePath}
        fill="none"
        stroke={strokeColor}
        strokeWidth={1.75}
        strokeLinecap="round"
        strokeLinejoin="round"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
};

export default ActivitySparkline;
