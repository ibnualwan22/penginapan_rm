'use client';

import { usePathname, useRouter, useSearchParams } from 'next/navigation';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';

type ManagedProperty = {
  id: string;
  name: string;
}

export default function PropertyFilter({ properties }: { properties: ManagedProperty[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const currentPropertyId = searchParams.get('propertyId') || 'all';

  const handleFilterChange = (propertyId: string) => {
    const params = new URLSearchParams(searchParams);
    if (propertyId === 'all') {
      params.delete('propertyId');
    } else {
      params.set('propertyId', propertyId);
    }
    router.replace(`${pathname}?${params.toString()}`);
  };

  // Hanya tampilkan filter jika ada lebih dari satu properti untuk dipilih
  if (properties.length <= 1) {
    return null;
  }

  return (
    <div className="flex items-center space-x-2">
      <label className="text-sm font-medium">Tampilkan Data:</label>
      <Select value={currentPropertyId} onValueChange={handleFilterChange}>
        <SelectTrigger className="w-[200px]">
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="all">Semua Properti</SelectItem>
          {properties.map(prop => (
            <SelectItem key={prop.id} value={prop.id}>{prop.name}</SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  );
}