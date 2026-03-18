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
  ArrowDownRight
} from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { useAppStore } from '@/stores/auth-store';
import { formatGNF, formatDate } from '@/lib/mock-data';

export function DashboardPage() {
  const { dashboardStats, factures, clients, produits, employes } = useAppStore();

  const stats = [
    {
      title: 'CA du mois',
      value: formatGNF(dashboardStats.caMois),
      change: '+12.5%',
      trend: 'up',
      icon: DollarSign,
      color: 'emerald'
    },
    {
      title: 'Factures en attente',
      value: dashboardStats.facturesEnAttente.toString(),
      change: '2 nouvelles',
      trend: 'neutral',
      icon: FileText,
      color: 'amber'
    },
    {
      title: 'Clients actifs',
      value: dashboardStats.clientsActifs.toString(),
      change: '+1 ce mois',
      trend: 'up',
      icon: Users,
      color: 'blue'
    },
    {
      title: 'Produits stock bas',
      value: dashboardStats.produitsStockBas.toString(),
      change: 'À commander',
      trend: 'warning',
      icon: Package,
      color: 'red'
    }
  ];

  const recentFactures = factures.slice(0, 5);
  const stockBas = produits.filter(p => p.stockActuel <= p.stockMin);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const colorClasses: Record<string, string> = {
            emerald: 'bg-emerald-100 text-emerald-600',
            amber: 'bg-amber-100 text-amber-600',
            blue: 'bg-blue-100 text-blue-600',
            red: 'bg-red-100 text-red-600'
          };

          return (
            <Card key={index} className="hover:shadow-lg transition-shadow">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-500">{stat.title}</p>
                    <p className="text-2xl font-bold text-slate-900 mt-1">{stat.value}</p>
                  </div>
                  <div className={`p-3 rounded-lg ${colorClasses[stat.color]}`}>
                    <Icon className="w-5 h-5" />
                  </div>
                </div>
                <div className="flex items-center gap-1 mt-3">
                  {stat.trend === 'up' && (
                    <ArrowUpRight className="w-4 h-4 text-emerald-500" />
                  )}
                  {stat.trend === 'warning' && (
                    <AlertTriangle className="w-4 h-4 text-amber-500" />
                  )}
                  <span className={`text-sm ${
                    stat.trend === 'up' ? 'text-emerald-600' : 
                    stat.trend === 'warning' ? 'text-amber-600' : 
                    'text-slate-500'
                  }`}>
                    {stat.change}
                  </span>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Main Content Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Recent Invoices */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-lg">Factures récentes</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {recentFactures.map((facture) => (
                <div 
                  key={facture.id} 
                  className="flex items-center justify-between p-3 bg-slate-50 rounded-lg hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center">
                      <FileText className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-medium text-slate-900">{facture.numero}</p>
                      <p className="text-sm text-slate-500">{facture.client?.nom}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="font-semibold text-slate-900">{formatGNF(facture.montantTTC)}</p>
                    <Badge variant={
                      facture.statut === 'PAYEE' ? 'default' :
                      facture.statut === 'EN_RETARD' ? 'destructive' :
                      facture.statut === 'ENVOYEE' ? 'secondary' : 'outline'
                    }>
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

        {/* Alerts & Quick Actions */}
        <div className="space-y-6">
          {/* Stock Alerts */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-amber-500" />
                Alertes stock
              </CardTitle>
            </CardHeader>
            <CardContent>
              {stockBas.length > 0 ? (
                <div className="space-y-3">
                  {stockBas.map((produit) => (
                    <div key={produit.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-sm">{produit.nom}</p>
                        <p className="text-xs text-slate-500">Stock: {produit.stockActuel} / Min: {produit.stockMin}</p>
                      </div>
                      <Progress 
                        value={(produit.stockActuel / (produit.stockMin * 2)) * 100} 
                        className="w-16 h-2"
                      />
                    </div>
                  ))}
                </div>
              ) : (
                <p className="text-sm text-slate-500 text-center py-4">
                  Aucune alerte de stock
                </p>
              )}
            </CardContent>
          </Card>

          {/* Quick Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Aperçu financier</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Masse salariale</span>
                <span className="font-semibold">{formatGNF(dashboardStats.masseSalarialeMois)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm text-slate-500">Dépenses du mois</span>
                <span className="font-semibold">{formatGNF(dashboardStats.depensesMois)}</span>
              </div>
              <div className="flex justify-between items-center pt-2 border-t">
                <span className="text-sm font-medium">Résultat net</span>
                <span className="font-bold text-emerald-600">
                  {formatGNF(dashboardStats.caMois - dashboardStats.masseSalarialeMois - dashboardStats.depensesMois)}
                </span>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Employee Overview */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Effectif: {employes.length} employés</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-3 lg:grid-cols-5 gap-4">
            {employes.slice(0, 5).map((employe) => (
              <div 
                key={employe.id} 
                className="flex flex-col items-center p-4 bg-slate-50 rounded-lg"
              >
                <div className="w-12 h-12 bg-emerald-600 rounded-full flex items-center justify-center text-white font-semibold mb-2">
                  {employe.prenom[0]}{employe.nom[0]}
                </div>
                <p className="font-medium text-sm text-center">{employe.prenom} {employe.nom}</p>
                <p className="text-xs text-slate-500">{employe.poste}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
