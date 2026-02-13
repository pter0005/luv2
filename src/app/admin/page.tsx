import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { removeAdminSession } from './admin-auth-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, DollarSign, LogOut } from 'lucide-react';

async function getStats() {
  const db = getAdminFirestore();
  const usersSnapshot = await db.collection('users').get();
  const pagesSnapshot = await db.collection('lovepages').get();
  
  // Para vendas, precisaríamos de uma coleção 'payments' ou algo similar.
  // Por enquanto, vamos simular.
  const totalSales = pagesSnapshot.size * 24.90;

  return {
    totalUsers: usersSnapshot.size,
    totalPages: pagesSnapshot.size,
    totalSales: totalSales,
  };
}

export default async function AdminDashboard() {
  const stats = await getStats();

  return (
    <div className="min-h-screen bg-background text-foreground">
      <header className="bg-card border-b border-border">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <h1 className="text-xl font-bold">Dashboard Admin</h1>
          <form action={removeAdminSession}>
            <Button variant="ghost" size="icon">
              <LogOut className="h-5 w-5" />
              <span className="sr-only">Sair</span>
            </Button>
          </form>
        </div>
      </header>

      <main className="container mx-auto p-4 md:p-8">
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Páginas Criadas</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPages}</div>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Estimada</CardTitle>
              <DollarSign className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">R$ {stats.totalSales.toFixed(2)}</div>
               <p className="text-xs text-muted-foreground">
                Baseado em R$24,90 por página criada
              </p>
            </CardContent>
          </Card>
        </div>

        <div className="mt-8">
            {/* Aqui você pode adicionar mais gráficos e tabelas no futuro */}
        </div>
      </main>
    </div>
  );
}
