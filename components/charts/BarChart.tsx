import React from 'react';
import { Typography, Tooltip } from 'antd';

interface BarChartProps {
    data: { [key: string]: string | number }[] | null | undefined;
    xKey: string;
    yKey: string;
}

const BarChart: React.FC<BarChartProps> = ({ data, xKey, yKey }) => {
    if (!data || data.length === 0) {
        return <div className="flex items-center justify-center h-64 text-gray-400">No data available</div>;
    }

    const maxValue = Math.max(...data.map(d => d[yKey] as number), 0);

    return (
        <div className="flex justify-around items-end h-64 p-4 pt-8 space-x-2 border-l border-b border-gray-200 relative">
            {/* Y-axis labels */}
            <div className="absolute top-0 left-0 text-xs text-gray-400">
                {maxValue.toLocaleString()}
            </div>
            <div className="absolute bottom-0 left-0 text-xs text-gray-400">0</div>

            {data.map((item, index) => (
                <div key={index} className="flex flex-col items-center flex-1 h-full" style={{minWidth: 0}}>
                    <div className="relative w-full h-full flex items-end justify-center">
                         <Tooltip title={`${item[xKey]}: ${(item[yKey] as number).toLocaleString()}`}>
                            <div 
                                className="bg-blue-500 w-3/4 rounded-t-md hover:bg-blue-600 transition-colors"
                                style={{ height: `${maxValue > 0 ? ((item[yKey] as number) / maxValue) * 100 : 0}%` }}
                            />
                        </Tooltip>
                    </div>
                     <Typography.Text type="secondary" className="mt-2 text-xs text-center truncate w-full" title={item[xKey] as string}>
                        {item[xKey]}
                    </Typography.Text>
                </div>
            ))}
        </div>
    );
};

export default BarChart;
