"use client";

import {
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
  Legend,
  Tooltip,
} from "recharts";

interface StatusData {
  status: string;
  count: number;
  color: string;
}

interface StatusChartProps {
  data: StatusData[];
}

const statusLabels: Record<string, string> = {
  AUTHORIZED: "Autorizada",
  REJECTED: "Rejeitada",
  CANCELED: "Cancelada",
  CREATED: "Criada",
  ERROR: "Erro",
};

export function StatusChart({ data }: StatusChartProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex items-center justify-center h-[100px] text-sm text-muted-foreground">
        Nenhum dado disponível
      </div>
    );
  }

  const chartData = data.map((item) => ({
    name: statusLabels[item.status] || item.status,
    value: item.count,
    color: item.color,
  }));

  return (
    <div className="flex items-center gap-4">
      <ResponsiveContainer width={100} height={100}>
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={25}
            outerRadius={45}
            paddingAngle={2}
            dataKey="value"
          >
            {chartData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={entry.color} />
            ))}
          </Pie>
          <Tooltip formatter={(value: number, name: string) => [value, name]} />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap gap-2">
        {chartData.map((entry, index) => (
          <div key={index} className="flex items-center gap-1 text-xs">
            <div
              className="w-3 h-3 rounded-full"
              style={{ backgroundColor: entry.color }}
            />
            <span>
              {entry.name}: <strong>{entry.value}</strong>
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}
