import React from 'react';
import { Typography } from 'antd';

interface LineChartProps {
    data: { [key: string]: any }[] | null | undefined;
    series: { key: string; label: string; color: string }[];
}

const LineChart: React.FC<LineChartProps> = ({ data, series }) => {
    if (!data || data.length < 2) {
        return <div className="h-64 flex items-center justify-center text-gray-400 border rounded-lg">Not enough data to draw a chart.</div>;
    }

    const allValues = series.flatMap(s => data.map(d => d[s.key] as number));
    const maxValue = Math.max(...allValues, 0) || 1; // Avoid division by zero
    const width = 500;
    const height = 256;
    const padding = 30;
    const usableWidth = width - 2 * padding;
    const usableHeight = height - 2 * padding;
    
    const pointsToPath = (points: { x: number; y: number }[]) => {
        if (points.length === 0) return '';
        const command = (point: { x: number; y: number }, i: number) => {
            const [x, y] = [point.x, point.y];
            return i === 0 ? `M ${x},${y}` : `L ${x},${y}`;
        };
        return points.map(command).join(' ');
    };

    return (
        <div>
            <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-64">
                {/* Y-axis lines and labels */}
                {[...Array(5)].map((_, i) => {
                    const y = height - padding - (i * usableHeight / 4);
                    const value = (maxValue / 4) * i;
                    return (
                        <g key={i}>
                            <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="#e5e7eb" strokeWidth="1" />
                            <text x={padding - 5} y={y + 3} textAnchor="end" fontSize="10" fill="#9ca3af">{Math.round(value)}</text>
                        </g>
                    )
                })}

                {/* X-axis labels */}
                 {data.map((d, i) => {
                    const x = padding + (i * usableWidth) / (data.length - 1);
                    return (
                       <text key={i} x={x} y={height - padding + 15} textAnchor="middle" fontSize="10" fill="#9ca3af">
                           {new Date(d.date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                       </text>
                    )
                })}

                {/* Data Lines */}
                {series.map(s => {
                    const points = data.map((d, i) => ({
                        x: padding + (i * usableWidth) / (data.length - 1),
                        y: height - padding - (maxValue > 0 ? ((d[s.key] as number) / maxValue) * usableHeight : 0),
                    }));
                    return (
                        <path key={s.key} d={pointsToPath(points)} stroke={s.color} fill="none" strokeWidth="2" strokeLinecap="round" />
                    )
                })}
            </svg>
            <div className="flex justify-center space-x-4 mt-2">
                {series.map(s => (
                    <div key={s.key} className="flex items-center text-xs">
                        <div className="w-3 h-3 rounded-full mr-2" style={{ backgroundColor: s.color }}></div>
                        <span>{s.label}</span>
                    </div>
                ))}
            </div>
        </div>
    );
};
export default LineChart;
