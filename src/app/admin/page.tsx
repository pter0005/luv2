import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { removeAdminSession } from './admin-auth-actions'; // Ajuste o caminho se necessário
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { 
  Users, 
  FileText, 
  DollarSign, 
  LogOut, 
  Calendar, 
  Mail, 
  ExternalLink,
  ShieldCheck
} from 'lucide-react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import Link from 'next/link';

// Função para formatar dinheiro
const formatCurrency = (value: number) => {
  return new Intl.NumberFormat('pt-BR', { style: 'currency', currency: 'BRL' }).format(value);
};

async function getAdminData() {
  const db = getAdminFirestore();
  
  // 1. Buscar todos os usuários para ter o mapa de ID -> Email
  const usersSnapshot = await db.collection('users').get();
  const userMap = new Map<string, any>();
  
  usersSnapshot.forEach(doc => {
    const data = doc.data();
    // Guardamos o email e a foto (se tiver) usando o ID do usuário como chave
    userMap.set(doc.id, { 
      email: data.email || 'Email não informado',
      name: data.name || 'Sem nome',
      photoUrl: data.photoUrl
    });
  });

  // 2. Buscar todas as páginas (Vendas)
  const pagesSnapshot = await db.collection('lovepages').orderBy('createdAt', 'desc').get();
  
  let avancadoCount = 0;
  let basicoCount = 0;
  
  // Lista detalhada para a tabela
  const detailedSales = pagesSnapshot.docs.map(doc => {
    const data = doc.data();
    
    // Contagem
    if (data.plan === 'avancado') avancadoCount++;
    else if (data.plan === 'basico') basicoCount++;

    // Tenta encontrar o dono da página no nosso mapa de usuários
    const owner = userMap.get(data.userId);

    // Data de criação
    const createdAtDate = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();

    return {
      id: doc.id,
      slug: data.slug || doc.id, // O link da página
      plan: data.plan || 'gratis',
      price: data.plan === 'avancado' ? 24.90 : (data.plan === 'basico' ? 19.90 : 0),
      createdAt: createdAtDate,
      ownerEmail: owner?.email || 'Usuário deletado/não achado',
      ownerName: owner?.name,
      status: data.status || 'ativo'
    };
  });

  const totalSales = (avancadoCount * 24.90) + (basicoCount * 19.90);

  return {
    stats: {
      totalUsers: usersSnapshot.size,
      totalPages: pagesSnapshot.size,
      totalSales,
      avancadoCount,
      basicoCount
    },
    sales: detailedSales
  };
}

export default async function AdminDashboard() {
  const { stats, sales } = await getAdminData();

  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      {/* HEADER */}
      <header className="bg-card border-b border-border mb-8 sticky top-0 z-10">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary/20 p-2 rounded-full">
                <ShieldCheck className="w-5 h-5 text-primary" />
            </div>
            <h1 className="text-xl font-bold">Painel Administrativo</h1>
          </div>
          <form action={removeAdminSession}>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-500">
              <LogOut className="h-4 w-4 mr-2" />
              Sair
            </Button>
          </form>
        </div>
      </header>

      <main className="container mx-auto px-4 space-y-8">
        
        {/* CARDS SUPERIORES (KPIs) */}
        <div className="grid gap-4 md:grid-cols-3">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total de Usuários</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">cadastrados na plataforma</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Páginas Criadas</CardTitle>
              <FileText className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPages}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-purple-400 font-bold">{stats.avancadoCount} Avançados</span> • {stats.basicoCount} Básicos
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Receita Total</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalSales)}</div>
              <p className="text-xs text-muted-foreground">Estimativa bruta</p>
            </CardContent>
          </Card>
        </div>

        {/* TABELA DE VENDAS DETALHADA */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center">
                <h2 className="text-lg font-bold">Histórico de Vendas & Páginas</h2>
                <span className="text-xs bg-secondary text-secondary-foreground px-3 py-1 rounded-full">
                    {sales.length} registros
                </span>
            </div>
            
            <div className="overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                        <tr>
                            <th className="px-6 py-4 font-medium">Usuário / Email</th>
                            <th className="px-6 py-4 font-medium">Plano</th>
                            <th className="px-6 py-4 font-medium">Valor</th>
                            <th className="px-6 py-4 font-medium">Data da Compra</th>
                            <th className="px-6 py-4 font-medium text-right">Ação</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-border">
                        {sales.map((sale) => (
                            <tr key={sale.id} className="hover:bg-muted/30 transition-colors">
                                <td className="px-6 py-4">
                                    <div className="flex flex-col">
                                        <span className="font-medium text-foreground">{sale.ownerEmail}</span>
                                        <span className="text-xs text-muted-foreground">ID: {sale.id.slice(0, 8)}...</span>
                                    </div>
                                </td>
                                <td className="px-6 py-4">
                                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize
                                        ${sale.plan === 'avancado' ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' : 
                                          sale.plan === 'basico' ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' : 
                                          'bg-gray-500/10 text-gray-500'}`}>
                                        {sale.plan}
                                    </span>
                                </td>
                                <td className="px-6 py-4 font-mono">
                                    {sale.price > 0 ? (
                                        <span className="text-green-500 font-bold">{formatCurrency(sale.price)}</span>
                                    ) : (
                                        <span className="text-muted-foreground">R$ 0,00</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-3 h-3" />
                                        {format(sale.createdAt, "dd 'de' MMM, HH:mm", { locale: ptBR })}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right">
                                    <Button asChild variant="outline" size="sm" className="h-8">
                                        <Link href={`/p/${sale.slug}`} target="_blank">
                                            Ver Página <ExternalLink className="w-3 h-3 ml-2" />
                                        </Link>
                                    </Button>
                                </td>
                            </tr>
                        ))}
                        {sales.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                                    Nenhuma venda ou página encontrada.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>

      </main>
    </div>
  );
}
