
import { getAdminFirestore } from '@/lib/firebase/admin/config';
import { removeAdminSession } from './admin-auth-actions';
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
  ShieldCheck,
  Edit
} from 'lucide-react';
import { format } from 'date-fns';
import { enUS } from 'date-fns/locale';
import Link from 'next/link';

export const dynamic = 'force-dynamic';

// Function to format currency, now supporting BRL and USD
const formatCurrency = (value: number, currency: 'BRL' | 'USD') => {
  const locale = currency === 'BRL' ? 'pt-BR' : 'en-US';
  return new Intl.NumberFormat(locale, { 
    style: 'currency', 
    currency 
  }).format(value);
};

async function getAdminData() {
  const db = getAdminFirestore();
  
  // 1. Fetch all users to have a map of ID -> Email and count non-admin users
  const usersSnapshot = await db.collection('users').get();
  const userMap = new Map<string, any>();
  const adminEmails = ['inesvalentim45@gmail.com', 'giibrossini@gmail.com'];
  let totalUserCount = 0;

  usersSnapshot.forEach(doc => {
    const data = doc.data();
    userMap.set(doc.id, { 
      email: data.email || 'Email not provided',
      name: data.name || 'No name',
      photoUrl: data.photoUrl
    });
    // Exclude admins from the total user count
    if (!adminEmails.includes(data.email)) {
      totalUserCount++;
    }
  });

  // 2. Fetch latest 100 pages (Sales) for performance
  const pagesSnapshot = await db.collection('lovepages').orderBy('createdAt', 'desc').limit(100).get();
  
  let avancadoCount = 0;
  let basicoCount = 0;
  let totalSalesBRL = 0;
  let totalSalesUSD = 0;
  
  // Filter out pages belonging to admin users
  const filteredDocs = pagesSnapshot.docs.filter(doc => {
    const owner = userMap.get(doc.data().userId);
    // Keep the page if the owner is not found or is not an admin
    return !owner || !adminEmails.includes(owner.email);
  });

  // Detailed list for the table using filtered docs
  const detailedSales = filteredDocs.map(doc => {
    const data = doc.data();
    
    // Count plans
    if (data.plan === 'avancado') avancadoCount++;
    else if (data.plan === 'basico') basicoCount++;

    const owner = userMap.get(data.userId);
    const createdAtDate = data.createdAt?.toDate ? data.createdAt.toDate() : new Date();

    // Determine currency and price based on paymentId format
    // Numeric IDs are from MercadoPago (BRL), Alphanumeric from PayPal (USD)
    const isUSD = data.paymentId && isNaN(Number(data.paymentId));
    let price = 0;
    let currency: 'BRL' | 'USD' = 'BRL';

    if (isUSD) {
        currency = 'USD';
        if (data.plan === 'avancado') price = 19.90;
        else if (data.plan === 'basico') price = 14.90;
        totalSalesUSD += price;
    } else {
        currency = 'BRL';
        if (data.plan === 'avancado') price = 24.90;
        else if (data.plan === 'basico') price = 19.90;
        totalSalesBRL += price;
    }

    return {
      id: doc.id,
      slug: data.slug || doc.id,
      plan: data.plan || 'gratis',
      price,
      currency,
      createdAt: createdAtDate,
      ownerEmail: owner?.email || 'User deleted/not found',
      ownerName: owner?.name,
      status: data.status || 'active'
    };
  });

  return {
    stats: {
      totalUsers: totalUserCount,
      totalPages: filteredDocs.length,
      totalSalesBRL,
      totalSalesUSD,
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
            <h1 className="text-xl font-bold">Admin Dashboard</h1>
          </div>
          <form action={removeAdminSession}>
            <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-red-500">
              <LogOut className="h-4 w-4 mr-2" />
              Sign Out
            </Button>
          </form>
        </div>
      </header>

      <main className="container mx-auto px-4 space-y-8">
        
        {/* TOP CARDS (KPIs) - Now 4 columns */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card className="border-l-4 border-l-blue-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Users</CardTitle>
              <Users className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalUsers}</div>
              <p className="text-xs text-muted-foreground">registered on the platform</p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-purple-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Pages Created</CardTitle>
              <FileText className="h-4 w-4 text-purple-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.totalPages}</div>
              <p className="text-xs text-muted-foreground">
                <span className="text-purple-400 font-bold">{stats.avancadoCount} Advanced</span> • {stats.basicoCount} Basic
              </p>
            </CardContent>
          </Card>

          <Card className="border-l-4 border-l-green-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue (BRL)</CardTitle>
              <DollarSign className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalSalesBRL, 'BRL')}</div>
              <p className="text-xs text-muted-foreground">Brazilian sales</p>
            </CardContent>
          </Card>

           <Card className="border-l-4 border-l-cyan-500">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Total Revenue (USD)</CardTitle>
              <DollarSign className="h-4 w-4 text-cyan-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatCurrency(stats.totalSalesUSD, 'USD')}</div>
              <p className="text-xs text-muted-foreground">International sales</p>
            </CardContent>
          </Card>
        </div>

        {/* DETAILED SALES TABLE */}
        <div className="bg-card border border-border rounded-xl shadow-sm overflow-hidden">
            <div className="p-6 border-b border-border flex justify-between items-center">
                <h2 className="text-lg font-bold">Sales & Pages History</h2>
                <span className="text-xs bg-secondary text-secondary-foreground px-3 py-1 rounded-full">
                    {sales.length} most recent
                </span>
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
                                        <span className="text-green-500 font-bold">{formatCurrency(sale.price, sale.currency)}</span>
                                    ) : (
                                        <span className="text-muted-foreground">{formatCurrency(0, 'BRL')}</span>
                                    )}
                                </td>
                                <td className="px-6 py-4 text-muted-foreground">
                                    <div className="flex items-center gap-2">
                                        <Calendar className="w-3 h-3" />
                                        {format(sale.createdAt, "MMM dd, yyyy, hh:mm a", { locale: enUS })}
                                    </div>
                                </td>
                                <td className="px-6 py-4 text-right flex items-center justify-end gap-2">
                                    <Button asChild variant="outline" size="sm" className="h-8">
                                        <Link href={`/admin/edit/${sale.id}`}>
                                            Edit <Edit className="w-3 h-3 ml-2" />
                                        </Link>
                                    </Button>
                                    <Button asChild variant="outline" size="sm" className="h-8">
                                        <Link href={`/p/${sale.id}`} target="_blank">
                                            View <ExternalLink className="w-3 h-3 ml-2" />
                                        </Link>
                                    </Button>
                                </td>
                            </tr>
                        ))}
                        {sales.length === 0 && (
                            <tr>
                                <td colSpan={5} className="px-6 py-12 text-center text-muted-foreground">
                                    No sales or pages found.
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
