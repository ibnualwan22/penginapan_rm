'use client';

import { AreaChart, BarChart, Card, Title } from '@tremor/react';
import { useEffect, useState } from 'react';
import { Button } from '@/components/ui/button';
import { Calendar } from '@/components/ui/calendar';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { format } from 'date-fns';
import { CalendarIcon } from 'lucide-react';
import { DateRange } from 'react-day-picker';

// Komponen custom untuk tooltip
const CustomTooltip = (props: any) => {
    const { payload, active } = props;
    if (!active || !payload) return null;
    const categoryPayload = payload?.[0];
    if (!categoryPayload) return null;
    
    // --- PERBAIKAN DI SINI: Tambahkan 'return' ---
    return (
      <div className="w-56 rounded-tremor-default border border-tremor-border bg-tremor-background p-2 text-tremor-default shadow-tremor-dropdown">
        <div className="flex flex-1 space-x-2.5">
          <div className={`flex w-1.5 flex-col bg-${categoryPayload.color}-500 rounded`} />
          <div className="w-full">
            <div className="flex items-center justify-between space-x-8">
              <p className="whitespace-nowrap text-right text-tremor-content">
                {categoryPayload.payload.date}
              </p>
            </div>
            <div className="flex items-center justify-between space-x-8">
              <p className="whitespace-nowrap text-right text-tremor-content">
                {categoryPayload.name}
              </p>
              <p className="whitespace-nowrap text-right font-medium text-tremor-content-emphasis">
                {categoryPayload.value}
              </p>
            </div>
          </div>
        </div>
      </div>
    );
};


export default function DashboardCharts({ propertyId }: { propertyId?: string | null }) {
  const [chartData, setChartData] = useState([]);
  const [date, setDate] = useState<DateRange | undefined>({
    from: new Date(new Date().setDate(new Date().getDate() - 7)),
    to: new Date(),
  });
  const [isLoading, setIsLoading] = useState(true);

  const fetchData = async (filterDate?: DateRange, propId?: string | null) => {
    setIsLoading(true);
    const params = new URLSearchParams();
    if (filterDate?.from) params.append('from', filterDate.from.toISOString());
    if (filterDate?.to) params.append('to', filterDate.to.toISOString());
    if (propId) params.append('propertyId', propId);
    
    const res = await fetch(`/api/dashboard/charts?${params.toString()}`);
    const data = await res.json();
    setChartData(data);
    setIsLoading(false);
  };

  useEffect(() => {
    fetchData(date, propertyId);
  }, [propertyId]);

  const handleFilterClick = () => {
    fetchData(date, propertyId);
  };

  const currencyFormatter = (number: number) => `Rp ${new Intl.NumberFormat('id-ID').format(number)}`;

  return (
    <div className="space-y-6 mt-8">
      <div className="flex justify-between items-center">
        <h2 className="text-xl font-bold">Statistik Pendapatan</h2>
        <div className="flex items-center space-x-2">
            <Popover>
                <PopoverTrigger asChild>
                    <Button variant="outline">
                        <CalendarIcon className="mr-2 h-4 w-4" />
                        {date?.from ? (date.to ? `${format(date.from, "LLL dd, y")} - ${format(date.to, "LLL dd, y")}`: format(date.from, "LLL dd, y")) : <span>Pilih tanggal</span>}
                    </Button>
                </PopoverTrigger>
                <PopoverContent className="w-auto p-0" align="end">
                    <Calendar initialFocus mode="range" defaultMonth={date?.from} selected={date} onSelect={setDate} numberOfMonths={2} />
                </PopoverContent>
            </Popover>
            <Button onClick={handleFilterClick}>Filter</Button>
        </div>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card>
          <Title>Pemasukan</Title>
          <AreaChart className="h-72 mt-4" data={chartData} index="date" categories={['Pemasukan']} colors={['blue']} valueFormatter={currencyFormatter} noDataText={isLoading ? 'Memuat...' : 'Tidak ada data'} yAxisWidth={100} showLegend={false}/>
        </Card>
        <Card>
          <Title>Kamar Disewa</Title>
          <BarChart className="h-72 mt-4" data={chartData} index="date" categories={['Kamar Disewa']} colors={['green']} noDataText={isLoading ? 'Memuat...' : 'Tidak ada data'} showLegend={false} allowDecimals={false} customTooltip={CustomTooltip}/>
        </Card>
      </div>
    </div>
  );
}