"use client";

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/lib/firebase/auth';
import { getAllCalculations, type CalculationDB } from '@/lib/firebase/firestore';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { BarChart, Users } from 'lucide-react';

interface KPI {
  title: string;
  value: string | number;
  icon: React.ReactNode;
}

export default function AdminPage() {
  const { isAdmin, loading } = useAuth();
  const router = useRouter();
  const [calculations, setCalculations] = useState<CalculationDB[]>([]);
  const [kpis, setKpis] = useState<KPI[]>([]);

  useEffect(() => {
    // Only redirect if loading is finished and user is not an admin.
    if (!loading && !isAdmin) {
      router.push('/');
    }
  }, [isAdmin, loading, router]);

  useEffect(() => {
    // Only fetch data if user is confirmed to be an admin.
    if (isAdmin) {
      const unsubscribe = getAllCalculations((allCalculations) => {
        setCalculations(allCalculations);

        // Calculate KPIs
        const totalCalculations = allCalculations.length;
        const totalNetWeight = allCalculations.reduce((acc, calc) => acc + (calc.results.totalNetWeight || 0), 0);
        const totalRevenueMAD = allCalculations
            .filter(c => c.agreedAmountCurrency === 'MAD')
            .reduce((acc, calc) => acc + (calc.agreedAmount || 0), 0);
        const totalRevenueRiyal = allCalculations
            .filter(c => c.agreedAmountCurrency === 'Riyal')
            .reduce((acc, calc) => acc + (calc.agreedAmount || 0), 0);
        const uniqueClients = new Set(allCalculations.map(c => c.clientName)).size;
        
        setKpis([
            { title: 'Total des Calculs', value: totalCalculations, icon: <BarChart className="h-6 w-6 text-blue-500" /> },
            { title: 'Clients Uniques', value: uniqueClients, icon: <Users className="h-6 w-6 text-green-500" /> },
            { title: 'Poids Net Total', value: `${totalNetWeight.toFixed(2)} kg`, icon: <BarChart className="h-6 w-6 text-yellow-500" /> },
            { title: 'Revenu Total (MAD)', value: totalRevenueMAD.toLocaleString('fr-MA', { style: 'currency', currency: 'MAD' }), icon: <BarChart className="h-6 w-6 text-purple-500" /> },
            { title: 'Revenu Total (Riyal)', value: `${totalRevenueRiyal.toLocaleString('fr-MA')} Riyal`, icon: <BarChart className="h-6 w-6 text-red-500" /> },
        ]);
      });

      return () => unsubscribe();
    }
  }, [isAdmin]);

  // Show a loading screen while auth state is being determined.
  if (loading) {
    return (
      <div className="flex h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-lg">Chargement ou vérification des autorisations...</p>
        </div>
      </div>
    );
  }

  // Once loading is complete, if the user is not an admin, they will be redirected.
  // We can render null or a minimal component here as the redirect is happening.
  if (!isAdmin) {
    return null;
  }

  // If loading is complete AND user is an admin, show the dashboard.
  return (
    <div className="min-h-screen bg-gray-100 p-8">
      <header className="mb-8">
        <h1 className="text-4xl font-bold">Tableau de Bord Administrateur</h1>
        <p className="text-gray-600">Vue d'ensemble de l'activité de l'application.</p>
      </header>

      <section className="mb-8">
        <h2 className="text-2xl font-semibold mb-4">Indicateurs Clés de Performance (KPIs)</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
          {kpis.map(kpi => (
            <Card key={kpi.title}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
                {kpi.icon}
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{kpi.value}</div>
              </CardContent>
            </Card>
          ))}
        </div>
      </section>

      <section>
        <h2 className="text-2xl font-semibold mb-4">Gestion des Utilisateurs</h2>
        <Card>
          <CardContent className="p-6">
            <p className="text-gray-500">
              La fonctionnalité de gestion des utilisateurs (attribution de permissions, etc.) sera implémentée ici.
            </p>
          </CardContent>
        </Card>
      </section>
    </div>
  );
}