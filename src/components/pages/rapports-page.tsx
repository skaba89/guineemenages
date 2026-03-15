'use client';

import { useState, useEffect } from 'react';
import { TrendingUp, TrendingDown, DollarSign, Users, FileText, Package, Calendar, Download, FileSpreadsheet, Printer } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAppStore } from '@/stores/auth-store';
import { formatGNF } from '@/lib/mock-data';
import api from '@/lib/api';
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
const moisNoms = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

export function RapportsPage() {
  const { factures, clients, produits, employes, depenses, bulletins, company } = useAppStore();
  const [periode, setPeriode] = useState<'mois' | 'trimestre' | 'annee'>('mois');
  const [annee, setAnnee] = useState(new Date().getFullYear().toString());
  const [rapportActif, setRapportActif] = useState('general');
  const [loading, setLoading] = useState(false);
  const [rapportCotisations, setRapportCotisations] = useState<any>(null);
  const [rapportImposition, setRapportImposition] = useState<any>(null);

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
  const totalMasseSalariale = bulletins?.reduce((acc, b) => acc + b.netAPayer, 0) || employes.reduce((acc, e) => acc + e.salaireBase, 0);
  const beneficeNet = totalCA - totalDepenses - totalMasseSalariale;

  // Charge les rapports spécifiques
  useEffect(() => {
    if (rapportActif === 'cotisations') {
      loadRapportCotisations();
    } else if (rapportActif === 'imposition') {
      loadRapportImposition();
    }
  }, [rapportActif, annee]);

  const loadRapportCotisations = async () => {
    const mois = new Date().getMonth() + 1;
    setLoading(true);
    try {
      const response = await api.getRapportCotisations(mois, parseInt(annee));
      if (response.success) {
        setRapportCotisations(response.data);
      }
    } catch (error) {
      console.error('Erreur chargement rapport cotisations:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadRapportImposition = async () => {
    setLoading(true);
    try {
      const response = await api.getRapportImposition(parseInt(annee));
      if (response.success) {
        setRapportImposition(response.data);
      }
    } catch (error) {
      console.error('Erreur chargement rapport imposition:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleExportExcel = async (type: string) => {
    setLoading(true);
    try {
      let blob: Blob;
      let filename: string;
      
      switch (type) {
        case 'clients':
          blob = await api.exportClients();
          filename = 'clients';
          break;
        case 'factures':
          blob = await api.exportFactures();
          filename = 'factures';
          break;
        case 'employes':
          blob = await api.exportEmployes();
          filename = 'employes';
          break;
        case 'paie':
          blob = await api.exportPaie();
          filename = 'paie';
          break;
        case 'depenses':
          blob = await api.exportDepenses();
          filename = 'depenses';
          break;
        default:
          return;
      }
      
      // Télécharger le fichier
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `${filename}-${new Date().toISOString().split('T')[0]}.xlsx`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Erreur export:', error);
      alert('Erreur lors de l\'export');
    } finally {
      setLoading(false);
    }
  };

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

  const kpis = [
    { label: 'Factures émises', value: factures.length },
    { label: 'Factures payées', value: factures.filter(f => f.statut === 'PAYEE').length },
    { label: 'Clients actifs', value: clients.length },
    { label: 'Produits en stock', value: produits.length },
    { label: 'Employés', value: employes.length },
    { label: 'Taux de recouvrement', value: `${Math.round((factures.filter(f => f.statut === 'PAYEE').length / Math.max(factures.length, 1)) * 100)}%` }
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Rapports & Analyses</h2>
          <p className="text-slate-500">Analysez vos performances financières et opérationnelles</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Select value={annee} onValueChange={setAnnee}>
            <SelectTrigger className="w-28">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value={new Date().getFullYear().toString()}>{new Date().getFullYear()}</SelectItem>
              <SelectItem value={(new Date().getFullYear() - 1).toString()}>{new Date().getFullYear() - 1}</SelectItem>
              <SelectItem value={(new Date().getFullYear() - 2).toString()}>{new Date().getFullYear() - 2}</SelectItem>
            </SelectContent>
          </Select>
          <Select value={periode} onValueChange={(v) => setPeriode(v as typeof periode)}>
            <SelectTrigger className="w-36">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="mois">Par mois</SelectItem>
              <SelectItem value="trimestre">Par trimestre</SelectItem>
              <SelectItem value="annee">Année complète</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Onglets de rapports */}
      <Tabs value={rapportActif} onValueChange={setRapportActif}>
        <TabsList className="grid w-full grid-cols-4">
          <TabsTrigger value="general">Général</TabsTrigger>
          <TabsTrigger value="ventes">Ventes</TabsTrigger>
          <TabsTrigger value="paie">Paie</TabsTrigger>
          <TabsTrigger value="fiscal">Fiscal</TabsTrigger>
        </TabsList>

        {/* Rapport Général */}
        <TabsContent value="general" className="space-y-6">
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

          {/* Charts */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
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

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Tendance du CA</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <LineChart data={caParMois}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="mois" />
                      <YAxis tickFormatter={(value) => `${(value / 1000000).toFixed(0)}M`} />
                      <Tooltip formatter={(value: number) => formatGNF(value)} />
                      <Legend />
                      <Line type="monotone" dataKey="ca" name="CA" stroke="#10b981" strokeWidth={2} dot={{ fill: '#10b981' }} />
                      <Line type="monotone" dataKey="benefice" name="Bénéfice" stroke="#3b82f6" strokeWidth={2} dot={{ fill: '#3b82f6' }} />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Tableau récapitulatif */}
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle className="text-lg">Récapitulatif mensuel {annee}</CardTitle>
                <CardDescription>Vue détaillée par mois</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleExportExcel('factures')}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Exporter
              </Button>
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
                        <td className="py-3 px-2 font-medium">{moisNoms[index]}</td>
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
        </TabsContent>

        {/* Rapport Ventes */}
        <TabsContent value="ventes" className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <CardTitle>Top clients par CA</CardTitle>
                <Button variant="outline" size="sm" onClick={() => handleExportExcel('clients')}>
                  <Download className="w-4 h-4 mr-2" />
                  Exporter
                </Button>
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

            <Card>
              <CardHeader>
                <CardTitle>Valeur stock par catégorie</CardTitle>
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
                            width: `${(cat.valeur / Math.max(...ventesParCategorie.map(c => c.valeur))) * 100}%`,
                            backgroundColor: COLORS[index % COLORS.length]
                          }}
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Dépenses par catégorie</CardTitle>
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
        </TabsContent>

        {/* Rapport Paie */}
        <TabsContent value="paie" className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Masse salariale</CardTitle>
                <CardDescription>Vue d'ensemble des charges de personnel</CardDescription>
              </div>
              <Button variant="outline" size="sm" onClick={() => handleExportExcel('paie')}>
                <FileSpreadsheet className="w-4 h-4 mr-2" />
                Exporter
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="p-4 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-600">Total brut</p>
                  <p className="text-xl font-bold text-blue-900">{formatGNF(bulletins?.reduce((a: number, b: any) => a + b.brutTotal, 0) || 0)}</p>
                </div>
                <div className="p-4 bg-emerald-50 rounded-lg">
                  <p className="text-sm text-emerald-600">CNSS Employés</p>
                  <p className="text-xl font-bold text-emerald-900">{formatGNF(bulletins?.reduce((a: number, b: any) => a + b.cnssEmploye, 0) || 1)}</p>
                </div>
                <div className="p-4 bg-amber-50 rounded-lg">
                  <p className="text-sm text-amber-600">IPR</p>
                  <p className="text-xl font-bold text-amber-900">{formatGNF(bulletins?.reduce((a: number, b: any) => a + b.ipr, 0) || 1)}</p>
                </div>
                <div className="p-4 bg-purple-50 rounded-lg">
                  <p className="text-sm text-purple-600">Net à payer</p>
                  <p className="text-xl font-bold text-purple-900">{formatGNF(totalMasseSalariale)}</p>
                </div>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b">
                      <th className="text-left py-3 px-2">Employé</th>
                      <th className="text-right py-3 px-2">Brut</th>
                      <th className="text-right py-3 px-2">CNSS</th>
                      <th className="text-right py-3 px-2">IPR</th>
                      <th className="text-right py-3 px-2">Net</th>
                    </tr>
                  </thead>
                  <tbody>
                    {(bulletins || []).slice(0, 10).map((b: any, i: number) => (
                      <tr key={i} className="border-b hover:bg-slate-50">
                        <td className="py-3 px-2">{b.employe?.nom || `Employé ${i + 1}`}</td>
                        <td className="text-right py-3 px-2">{formatGNF(b.brutTotal)}</td>
                        <td className="text-right py-3 px-2">{formatGNF(b.cnssEmploye)}</td>
                        <td className="text-right py-3 px-2">{formatGNF(b.ipr)}</td>
                        <td className="text-right py-3 px-2 font-medium text-emerald-600">{formatGNF(b.netAPayer)}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Rapport Fiscal */}
        <TabsContent value="fiscal" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <FileText className="w-5 h-5" />
                Rapports fiscaux - {company?.pays || 'Guinée'}
              </CardTitle>
              <CardDescription>
                Déclarations fiscales et cotisations sociales selon la législation locale
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col items-center justify-center"
                  onClick={() => setRapportActif('cotisations')}
                >
                  <Users className="w-6 h-6 mb-2" />
                  <span>Déclaration CNSS</span>
                </Button>
                <Button 
                  variant="outline" 
                  className="h-24 flex flex-col items-center justify-center"
                  onClick={() => setRapportActif('imposition')}
                >
                  <DollarSign className="w-6 h-6 mb-2" />
                  <span>Déclaration IPR/IR</span>
                </Button>
              </div>
            </CardContent>
          </Card>

          {rapportCotisations && (
            <Card>
              <CardHeader className="flex flex-row items-center justify-between">
                <div>
                  <CardTitle>Déclaration CNSS - {rapportCotisations.periode}</CardTitle>
                  <CardDescription>{rapportCotisations.organisme}</CardDescription>
                </div>
                <Button variant="outline" size="sm">
                  <Printer className="w-4 h-4 mr-2" />
                  Imprimer
                </Button>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2">Matricule</th>
                        <th className="text-left py-3 px-2">Nom</th>
                        <th className="text-right py-3 px-2">Brut</th>
                        <th className="text-right py-3 px-2">CNSS Emp.</th>
                        <th className="text-right py-3 px-2">CNSS Patr.</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rapportCotisations.details?.map((d: any, i: number) => (
                        <tr key={i} className="border-b">
                          <td className="py-2 px-2">{d.matricule}</td>
                          <td className="py-2 px-2">{d.nom}</td>
                          <td className="text-right py-2 px-2">{formatGNF(d.brut)}</td>
                          <td className="text-right py-2 px-2">{formatGNF(d.cotisationEmploye)}</td>
                          <td className="text-right py-2 px-2">{formatGNF(d.cotisationEmployeur)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 font-semibold">
                        <td colSpan={2} className="py-2 px-2">Total</td>
                        <td className="text-right py-2 px-2">{formatGNF(rapportCotisations.totaux?.totalBrut)}</td>
                        <td className="text-right py-2 px-2">{formatGNF(rapportCotisations.totaux?.totalCotisationEmploye)}</td>
                        <td className="text-right py-2 px-2">{formatGNF(rapportCotisations.totaux?.totalCotisationEmployeur)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}

          {rapportImposition && (
            <Card>
              <CardHeader>
                <CardTitle>Déclaration {rapportImposition.nomImpot} - {rapportImposition.annee}</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-3 px-2">Matricule</th>
                        <th className="text-left py-3 px-2">Nom</th>
                        <th className="text-right py-3 px-2">Brut Annuel</th>
                        <th className="text-right py-3 px-2">Base Imposable</th>
                        <th className="text-right py-3 px-2">Impôt</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rapportImposition.details?.map((d: any, i: number) => (
                        <tr key={i} className="border-b">
                          <td className="py-2 px-2">{d.matricule}</td>
                          <td className="py-2 px-2">{d.nom}</td>
                          <td className="text-right py-2 px-2">{formatGNF(d.brutAnnuel)}</td>
                          <td className="text-right py-2 px-2">{formatGNF(d.baseImposable)}</td>
                          <td className="text-right py-2 px-2 font-medium text-red-600">{formatGNF(d.impot)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot>
                      <tr className="bg-slate-50 font-semibold">
                        <td colSpan={2} className="py-2 px-2">Total</td>
                        <td className="text-right py-2 px-2">{formatGNF(rapportImposition.totaux?.totalBrut)}</td>
                        <td className="text-right py-2 px-2">{formatGNF(rapportImposition.totaux?.totalBaseImposable)}</td>
                        <td className="text-right py-2 px-2 text-red-600">{formatGNF(rapportImposition.totaux?.totalImpot)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
