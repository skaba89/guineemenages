'use client';

import { useState } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Users, FileText, Package, Calendar, Download } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppStore } from '@/stores/auth-store';
import { formatGNF } from '@/lib/mock-data';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  LineChart,
  Line,
  Legend,
} from 'recharts';

const COLORS = ['#10b981', '#3b82f6', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899', '#06b6d4', '#84cc16'];

const moisLabels = ['Jan', 'Fév', 'Mar', 'Avr', 'Mai', 'Jun', 'Jul', 'Aoû', 'Sep', 'Oct', 'Nov', 'Déc'];

export function RapportsPage() {
  const { factures, clients, produits, employes, depenses, dashboardStats } = useAppStore();
  const [periode, setPeriode] = useState<'mois' | 'trimestre' | 'annee'>('mois');
  const [annee, setAnnee] = useState('2024');

  // Calcul des données pour les graphiques
  const caParMois = moisLabels.map((mois, index) => {
    const facturesMois = factures.filter(f => {
      const date = new Date(f.dateEmission);
      return date.getMonth() === index && date.getFullYear() === parseInt(annee);
    });
    const ca = facturesMois.reduce((acc, f) => acc + f.montantTTC, 0);
    const depensesMois = depenses.filter(d => {
      const date = new Date(d.date);
      return date.getMonth() === index && date.getFullYear() === parseInt(annee);
    }).reduce((acc, d) => acc + d.montant, 0);
    return {
      mois,
      ca,
      depenses: depensesMois,
      benefice: ca - depensesMois
    };
  });

  // Répartition par client
  const ventesParClient = clients
    .map(client => ({
      nom: client.nom,
      valeur: client.totalAchats
    }))
    .sort((a, b) => b.valeur - a.valeur)
    .slice(0, 6);

  // Répartition par catégorie de produit
  const ventesParCategorie = produits.reduce((acc, produit) => {
    const cat = produit.categorie || 'Non classé';
    const existing = acc.find(a => a.nom === cat);
    if (existing) {
      existing.valeur += produit.prixUnitaire * produit.stockActuel;
    } else {
      acc.push({ nom: cat, valeur: produit.prixUnitaire * produit.stockActuel });
    }
    return acc;
  }, [] as { nom: string; valeur: number }[]).sort((a, b) => b.valeur - a.valeur);

  // Dépenses par catégorie
  const depensesParCategorie = depenses.reduce((acc, d) => {
    const existing = acc.find(a => a.nom === d.categorie);
    if (existing) {
      existing.valeur += d.montant;
    } else {
      acc.push({ nom: d.categorie, valeur: d.montant });
    }
    return acc;
  }, [] as { nom: string; valeur: number }[]).sort((a, b) => b.valeur - a.valeur);

  // Stats globales
  const totalCA = factures.reduce((acc, f) => acc + f.montantTTC, 0);
  const totalDepenses = depenses.reduce((acc, d) => acc + d.montant, 0);
  const totalMasseSalariale = employes.reduce((acc, e) => acc + e.salaireBase, 0);
  const beneficeNet = totalCA - totalDepenses - totalMasseSalariale;

  const stats = [
    {
      title: 'Chiffre d\'affaires',
      value: formatGNF(totalCA),
      change: '+15.2%',
      trend: 'up',
      icon: TrendingUp,
      color: 'emerald'
    },
    {
      title: 'Total dépenses',
      value: formatGNF(totalDepenses),
      change: '+8.3%',
      trend: 'down',
      icon: TrendingDown,
      color: 'red'
    },
    {
      title: 'Masse salariale',
      value: formatGNF(totalMasseSalariale),
      change: 'Stable',
      trend: 'neutral',
      icon: Users,
      color: 'blue'
    },
    {
      title: 'Bénéfice net estimé',
      value: formatGNF(beneficeNet),
      change: beneficeNet > 0 ? 'Positif' : 'Négatif',
      trend: beneficeNet > 0 ? 'up' : 'down',
      icon: DollarSign,
      color: beneficeNet > 0 ? 'emerald' : 'red'
    }
  ];

  // KPIs
  const kpis = [
    { label: 'Factures émises', value: factures.length },
    { label: 'Factures payées', value: factures.filter(f => f.statut === 'PAYEE').length },
    { label: 'Clients actifs', value: clients.length },
    { label: 'Produits en stock', value: produits.length },
    { label: 'Employés', value: employes.length },
    { label: 'Taux de recouvrement', value: `${Math.round((factures.filter(f => f.statut === 'PAYEE').length / factures.length) * 100)}%` }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex gap-4">
          <Select value={annee} onValueChange={setAnnee}>
            <SelectTrigger className="w-32">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
            </SelectContent>
          </Select>
          <Select value={periode} onValueChange={(v) => setPeriode(v as typeof periode)}>
            <SelectTrigger className="w-40">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mois">Par mois</SelectItem>
              <SelectItem value="trimestre">Par trimestre</SelectItem>
              <SelectItem value="annee">Année complète</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Button variant="outline">
          <Download className="w-4 h-4 mr-2" />
          Exporter
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {stats.map((stat, index) => {
          const Icon = stat.icon;
          const colorClasses: Record<string, string> = {
            emerald: 'bg-emerald-100 text-emerald-600',
            red: 'bg-red-100 text-red-600',
            blue: 'bg-blue-100 text-blue-600',
          };

          return (
            <Card key={index}>
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
                  {stat.trend === 'up' && <TrendingUp className="w-4 h-4 text-emerald-500" />}
                  {stat.trend === 'down' && <TrendingDown className="w-4 h-4 text-red-500" />}
                  <span className={`text-sm ${
                    stat.trend === 'up' ? 'text-emerald-600' : 
                    stat.trend === 'down' ? 'text-red-600' : 
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

      {/* KPIs Row */}
      <Card>
        <CardContent className="p-4">
          <div className="grid grid-cols-2 md:grid-cols-6 gap-4">
            {kpis.map((kpi, index) => (
              <div key={index} className="text-center">
                <p className="text-2xl font-bold text-slate-900">{kpi.value}</p>
                <p className="text-sm text-slate-500">{kpi.label}</p>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>

      {/* Charts Row 1 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* CA vs Dépenses Chart */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Évolution CA / Dépenses / Bénéfice</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={caParMois}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="mois" />
                  <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                  <Tooltip 
                    formatter={(value: number) => formatGNF(value)}
                    labelStyle={{ color: '#000' }}
                  />
                  <Legend />
                  <Bar dataKey="ca" name="CA" fill="#10b981" />
                  <Bar dataKey="depenses" name="Dépenses" fill="#ef4444" />
                  <Bar dataKey="benefice" name="Bénéfice" fill="#3b82f6" />
                </BarChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>

        {/* Répartition clients */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Top clients par CA</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={ventesParClient}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ nom, percent }) => `${nom} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="valeur"
                  >
                    {ventesParClient.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatGNF(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row 2 */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Ventes par catégorie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Valeur stock par catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {ventesParCategorie.map((cat, index) => (
                <div key={cat.nom} className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="font-medium">{cat.nom}</span>
                    <span className="text-slate-600">{formatGNF(cat.valeur)}</span>
                  </div>
                  <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className="h-full rounded-full" 
                      style={{ 
                        width: `${(cat.valeur / ventesParCategorie[0].valeur) * 100}%`,
                        backgroundColor: COLORS[index % COLORS.length]
                      }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Dépenses par catégorie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Dépenses par catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="h-80">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={depensesParCategorie}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={({ nom, percent }) => `${nom} (${(percent * 100).toFixed(0)}%)`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="valeur"
                  >
                    {depensesParCategorie.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip formatter={(value: number) => formatGNF(value)} />
                </PieChart>
              </ResponsiveContainer>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Évolution temporelle */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Tendance du chiffre d'affaires</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={caParMois}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="mois" />
                <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                <Tooltip formatter={(value: number) => formatGNF(value)} />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="ca" 
                  name="CA" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  dot={{ fill: '#10b981' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="benefice" 
                  name="Bénéfice" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  dot={{ fill: '#3b82f6' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        </CardContent>
      </Card>

      {/* Tableau récapitulatif */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Récapitulatif mensuel {annee}</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-2">Mois</th>
                  <th className="text-right py-3 px-2">CA</th>
                  <th className="text-right py-3 px-2">Dépenses</th>
                  <th className="text-right py-3 px-2">Bénéfice</th>
                  <th className="text-right py-3 px-2">Factures</th>
                </tr>
              </thead>
              <tbody>
                {caParMois.map((row, index) => (
                  <tr key={index} className="border-b hover:bg-slate-50">
                    <td className="py-3 px-2 font-medium">{row.mois}</td>
                    <td className="text-right py-3 px-2 text-emerald-600">{formatGNF(row.ca)}</td>
                    <td className="text-right py-3 px-2 text-red-600">{formatGNF(row.depenses)}</td>
                    <td className={`text-right py-3 px-2 font-medium ${row.benefice >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                      {formatGNF(row.benefice)}
                    </td>
                    <td className="text-right py-3 px-2">
                      {factures.filter(f => {
                        const date = new Date(f.dateEmission);
                        return date.getMonth() === index;
                      }).length}
                    </td>
                  </tr>
                ))}
                <tr className="bg-slate-50 font-semibold">
                  <td className="py-3 px-2">Total</td>
                  <td className="text-right py-3 px-2 text-emerald-600">{formatGNF(totalCA)}</td>
                  <td className="text-right py-3 px-2 text-red-600">{formatGNF(totalDepenses)}</td>
                  <td className={`text-right py-3 px-2 ${beneficeNet >= 0 ? 'text-emerald-600' : 'text-red-600'}`}>
                    {formatGNF(totalCA - totalDepenses)}
                  </td>
                  <td className="text-right py-3 px-2">{factures.length}</td>
                </tr>
              </tbody>
            </table>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
