"use client";

import {
  Bar,
  BarChart,
  ResponsiveContainer,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
} from "recharts";

interface PeriodData {
  date: string;
  count: number;
  value: number;
}

interface OverviewProps {
  data?: PeriodData[];
}

export function Overview({ data }: OverviewProps) {
  if (!data || data.length === 0) {
    return (
      <div className="flex justify-center items-center h-[350px] text-muted-foreground">
        Nenhum dado disponível para o período.
      </div>
    );
  }

  // Formatar datas para exibição
  const chartData = data.map((item) => ({
    ...item,
    name: new Date(item.date).toLocaleDateString("pt-BR", {
      day: "2-digit",
      month: "short",
    }),
  }));

  return (
    <ResponsiveContainer width="100%" height={350}>
      <BarChart data={chartData}>
        <CartesianGrid
          strokeDasharray="3 3"
          vertical={false}
          stroke="#e5e7eb"
        />
        <XAxis
          dataKey="name"
          stroke="#888888"
          fontSize={11}
          tickLine={false}
          axisLine={false}
        />
        <YAxis
          stroke="#888888"
          fontSize={11}
          tickLine={false}
          axisLine={false}
          tickFormatter={(value) => `R$${value.toLocaleString("pt-BR")}`}
        />
        <Tooltip
          formatter={(value: number, name: string) => {
            if (name === "value")
              return [
                `R$ ${value.toLocaleString("pt-BR", { minimumFractionDigits: 2 })}`,
                "Valor",
              ];
            if (name === "count") return [value, "Notas"];
            return [value, name];
          }}
          labelFormatter={(label) => `Data: ${label}`}
          contentStyle={{
            backgroundColor: "hsl(var(--background))",
            border: "1px solid hsl(var(--border))",
            borderRadius: "8px",
          }}
        />
        <Bar
          dataKey="value"
          fill="hsl(var(--primary))"
          radius={[4, 4, 0, 0]}
          name="value"
        />
      </BarChart>
    </ResponsiveContainer>
  );
}
