'use client';

import { 
  TrendingUp, 
  TrendingDown, 
  DollarSign, 
  Users, 
  FileText, 
  Package,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  ShoppingCart,
  CreditCard,
  Activity,
  Clock,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Calendar,
  Receipt,
  Wallet,
  PieChart
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAppStore } from '@/stores/auth-store';
import { formatGNF, formatDate } from '@/lib/mock-data';
import { cn } from '@/lib/utils';

// Composant Sparkline stylisé
function Sparkline({ 
  data, 
  color = 'emerald',
  className 
}: { 
  data: number[];
  color?: 'emerald' | 'blue' | 'amber' | 'red' | 'purple';
  className?: string;
}) {
  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  
  const colorClasses = {
    emerald: 'from-emerald-500 to-emerald-300',
    blue: 'from-blue-500 to-blue-300',
    amber: 'from-amber-500 to-amber-300',
    red: 'from-red-500 to-red-300',
    purple: 'from-purple-500 to-purple-300',
  };

  return (
    <div className={cn('flex items-end gap-0.5 h-10', className)}>
      {data.map((value, index) => {
        const height = ((value - min) / range) * 100;
        return (
          <div
            key={index}
            className={cn(
              'flex-1 rounded-sm transition-all duration-300 bg-gradient-to-t',
              colorClasses[color],
              'opacity-80 hover:opacity-100'
            )}
            style={{ 
              height: `${Math.max(15, height)}%`,
              animationDelay: `${index * 50}ms`
            }}
          />
        );
      })}
    </div>
  );
}

// Composant Donut Chart stylisé
function DonutChart({
  data,
  size = 120,
  strokeWidth = 20,
  className,
}: {
  data: { label: string; value: number; color: string }[];
  size?: number;
  strokeWidth?: number;
  className?: string;
}) {
  const total = data.reduce((sum, item) => sum + item.value, 0);
  const radius = (size - strokeWidth) / 2;
  const circumference = radius * 2 * Math.PI;
  
  let offset = 0;
  
  return (
    <div className={cn('relative', className)}>
      <svg width={size} height={size} className="transform -rotate-90">
        {/* Background circle */}
        <circle
          cx={size / 2}
          cy={size / 2}
          r={radius}
          fill="none"
          stroke="currentColor"
          strokeWidth={strokeWidth}
          className="text-slate-100"
        />
        {/* Data segments */}
        {data.map((item, index) => {
          const percentage = (item.value / total) * 100;
          const dashLength = (percentage / 100) * circumference;
          const dashOffset = offset;
          offset += dashLength;
          
          return (
            <circle
              key={index}
              cx={size / 2}
              cy={size / 2}
              r={radius}
              fill="none"
              stroke={item.color}
              strokeWidth={strokeWidth}
              strokeDasharray={`${dashLength} ${circumference}`}
              strokeDashoffset={-dashOffset}
              strokeLinecap="round"
              className="transition-all duration-700 ease-out"
              style={{ animationDelay: `${index * 100}ms` }}
            />
          );
        })}
      </svg>
      {/* Center text */}
      <div className="absolute inset-0 flex flex-col items-center justify-center">
        <span className="text-2xl font-bold text-slate-900">{total}</span>
        <span className="text-xs text-slate-500">Total</span>
      </div>
    </div>
  );
}

// Composant Timeline
function ActivityTimeline({ activities }: { activities: Array<{
  id: string;
  type: 'invoice' | 'payment' | 'order' | 'alert';
  title: string;
  description: string;
  time: string;
}> }) {
  const iconMap = {
    invoice: { icon: FileText, color: 'text-emerald-600', bg: 'bg-emerald-100' },
    payment: { icon: CreditCard, color: 'text-blue-600', bg: 'bg-blue-100' },
    order: { icon: ShoppingCart, color: 'text-purple-600', bg: 'bg-purple-100' },
    alert: { icon: AlertCircle, color: 'text-amber-600', bg: 'bg-amber-100' },
  };

  return (
    <div className="relative">
      {/* Timeline line */}
      <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-emerald-200 via-slate-200 to-transparent" />
      
      <div className="space-y-4">
        {activities.map((activity, index) => {
          const { icon: Icon, color, bg } = iconMap[activity.type];
          return (
            <div 
              key={activity.id}
              className="relative flex gap-4 animate-slide-up"
              style={{ animationDelay: `${index * 100}ms` }}
            >
              {/* Icon */}
              <div className={cn(
                'relative z-10 flex h-8 w-8 items-center justify-center rounded-full',
                bg
              )}>
                <Icon className={cn('h-4 w-4', color)} />
              </div>
              
              {/* Content */}
              <div className="flex-1 min-w-0 pb-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="text-sm font-medium text-slate-900">{activity.title}</p>
                    <p className="text-xs text-slate-500 mt-0.5">{activity.description}</p>
                  </div>
                  <span className="text-xs text-slate-400 whitespace-nowrap">{activity.time}</span>
                </div>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

// Composant KPI Card amélioré
function KPICard({
  title,
  value,
  change,
  changeType,
  icon: Icon,
  gradientFrom,
  gradientTo,
  iconBg,
  sparklineData,
  delay = 0,
}: {
  title: string;
  value: string;
  change: string;
  changeType: 'positive' | 'negative' | 'neutral' | 'warning';
  icon: React.ElementType;
  gradientFrom: string;
  gradientTo: string;
  iconBg: string;
  sparklineData?: number[];
  delay?: number;
}) {
  const changeColors = {
    positive: 'text-emerald-600 bg-emerald-50',
    negative: 'text-red-600 bg-red-50',
    neutral: 'text-slate-600 bg-slate-50',
    warning: 'text-amber-600 bg-amber-50',
  };

  const ChangeIcon = changeType === 'positive' ? ArrowUpRight : 
                     changeType === 'negative' ? ArrowDownRight : 
                     changeType === 'warning' ? AlertTriangle : Activity;

  return (
    <Card 
      className="card-hover overflow-hidden animate-slide-up"
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardContent className="p-0">
        {/* Gradient header */}
        <div className={cn('h-1 bg-gradient-to-r', gradientFrom, gradientTo)} />
        
        <div className="p-6">
          <div className="flex items-start justify-between">
            <div className="space-y-1">
              <p className="text-sm font-medium text-slate-500">{title}</p>
              <p className="text-2xl font-bold text-slate-900">{value}</p>
            </div>
            <div className={cn('p-3 rounded-xl', iconBg)}>
              <Icon className="w-6 h-6" />
            </div>
          </div>
          
          {/* Sparkline */}
          {sparklineData && (
            <div className="mt-4">
              <Sparkline 
                data={sparklineData} 
                color={gradientFrom.includes('emerald') ? 'emerald' : 
                       gradientFrom.includes('blue') ? 'blue' : 
                       gradientFrom.includes('amber') ? 'amber' : 
                       gradientFrom.includes('red') ? 'red' : 'purple'}
              />
            </div>
          )}
          
          {/* Change indicator */}
          <div className="flex items-center gap-2 mt-4">
            <span className={cn(
              'inline-flex items-center gap-1 px-2 py-1 rounded-full text-xs font-medium',
              changeColors[changeType]
            )}>
              <ChangeIcon className="w-3 h-3" />
              {change}
            </span>
            <span className="text-xs text-slate-400">vs mois dernier</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}

// Données simulées pour les sparklines
const generateSparklineData = (trend: 'up' | 'down' | 'stable' = 'up') => {
  const base = Math.random() * 50 + 30;
  return Array.from({ length: 12 }, (_, i) => {
    const variation = trend === 'up' ? i * 3 : trend === 'down' ? -i * 2 : Math.sin(i) * 10;
    return Math.max(10, Math.min(100, base + variation + Math.random() * 15));
  });
};

export function DashboardPage() {
  const { dashboardStats, factures, clients, produits, employes, commandes } = useAppStore();

  // KPIs avec données de sparkline
  const kpis = [
    {
      title: 'Chiffre d\'affaires',
      value: formatGNF(dashboardStats.caMois),
      change: '+12.5%',
      changeType: 'positive' as const,
      icon: DollarSign,
      gradientFrom: 'from-emerald-500',
      gradientTo: 'to-emerald-400',
      iconBg: 'bg-emerald-100 text-emerald-600',
      sparklineData: generateSparklineData('up'),
    },
    {
      title: 'Factures en attente',
      value: dashboardStats.facturesEnAttente.toString(),
      change: '2 nouvelles',
      changeType: 'neutral' as const,
      icon: FileText,
      gradientFrom: 'from-amber-500',
      gradientTo: 'to-amber-400',
      iconBg: 'bg-amber-100 text-amber-600',
      sparklineData: generateSparklineData('stable'),
    },
    {
      title: 'Clients actifs',
      value: dashboardStats.clientsActifs.toString(),
      change: '+3 ce mois',
      changeType: 'positive' as const,
      icon: Users,
      gradientFrom: 'from-blue-500',
      gradientTo: 'to-blue-400',
      iconBg: 'bg-blue-100 text-blue-600',
      sparklineData: generateSparklineData('up'),
    },
    {
      title: 'Stock bas',
      value: dashboardStats.produitsStockBas.toString(),
      change: 'À commander',
      changeType: 'warning' as const,
      icon: Package,
      gradientFrom: 'from-red-500',
      gradientTo: 'to-red-400',
      iconBg: 'bg-red-100 text-red-600',
      sparklineData: generateSparklineData('down'),
    },
  ];

  // Données pour le graphique donut des statuts de factures
  const invoiceStatusData = [
    { label: 'Payées', value: factures.filter(f => f.statut === 'PAYEE').length, color: '#10b981' },
    { label: 'En attente', value: factures.filter(f => f.statut === 'ENVOYEE').length, color: '#3b82f6' },
    { label: 'En retard', value: factures.filter(f => f.statut === 'EN_RETARD').length, color: '#ef4444' },
    { label: 'Brouillons', value: factures.filter(f => f.statut === 'BROUILLON').length, color: '#94a3b8' },
  ];

  // Données pour le graphique donut des catégories de ventes (simulées)
  const salesCategoryData = [
    { label: 'Électronique', value: 35, color: '#10b981' },
    { label: 'Alimentation', value: 25, color: '#3b82f6' },
    { label: 'Vêtements', value: 20, color: '#f59e0b' },
    { label: 'Autres', value: 20, color: '#8b5cf6' },
  ];

  // Activités récentes simulées
  const recentActivities = [
    {
      id: '1',
      type: 'invoice' as const,
      title: 'Nouvelle facture créée',
      description: `FAC-2024-${factures.length.toString().padStart(4, '0')} - ${formatGNF(2500000)}`,
      time: 'Il y a 5 min',
    },
    {
      id: '2',
      type: 'payment' as const,
      title: 'Paiement reçu',
      description: `${clients[0]?.nom || 'Client'} - ${formatGNF(1500000)}`,
      time: 'Il y a 23 min',
    },
    {
      id: '3',
      type: 'order' as const,
      title: 'Nouvelle commande',
      description: `CMD-${commandes?.length || 1} - 3 articles`,
      time: 'Il y a 1h',
    },
    {
      id: '4',
      type: 'alert' as const,
      title: 'Alerte de stock',
      description: 'Produit "Riz Importé" sous le seuil minimum',
      time: 'Il y a 2h',
    },
    {
      id: '5',
      type: 'invoice' as const,
      title: 'Facture payée',
      description: `${factures[0]?.numero || 'FAC-001'} - Payée intégralement`,
      time: 'Il y a 3h',
    },
  ];

  const recentFactures = factures.slice(0, 5);
  const stockBas = produits.filter(p => p.stockActuel <= p.stockMin);

  return (
    <div className="space-y-6 pb-8">
      {/* En-tête */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4 animate-fade-in">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Tableau de bord</h1>
          <p className="text-slate-500 text-sm mt-1">
            Bienvenue ! Voici un aperçu de votre activité.
          </p>
        </div>
        <div className="flex items-center gap-2 text-sm text-slate-500">
          <Calendar className="w-4 h-4" />
          <span>{new Date().toLocaleDateString('fr-FR', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })}</span>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map((kpi, index) => (
          <KPICard
            key={kpi.title}
            {...kpi}
            delay={index * 100}
          />
        ))}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Invoices */}
        <Card className="lg:col-span-2 animate-slide-up" style={{ animationDelay: '200ms' }}>
          <CardHeader className="flex flex-row items-center justify-between">
            <div>
              <CardTitle className="text-lg flex items-center gap-2">
                <Receipt className="w-5 h-5 text-emerald-600" />
                Factures récentes
              </CardTitle>
              <CardDescription>Vos dernières transactions</CardDescription>
            </div>
            <Badge variant="secondary" className="font-mono">
              {factures.length} total
            </Badge>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {recentFactures.map((facture, index) => (
                <div 
                  key={facture.id} 
                  className="flex items-center justify-between p-4 rounded-xl bg-gradient-to-r from-slate-50 to-transparent hover:from-slate-100 transition-all duration-300 animate-slide-up"
                  style={{ animationDelay: `${250 + index * 50}ms` }}
                >
                  <div className="flex items-center gap-4">
                    <div className={cn(
                      'w-11 h-11 rounded-xl flex items-center justify-center',
                      facture.statut === 'PAYEE' ? 'bg-emerald-100' :
                      facture.statut === 'EN_RETARD' ? 'bg-red-100' :
                      facture.statut === 'ENVOYEE' ? 'bg-blue-100' : 'bg-slate-100'
                    )}>
                      <FileText className={cn(
                        'w-5 h-5',
                        facture.statut === 'PAYEE' ? 'text-emerald-600' :
                        facture.statut === 'EN_RETARD' ? 'text-red-600' :
                        facture.statut === 'ENVOYEE' ? 'text-blue-600' : 'text-slate-600'
                      )} />
                    </div>
                    <div>
                      <p className="font-semibold text-slate-900">{facture.numero}</p>
                      <p className="text-sm text-slate-500">{facture.client?.nom}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-slate-900">{formatGNF(facture.montantTTC)}</p>
                    <Badge 
                      variant={
                        facture.statut === 'PAYEE' ? 'default' :
                        facture.statut === 'EN_RETARD' ? 'destructive' :
                        facture.statut === 'ENVOYEE' ? 'secondary' : 'outline'
                      }
                      className={cn(
                        'mt-1',
                        facture.statut === 'PAYEE' && 'bg-emerald-600 hover:bg-emerald-700'
                      )}
                    >
                      {facture.statut === 'PAYEE' && <CheckCircle2 className="w-3 h-3 mr-1" />}
                      {facture.statut === 'EN_RETARD' && <XCircle className="w-3 h-3 mr-1" />}
                      {facture.statut === 'ENVOYEE' && <Clock className="w-3 h-3 mr-1" />}
                      {facture.statut === 'PAYEE' ? 'Payée' :
                       facture.statut === 'EN_RETARD' ? 'En retard' :
                       facture.statut === 'ENVOYEE' ? 'Envoyée' : 'Brouillon'}
                    </Badge>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Activity Timeline */}
        <Card className="animate-slide-up" style={{ animationDelay: '300ms' }}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Activity className="w-5 h-5 text-blue-600" />
              Activité récente
            </CardTitle>
            <CardDescription>Les derniers événements</CardDescription>
          </CardHeader>
          <CardContent>
            <ActivityTimeline activities={recentActivities} />
          </CardContent>
        </Card>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {/* Invoice Status Chart */}
        <Card className="animate-slide-up" style={{ animationDelay: '400ms' }}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <PieChart className="w-5 h-5 text-emerald-600" />
              Statut des factures
            </CardTitle>
            <CardDescription>Répartition par statut</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <DonutChart data={invoiceStatusData} size={140} strokeWidth={24} />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {invoiceStatusData.map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-slate-600">{item.label}</span>
                  <span className="text-sm font-semibold text-slate-900 ml-auto">{item.value}</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Sales by Category Chart */}
        <Card className="animate-slide-up" style={{ animationDelay: '450ms' }}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-purple-600" />
              Ventes par catégorie
            </CardTitle>
            <CardDescription>Répartition du CA</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-center">
              <DonutChart data={salesCategoryData} size={140} strokeWidth={24} />
            </div>
            <div className="mt-6 grid grid-cols-2 gap-3">
              {salesCategoryData.map((item) => (
                <div key={item.label} className="flex items-center gap-2">
                  <div 
                    className="w-3 h-3 rounded-full" 
                    style={{ backgroundColor: item.color }}
                  />
                  <span className="text-sm text-slate-600">{item.label}</span>
                  <span className="text-sm font-semibold text-slate-900 ml-auto">{item.value}%</span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Financial Overview */}
        <Card className="animate-slide-up" style={{ animationDelay: '500ms' }}>
          <CardHeader>
            <CardTitle className="text-lg flex items-center gap-2">
              <Wallet className="w-5 h-5 text-amber-600" />
              Aperçu financier
            </CardTitle>
            <CardDescription>Ce mois</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-emerald-50 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-emerald-100 flex items-center justify-center">
                  <TrendingUp className="w-5 h-5 text-emerald-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Revenus</p>
                  <p className="font-bold text-emerald-600">{formatGNF(dashboardStats.caMois)}</p>
                </div>
              </div>
            </div>
            
            <div className="flex justify-between items-center p-3 rounded-lg bg-gradient-to-r from-red-50 to-transparent">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-lg bg-red-100 flex items-center justify-center">
                  <TrendingDown className="w-5 h-5 text-red-600" />
                </div>
                <div>
                  <p className="text-sm text-slate-500">Dépenses</p>
                  <p className="font-bold text-red-600">{formatGNF(dashboardStats.depensesMois + dashboardStats.masseSalarialeMois)}</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium text-slate-700">Résultat net</span>
                <span className="text-lg font-bold text-emerald-600">
                  {formatGNF(dashboardStats.caMois - dashboardStats.masseSalarialeMois - dashboardStats.depensesMois)}
                </span>
              </div>
              <Progress 
                value={Math.min(100, ((dashboardStats.caMois - dashboardStats.masseSalarialeMois - dashboardStats.depensesMois) / dashboardStats.caMois) * 100)} 
                className="mt-2 h-2"
              />
              <p className="text-xs text-slate-500 mt-1">
                Marge: {((dashboardStats.caMois - dashboardStats.masseSalarialeMois - dashboardStats.depensesMois) / dashboardStats.caMois * 100).toFixed(1)}%
              </p>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Stock Alerts */}
      <Card className="animate-slide-up" style={{ animationDelay: '550ms' }}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-amber-500" />
            Alertes de stock
            {stockBas.length > 0 && (
              <Badge variant="destructive" className="ml-2">
                {stockBas.length} produit{stockBas.length > 1 ? 's' : ''}
              </Badge>
            )}
          </CardTitle>
          <CardDescription>Produits sous le seuil minimum</CardDescription>
        </CardHeader>
        <CardContent>
          {stockBas.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {stockBas.slice(0, 6).map((produit, index) => (
                <div 
                  key={produit.id} 
                  className="flex items-center gap-4 p-4 rounded-xl bg-gradient-to-r from-amber-50 to-transparent border border-amber-100 animate-slide-up"
                  style={{ animationDelay: `${550 + index * 50}ms` }}
                >
                  <div className="w-12 h-12 rounded-xl bg-amber-100 flex items-center justify-center">
                    <Package className="w-6 h-6 text-amber-600" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-medium text-slate-900 truncate">{produit.nom}</p>
                    <div className="flex items-center gap-2 mt-1">
                      <span className="text-xs text-slate-500">
                        Stock: <span className="font-semibold text-red-600">{produit.stockActuel}</span>
                      </span>
                      <span className="text-xs text-slate-400">|</span>
                      <span className="text-xs text-slate-500">Min: {produit.stockMin}</span>
                    </div>
                    <Progress 
                      value={(produit.stockActuel / (produit.stockMin * 2)) * 100} 
                      className="mt-2 h-1.5"
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-8 text-center">
              <div className="w-16 h-16 rounded-full bg-emerald-100 flex items-center justify-center mb-4">
                <CheckCircle2 className="w-8 h-8 text-emerald-600" />
              </div>
              <p className="text-lg font-medium text-slate-900">Tout va bien !</p>
              <p className="text-sm text-slate-500 mt-1">Aucune alerte de stock à signaler</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Employee Overview */}
      <Card className="animate-slide-up" style={{ animationDelay: '600ms' }}>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <Users className="w-5 h-5 text-blue-600" />
            Équipe
            <Badge variant="secondary" className="ml-2">{employes.length} membres</Badge>
          </CardTitle>
          <CardDescription>Vos collaborateurs</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
            {employes.slice(0, 6).map((employe, index) => (
              <div 
                key={employe.id} 
                className="flex flex-col items-center p-4 rounded-xl bg-gradient-to-b from-slate-50 to-transparent hover:from-slate-100 transition-all duration-300 animate-scale-in"
                style={{ animationDelay: `${600 + index * 50}ms` }}
              >
                <div className="w-14 h-14 rounded-full bg-gradient-to-br from-emerald-500 to-emerald-600 flex items-center justify-center text-white font-bold text-lg shadow-lg shadow-emerald-500/25">
                  {employe.prenom[0]}{employe.nom[0]}
                </div>
                <p className="font-medium text-sm text-center mt-3 text-slate-900">{employe.prenom} {employe.nom}</p>
                <p className="text-xs text-slate-500 text-center">{employe.poste}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
