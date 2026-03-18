import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { removeAdminSession } from './admin-auth-actions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Users, FileText, DollarSign, LogOut, Calendar, ExternalLink, ShieldCheck, Edit, FileWarning, AlertTriangle, CheckCircle, TrendingUp, BarChart2, ImageOff, Gift } from 'lucide-react';
import Link from 'next/link';
import { ActiveUsersWidget } from '@/components/admin/ActiveUsersWidget';
import { cn } from '@/lib/utils';

export const dynamic = 'force-dynamic';

const formatCurrency = (value: number, currency: 'BRL' | 'USD') => {
  const locale = currency === 'BRL' ? 'pt-BR' : 'en-US';
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
};

const formatDate = (date: Date) => {
    return new Intl.DateTimeFormat('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      timeZone: 'America/Sao_Paulo',
    }).format(date);
};

async function getAdminData() {
  const db = getAdminFirestore();
  const usersSnapshot = await db.collection('users').get();
  const userMap = new Map<string, any>();
  const adminEmails = ['inesvalentim45@gmail.com', 'giibrossini@gmail.com'];
  let totalUserCount = 0;
  usersSnapshot.forEach(doc => {
    const data = doc.data();
    userMap.set(doc.id, { email: data.email || '', name: data.name || '' });
    if (!adminEmails.includes(data.email)) totalUserCount++;
  });
  const pagesSnapshot = await db.collection('lovepages').orderBy('createdAt', 'desc').limit(100).get();
  let avancadoCount = 0, basicoCount = 0, totalSalesBRL = 0, totalSalesUSD = 0;
  const filteredDocs = pagesSnapshot.docs.filter(doc => {
    const owner = userMap.get(doc.data().userId);
    return !owner || !adminEmails.includes(owner.email);
  });
  const detailedSales = filteredDocs.map(doc => {
    const data = doc.data();
    if (data.plan === 'avancado') avancadoCount++;
    else if (data.plan === 'basico') basicoCount++;
    const owner = userMap.get(data.userId);
    const createdAtDate = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();
    const isUSD = data.paymentId && isNaN(Number(data.paymentId));
    let price = 0;
    let currency: 'BRL' | 'USD' = 'BRL';
    if (isUSD) { currency = 'USD'; price = data.plan === 'avancado' ? 19.90 : 14.90; totalSalesUSD += price; }
    else { currency = 'BRL'; price = data.plan === 'avancado' ? 24.90 : 14.90; totalSalesBRL += price; }
    return { id: doc.id, plan: data.plan || 'gratis', price, currency, createdAt: createdAtDate, ownerEmail: owner?.email || 'User deleted', status: data.status || 'active' };
  });
  const failedMovesSnap = await db.collection('failed_file_moves').where('resolved', '==', false).get();
  return {
    stats: { totalUsers: totalUserCount, totalPages: filteredDocs.length, totalSalesBRL, totalSalesUSD, avancadoCount, basicoCount, pendingFileIssues: failedMovesSnap.size },
    sales: detailedSales
  };
}

export default async function AdminDashboard() {
  const { stats, sales } = await getAdminData();
  return (
    <div className="min-h-screen bg-background text-foreground pb-20">
      <header className="bg-card border-b border-border mb-8 sticky top-0 z-50">
        <div className="container mx-auto flex h-16 items-center justify-between px-4">
          <div className="flex items-center gap-2">
            <div className="bg-primary/20 p-2 rounded-full"><ShieldCheck className="w-5 h-5 text-primary" /></div>
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
          </div>
          <div className="flex items-center gap-2">
            <Button asChild variant="outline" size="sm">
              <Link href="/admin/analytics"><TrendingUp className="h-4 w-4 mr-2" />Analytics</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="border-green-500/40 text-green-400 hover:bg-green-500/10">
              <Link href="/admin/creditos"><Gift className="h-4 w-4 mr-2" />Créditos</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="border-yellow-500/40 text-yellow-400 hover:bg-yellow-500/10">
              <Link href="/admin/area2"><BarChart2 className="h-4 w-4 mr-2" />Admin Area 2</Link>
            </Button>
            <Button asChild variant="outline" size="sm" className={stats.pendingFileIssues > 0 ? "border-red-500/50 text-red-400" : ""}>
              <Link href="/admin/pages">
                <FileWarning className="h-4 w-4 mr-2" />Arquivos
                {stats.pendingFileIssues > 0 && <span className="ml-2 bg-red-500 text-white text-xs font-bold rounded-full w-5 h-5 flex items-center justify-center">{stats.pendingFileIssues > 9 ? '9+' : stats.pendingFileIssues}</span>}
              </Link>
            </Button>
            <Button asChild variant="outline" size="sm" className="border-red-500/40 text-red-400 hover:bg-red-500/10">
              <Link href="/admin/fix-images"><ImageOff className="h-4 w-4 mr-2" />Recuperar Imagens</Link>
            </Button>
            <form action={removeAdminSession}>
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-500"><LogOut className="h-4 w-4 mr-2" />Sign Out</Button>
            </form>
          </div>
        </div>
      </header>
      <main className="container mx-auto px-4 space-y-8">
        {stats.pendingFileIssues > 0 && (
          <div className="flex items-center justify-between p-4 rounded-xl border border-red-500/30 bg-red-500/10">
            <div className="flex items-center gap-3">
              <AlertTriangle className="w-5 h-5 text-red-400 shrink-0" />
              <div>
                <p className="font-bold text-red-400">{stats.pendingFileIssues} arquivo{stats.pendingFileIssues > 1 ? 's' : ''} preso{stats.pendingFileIssues > 1 ? 's' : ''} em temp/</p>
                <p className="text-xs text-red-400/70">Imagens de clientes que falharam ao ser movidas.</p>
              </div>
            </div>
            <Button asChild size="sm" className="bg-red-600 hover:bg-red-700 shrink-0"><Link href="/admin/pages">Ver e Reprocessar →</Link></Button>
          </div>
        )}
        {stats.pendingFileIssues === 0 && (
          <div className="flex items-center gap-3 p-3 rounded-xl border border-green-500/20 bg-green-500/5">
            <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
            <p className="text-sm text-green-400">Todos os arquivos de clientes estão íntegros.</p>
          </div>
        )}
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <ActiveUsersWidget />
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Total Users</CardTitle><Users className="h-4 w-4 text-blue-500" /></CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.totalUsers}</div><p className="text-xs text-muted-foreground">registered on the platform</p></CardContent>
          </Card>
          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Pages Created</CardTitle><FileText className="h-4 w-4 text-purple-500" /></CardHeader>
            <CardContent><div className="text-2xl font-bold">{stats.totalPages}</div><p className="text-xs text-muted-foreground"><span className="text-purple-400 font-bold">{stats.avancadoCount} Advanced</span> • {stats.basicoCount} Basic</p></CardContent>
          </Card>
          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Revenue (BRL)</CardTitle><DollarSign className="h-4 w-4 text-green-500" /></CardHeader>
            <CardContent><div className="text-2xl font-bold">{formatCurrency(stats.totalSalesBRL, 'BRL')}</div><p className="text-xs text-muted-foreground">Brazilian sales</p></CardContent>
          </Card>
          <Card className="border-l-4 border-l-cyan-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2"><CardTitle className="text-sm font-medium">Revenue (USD)</CardTitle><DollarSign className="h-4 w-4 text-cyan-500" /></CardHeader>
            <CardContent><div className="text-2xl font-bold">{formatCurrency(stats.totalSalesUSD, 'USD')}</div><p className="text-xs text-muted-foreground">International sales</p></CardContent>
          </Card>
        </div>
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
          <div className="p-6 border-b border-border flex justify-between items-center">
            <h2 className="text-lg font-bold">Sales & Pages History</h2>
            <span className="text-xs bg-secondary text-secondary-foreground px-3 py-1 rounded-full">{sales.length} most recent</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-muted/50 text-muted-foreground uppercase text-xs">
                <tr>
                  <th className="px-6 py-4 font-medium">User / Email</th>
                  <th className="px-6 py-4 font-medium">Plan</th>
                  <th className="px-6 py-4 font-medium">Amount</th>
                  <th className="px-6 py-4 font-medium">Purchase Date</th>
                  <th className="px-6 py-4 font-medium text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {sales.map((sale) => {
                    const planClass = sale.plan === 'avancado' 
                        ? 'bg-purple-500/10 text-purple-500 border border-purple-500/20' 
                        : sale.plan === 'basico' 
                            ? 'bg-blue-500/10 text-blue-500 border border-blue-500/20' 
                            : 'bg-gray-500/10 text-gray-500';
                    return (
                        <tr key={sale.id} className="hover:bg-muted/30 transition-colors">
                            <td className="px-6 py-4"><div className="flex flex-col"><span className="font-medium">{sale.ownerEmail}</span><span className="text-xs text-muted-foreground">ID: {sale.id.slice(0, 8)}...</span></div></td>
                            <td className="px-6 py-4"><span className={cn("inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium capitalize", planClass)}>{sale.plan}</span></td>
                            <td className="px-6 py-4 font-mono">{sale.price > 0 ? <span className="text-green-500 font-bold">{formatCurrency(sale.price, sale.currency)}</span> : <span className="text-muted-foreground">{formatCurrency(0, 'BRL')}</span>}</td>
                            <td className="px-6 py-4 text-muted-foreground"><div className="flex items-center gap-2"><Calendar className="w-3 h-3" />{formatDate(sale.createdAt)}</div></td>
                            <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                            <Button asChild variant="outline" size="sm" className="h-8"><Link href={`/admin/edit/${sale.id}`}>Edit <Edit className="w-3 h-3 ml-2" /></Link></Button>
                            <Button asChild variant="outline" size="sm" className="h-8"><Link href={`/p/${sale.id}`} target="_blank">View <ExternalLink className="w-3 h-3 ml-2" /></Link></Button>
                            </td>
                        </tr>
                    );
                })}
                {sales.length === 0 && <tr><td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">No sales yet.</td></tr>}
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  );
}
