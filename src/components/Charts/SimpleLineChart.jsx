import React from 'react';

const SimpleLineChart = ({ data, title, xAxisLabel, yAxisLabel, height = 200 }) => {
  if (!data || data.length === 0) {
    return (
      <div className="h-64 flex items-center justify-center border-2 border-dashed border-gray-300 rounded-lg">
        <div className="text-center">
          <p className="text-gray-500">No data available for {title}</p>
        </div>
      </div>
    );
  }

  // Simple chart implementation - in a real app, you'd use Chart.js, D3, or similar
  const maxValue = Math.max(...data.map(d => d.value));
  const minValue = Math.min(...data.map(d => d.value));
  const range = maxValue - minValue || 1;

  const points = data.map((point, index) => {
    const x = (index / (data.length - 1)) * 100;
    const y = 100 - ((point.value - minValue) / range) * 80; // 80% of height for data
    return `${x},${y}`;
  }).join(' ');

  return (
    <div className="w-full">
      <h5 className="text-md font-medium text-gray-900 mb-4">{title}</h5>
      <div className="bg-gray-50 rounded-lg p-4">
        <div className="relative" style={{ height: `${height}px` }}>
          <svg
            className="w-full h-full"
            viewBox="0 0 100 100"
            preserveAspectRatio="none"
          >
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map(y => (
              <line
                key={y}
                x1="0"
                y1={y}
                x2="100"
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="0.5"
              />
            ))}
            
            {/* Data line */}
            <polyline
              fill="none"
              stroke="#3b82f6"
              strokeWidth="1"
              points={points}
            />
            
            {/* Data points */}
            {data.map((point, index) => {
              const x = (index / (data.length - 1)) * 100;
              const y = 100 - ((point.value - minValue) / range) * 80;
              return (
                <circle
                  key={index}
                  cx={x}
                  cy={y}
                  r="1"
                  fill="#3b82f6"
                />
              );
            })}
          </svg>
          
          {/* Y-axis labels */}
          <div className="absolute left-0 top-0 h-full flex flex-col justify-between text-xs text-gray-500">
            <span>{maxValue.toFixed(1)}</span>
            <span>{((maxValue + minValue) / 2).toFixed(1)}</span>
            <span>{minValue.toFixed(1)}</span>
          </div>
          
          {/* X-axis labels */}
          <div className="absolute bottom-0 left-0 w-full flex justify-between text-xs text-gray-500">
            {data.map((point, index) => (
              <span key={index} className="transform -rotate-45 origin-left">
                {point.label}
              </span>
            ))}
          </div>
        </div>
        
        {/* Legend */}
        <div className="mt-2 flex items-center justify-center">
          <div className="flex items-center space-x-2">
            <div className="w-3 h-3 bg-blue-500 rounded-full"></div>
            <span className="text-sm text-gray-600">{yAxisLabel}</span>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SimpleLineChart;
