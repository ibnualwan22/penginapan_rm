import DashboardStats from "@/components/dashboard/DashboardStats";
import DashboardCharts from "@/components/dashboard/DashboardCharts";
import RoomCard from "@/components/RoomCard";
import prisma from "@/lib/prisma";
import { getServerSession } from "next-auth";
import { authOptions } from "@/app/api/auth/[...nextauth]/route";
import PropertyFilter from "@/components/dashboard/PropertyFilter";

async function getFilteredRooms(selectedPropertyId?: string | null) {
  const session = await getServerSession(authOptions);

  const managedPropertyIds =
    session?.user?.managedProperties?.map((p) => p.id) || [];

  if (managedPropertyIds.length === 0) return [];

  const propertyFilter = selectedPropertyId
    ? [selectedPropertyId]
    : managedPropertyIds;

  return prisma.room.findMany({
    where: {
      propertyId: { in: propertyFilter },
    },
    orderBy: { roomNumber: "asc" },
    include: {
      bookings: {
        where: { checkOut: null },
        select: {
          id: true,
          guestName: true,
          studentName: true,
          expectedCheckOut: true,
        },
      },
      property: true,
    },
  });
}

export default async function AdminDashboardPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const session = await getServerSession(authOptions);
  const userPermissions = session?.user?.permissions || [];
  const canViewCharts = userPermissions.includes(
    "dashboard:read:statistics"
  );
  const managedProperties = session?.user?.managedProperties || [];

  const params = await searchParams;
  const selectedPropertyId = params?.propertyId as string | undefined;

  const rooms = await getFilteredRooms(selectedPropertyId);

  return (
    <div>
      {/* HEADER */}
      <div className="flex flex-col gap-4 md:flex-row md:justify-between md:items-center mb-6">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <PropertyFilter properties={managedProperties} />
      </div>

      {/* STATS */}
      <DashboardStats propertyId={selectedPropertyId} />

      {/* CHART */}
      {canViewCharts && (
        <div className="mt-6">
          <DashboardCharts propertyId={selectedPropertyId} />
        </div>
      )}

      {/* ROOM STATUS */}
      <div>
        <h2 className="text-xl font-bold mt-8 mb-4">Status Kamar</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-3 md:gap-4">
          {rooms.map((room) => (
            <RoomCard key={room.id} room={room} />
          ))}
        </div>
      </div>
    </div>
  );
}
