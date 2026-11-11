import { ReceptionistDashboardView } from '@/features/dashboard';

interface ReceptionistPageProps {
  searchParams?: Promise<{
    doctorId?: string;
  }>;
}

export default async function ReceptionistPage({ searchParams }: ReceptionistPageProps) {
  const params = searchParams ? await searchParams : {};
  return <ReceptionistDashboardView doctorId={params?.doctorId} />;
}
