'use client';

import { useEffect, useState, useMemo } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

import {
  ResponsiveContainer,
  AreaChart, Area,
  BarChart, Bar,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend,
} from 'recharts';

type Row = {
  date: string;
  Pemasukan?: number;
  'Kamar Disewa'?: number;
};

const currency = (n: number) => `Rp ${new Intl.NumberFormat('id-ID').format(n)}`;

function NoData({ text }: { text: string }) {
  return (
    <div className="flex h-72 items-center justify-center text-muted-foreground">
      {text}
    </div>
  );
}

// Tooltip untuk BarChart "Kamar Disewa"
function BarTooltip({ active, payload, label }: any) {
  if (!active || !payload?.length) return null;
  const p = payload[0];
  return (
    <div className="rounded-md border bg-background p-2 text-sm shadow">
      <div className="flex items-center justify-between gap-8">
        <p className="text-muted-foreground">{label}</p>
      </div>
      <div className="mt-1 flex items-center justify-between gap-8">
        <p className="text-muted-foreground">{p.name}</p>
        <p className="font-medium">{p.value}</p>
      </div>
    </div>
  );
}

export default function DashboardCharts() {
  const [chartData, setChartData] = useState<Row[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 7)),
    to: new Date(),
  });

  const fetchData = async (range: DateRange | undefined) => {
    setIsLoading(true);
    let url = '/api/dashboard/charts';
    if (range?.from && range?.to) {
      url += `?from=${range.from.toISOString()}&to=${range.to.toISOString()}`;
    }
    const res = await fetch(url);
    const data = await res.json();
    setChartData(data as Row[]);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData(date);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const hasData = chartData.length > 0;

  // Agar referensi data stabil (opsional)
  const dataMemo = useMemo(() => chartData, [chartData]);

  return (
    <div className="space-y-6 mt-8">
      <div className="flex items-center justify-between">
        <h2 className="text-xl font-bold">Statistik Pendapatan</h2>
        <div className="flex items-center gap-2">
          <Popover>
            <PopoverTrigger asChild>
              <Button variant="outline">
                <CalendarIcon className="mr-2 h-4 w-4" />
                {date?.from ? (
                  date.to
                    ? `${format(date.from, 'LLL dd, y')} - ${format(date.to, 'LLL dd, y')}`
                    : format(date.from, 'LLL dd, y')
                ) : (
                  <span>Pilih tanggal</span>
                )}
              </Button>
            </PopoverTrigger>
            <PopoverContent className="w-auto p-0" align="end">
              <Calendar
                initialFocus
                mode="range"
                defaultMonth={date?.from}
                selected={date}
                onSelect={setDate}
                numberOfMonths={2}
              />
            </PopoverContent>
          </Popover>
          <Button onClick={() => fetchData(date)}>Filter</Button>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Area: Pemasukan */}
        <Card>
          <CardHeader>
            <CardTitle>Pemasukan</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {isLoading ? (
              <NoData text="Memuat..." />
            ) : !hasData ? (
              <NoData text="Tidak ada data" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <AreaChart data={dataMemo}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis
                    width={100}            // ruang angka
                    tickFormatter={(v) => currency(Number(v))}
                  />
                  <Tooltip
                    formatter={(value: number, name: string) =>
                      [currency(value), name]
                    }
                  />
                  {/* warna default; bisa disetel via className/tailwind bila perlu */}
                  <Area type="monotone" dataKey="Pemasukan" />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Bar: Kamar Disewa */}
        <Card>
          <CardHeader>
            <CardTitle>Kamar Disewa</CardTitle>
          </CardHeader>
          <CardContent className="h-72">
            {isLoading ? (
              <NoData text="Memuat..." />
            ) : !hasData ? (
              <NoData text="Tidak ada data" />
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={dataMemo}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis allowDecimals={false} />
                  <Tooltip content={<BarTooltip />} />
                  {/* legend dimatikan → tidak dirender */}
                  <Bar dataKey="Kamar Disewa" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
