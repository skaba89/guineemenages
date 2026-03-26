'use client';

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { 
  BarChart3, 
  Download,
  FileText,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Package
} from 'lucide-react';

function RapportsPageComponent() {
  const rapports = [
    {
      categorie: 'Ventes',
      icon: DollarSign,
      rapports: [
        { nom: 'Journal des ventes', description: 'Détail des ventes par période' },
        { nom: 'Ventes par client', description: 'Analyse des ventes par client' },
        { nom: 'Ventes par produit', description: 'Top produits vendus' },
        { nom: 'Évolution du CA', description: 'Courbe d\'évolution du chiffre d\'affaires' },
      ]
    },
    {
      categorie: 'Achats',
      icon: Package,
      rapports: [
        { nom: 'Journal des achats', description: 'Détail des achats par période' },
        { nom: 'Achats par fournisseur', description: 'Analyse des achats par fournisseur' },
        { nom: 'Comparatif achats/ventes', description: 'Marge et rentabilité' },
      ]
    },
    {
      categorie: 'Trésorerie',
      icon: TrendingUp,
      rapports: [
        { nom: 'Journal de trésorerie', description: 'Mouvements de trésorerie' },
        { nom: 'Prévisionnel', description: 'Prévisions de trésorerie' },
        { nom: 'Échéancier', description: 'Échéances clients et fournisseurs' },
      ]
    },
    {
      categorie: 'RH',
      icon: Users,
      rapports: [
        { nom: 'Masse salariale', description: 'Évolution de la masse salariale' },
        { nom: 'Coût employeur', description: 'Coût total par employé' },
        { nom: 'Congés', description: 'Solde et prise de congés' },
      ]
    },
  ];

  const kpis = [
    { label: 'CA du mois', value: '45 250 000 GNF', evolution: '+12%', positive: true },
    { label: 'Marge brute', value: '32%', evolution: '+3%', positive: true },
    { label: 'Délai moyen paiement', value: '18 jours', evolution: '-2 jours', positive: true },
    { label: 'Taux de transformation', value: '67%', evolution: '+5%', positive: true },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Rapports & Analyses</h1>
          <p className="text-muted-foreground">
            Tableaux de bord et états analytiques
          </p>
        </div>
        <Button variant="outline">
          <Download className="h-4 w-4 mr-2" />
          Exporter tout
        </Button>
      </div>

      {/* KPIs */}
      <div className="grid gap-4 md:grid-cols-4">
        {kpis.map((kpi, i) => (
          <Card key={i}>
            <CardContent className="pt-6">
              <div className="flex justify-between items-start">
                <div>
                  <p className="text-sm text-muted-foreground">{kpi.label}</p>
                  <p className="text-2xl font-bold mt-1">{kpi.value}</p>
                </div>
                <div className={`flex items-center ${kpi.positive ? 'text-green-500' : 'text-red-500'}`}>
                  {kpi.positive ? <TrendingUp className="h-4 w-4 mr-1" /> : <TrendingDown className="h-4 w-4 mr-1" />}
                  <span className="text-sm font-medium">{kpi.evolution}</span>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Rapports par catégorie */}
      <div className="grid gap-6 md:grid-cols-2">
        {rapports.map((cat, i) => {
          const Icon = cat.icon;
          return (
            <Card key={i}>
              <CardHeader>
                <div className="flex items-center gap-2">
                  <Icon className="h-5 w-5 text-emerald-600" />
                  <CardTitle>{cat.categorie}</CardTitle>
                </div>
                <CardDescription>
                  {cat.rapports.length} rapports disponibles
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {cat.rapports.map((rapport, j) => (
                    <div key={j} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg hover:bg-gray-100 cursor-pointer transition-colors">
                      <div className="flex items-center gap-3">
                        <FileText className="h-4 w-4 text-muted-foreground" />
                        <div>
                          <div className="font-medium text-sm">{rapport.nom}</div>
                          <div className="text-xs text-muted-foreground">{rapport.description}</div>
                        </div>
                      </div>
                      <Button variant="ghost" size="sm">
                        <BarChart3 className="h-4 w-4" />
                      </Button>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}

export const RapportsPage = RapportsPageComponent;
export default RapportsPageComponent;
