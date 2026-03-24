'use client';

import { useState, useEffect } from 'react';
import {
  Package, AlertTriangle, TrendingDown, TrendingUp, Warehouse, ArrowRightLeft,
  Plus, Search, Filter, MoreHorizontal, Eye, Edit, Trash2,
  BarChart3, Calendar, DollarSign, Building, ClipboardList, RefreshCw
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import api from '@/lib/api';
import { useAppStore } from '@/stores/auth-store';

interface StockAlert {
  produitId: string;
  type: 'STOCK_BAS' | 'RUPTURE' | 'SURSTOCK';
  seuil: number;
  actuel: number;
  produit?: {
    id: string;
    nom: string;
    reference?: string;
    categorie?: string;
    prixUnitaire: number;
  };
}

interface StockMovement {
  id: string;
  action: string;
  table: string;
  recordId: string;
  details: {
    quantite: number;
    ancienStock: number;
    nouveauStock: number;
    raison?: string;
    reference?: string;
  };
  produit?: {
    nom: string;
    reference?: string;
  };
  createdAt: string;
}

interface Entrepot {
  id: string;
  nom: string;
  code?: string;
  adresse?: string;
  ville?: string;
  actif: boolean;
  parDefaut: boolean;
}

interface Valuation {
  totalValue: number;
  totalItems: number;
  byCategory: Record<string, { value: number; count: number }>;
}

export function StockPage() {
  const { user } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');

  // Data states
  const [alerts, setAlerts] = useState<StockAlert[]>([]);
  const [lowStockProducts, setLowStockProducts] = useState<any[]>([]);
  const [movements, setMovements] = useState<StockMovement[]>([]);
  const [entrepots, setEntrepots] = useState<Entrepot[]>([]);
  const [valuation, setValuation] = useState<Valuation | null>(null);

  // Filter states
  const [search, setSearch] = useState('');
  const [alertFilter, setAlertFilter] = useState<string>('all');
  const [entrepotFilter, setEntrepotFilter] = useState<string>('all');

  // Dialog states
  const [showMovementDialog, setShowMovementDialog] = useState(false);
  const [showEntrepotDialog, setShowEntrepotDialog] = useState(false);
  const [showTransferDialog, setShowTransferDialog] = useState(false);

  // Form states
  const [movementForm, setMovementForm] = useState({
    produitId: '',
    type: 'ENTREE' as 'ENTREE' | 'SORTIE' | 'AJUSTEMENT',
    quantite: 0,
    raison: '',
    reference: ''
  });

  const [entrepotForm, setEntrepotForm] = useState({
    nom: '',
    code: '',
    adresse: '',
    ville: '',
    responsable: ''
  });

  const [transferForm, setTransferForm] = useState({
    entrepotSourceId: '',
    entrepotDestId: '',
    produits: [{ produitId: '', quantite: 0 }],
    notes: ''
  });

  const [produits, setProduits] = useState<any[]>([]);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const promises = [];

      if (activeTab === 'overview' || activeTab === 'alerts') {
        promises.push(
          api.getStockAlerts().then(res => res.success && setAlerts(res.data || [])),
          api.getLowStockProducts().then(res => res.success && setLowStockProducts(res.data || []))
        );
      }

      if (activeTab === 'movements') {
        promises.push(
          api.getStockHistory({ limit: 50 }).then(res => res.success && setMovements(res.data || []))
        );
      }

      if (activeTab === 'warehouses') {
        promises.push(
          api.getEntrepots().then(res => res.success && setEntrepots(res.data || []))
        );
      }

      if (activeTab === 'valuation') {
        promises.push(
          api.request('/stock/valuation').then(res => res.success && setValuation(res.data))
        );
      }

      promises.push(
        api.getProduits().then(res => res.success && setProduits(res.data || []))
      );

      await Promise.all(promises);
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateMovement = async () => {
    try {
      const response = await api.request('/stock/movement', {
        method: 'POST',
        body: JSON.stringify(movementForm),
      });

      if (response.success) {
        setShowMovementDialog(false);
        setMovementForm({
          produitId: '',
          type: 'ENTREE',
          quantite: 0,
          raison: '',
          reference: ''
        });
        loadData();
        alert('Mouvement de stock enregistré');
      } else {
        alert(response.message || 'Erreur lors de l\'enregistrement');
      }
    } catch (error) {
      console.error('Erreur mouvement:', error);
    }
  };

  const handleCreateEntrepot = async () => {
    try {
      const response = await api.createEntrepot(entrepotForm);

      if (response.success) {
        setShowEntrepotDialog(false);
        setEntrepotForm({
          nom: '',
          code: '',
          adresse: '',
          ville: '',
          responsable: ''
        });
        loadData();
        alert('Entrepôt créé avec succès');
      } else {
        alert(response.message || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('Erreur création entrepôt:', error);
    }
  };

  const handleCreateTransfer = async () => {
    try {
      const response = await api.createTransfert({
        entrepotSourceId: transferForm.entrepotSourceId,
        entrepotDestId: transferForm.entrepotDestId,
        produits: transferForm.produits.filter(p => p.produitId && p.quantite > 0),
        notes: transferForm.notes
      });

      if (response.success) {
        setShowTransferDialog(false);
        setTransferForm({
          entrepotSourceId: '',
          entrepotDestId: '',
          produits: [{ produitId: '', quantite: 0 }],
          notes: ''
        });
        loadData();
        alert('Transfert créé avec succès');
      } else {
        alert(response.message || 'Erreur lors du transfert');
      }
    } catch (error) {
      console.error('Erreur transfert:', error);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-GN').format(amount) + ' GNF';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const getAlertBadge = (type: string) => {
    switch (type) {
      case 'RUPTURE':
        return <Badge className="bg-red-100 text-red-800">Rupture de stock</Badge>;
      case 'STOCK_BAS':
        return <Badge className="bg-amber-100 text-amber-800">Stock bas</Badge>;
      case 'SURSTOCK':
        return <Badge className="bg-blue-100 text-blue-800">Surstock</Badge>;
      default:
        return <Badge>Unknown</Badge>;
    }
  };

  const getMovementBadge = (action: string) => {
    if (action.includes('ENTREE')) return <Badge className="bg-green-100 text-green-800">Entrée</Badge>;
    if (action.includes('SORTIE')) return <Badge className="bg-red-100 text-red-800">Sortie</Badge>;
    if (action.includes('AJUSTEMENT')) return <Badge className="bg-blue-100 text-blue-800">Ajustement</Badge>;
    if (action.includes('TRANSFERT')) return <Badge className="bg-purple-100 text-purple-800">Transfert</Badge>;
    return <Badge>{action}</Badge>;
  };

  const filteredAlerts = alerts.filter(a => {
    const matchesType = alertFilter === 'all' || a.type === alertFilter;
    const matchesSearch = a.produit?.nom?.toLowerCase().includes(search.toLowerCase()) ||
      a.produit?.reference?.toLowerCase().includes(search.toLowerCase());
    return matchesType && matchesSearch;
  });

  const ruptureCount = alerts.filter(a => a.type === 'RUPTURE').length;
  const stockBasCount = alerts.filter(a => a.type === 'STOCK_BAS').length;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Gestion des Stocks</h2>
          <p className="text-slate-500">Alertes, mouvements et valorisation</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowTransferDialog(true)}>
            <ArrowRightLeft className="w-4 h-4 mr-2" />
            Transfert
          </Button>
          <Button variant="outline" onClick={() => setShowMovementDialog(true)}>
            <RefreshCw className="w-4 h-4 mr-2" />
            Mouvement
          </Button>
          <Button onClick={() => setShowEntrepotDialog(true)} className="bg-emerald-600 hover:bg-emerald-700">
            <Plus className="w-4 h-4 mr-2" />
            Nouvel entrepôt
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-red-100 rounded-lg">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Ruptures de stock</p>
                <p className="text-2xl font-bold text-red-600">{ruptureCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-lg">
                <TrendingDown className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Stock bas</p>
                <p className="text-2xl font-bold text-amber-600">{stockBasCount}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Warehouse className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Entrepôts</p>
                <p className="text-2xl font-bold">{entrepots.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-emerald-100 rounded-lg">
                <DollarSign className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Valeur stock</p>
                <p className="text-lg font-bold">{formatCurrency(valuation?.totalValue || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="overview">Vue d'ensemble</TabsTrigger>
          <TabsTrigger value="alerts">Alertes</TabsTrigger>
          <TabsTrigger value="movements">Mouvements</TabsTrigger>
          <TabsTrigger value="warehouses">Entrepôts</TabsTrigger>
          <TabsTrigger value="valuation">Valorisation</TabsTrigger>
        </TabsList>

        {/* Overview Tab */}
        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {/* Alertes récentes */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5 text-amber-500" />
                  Alertes récentes
                </CardTitle>
              </CardHeader>
              <CardContent>
                {alerts.length === 0 ? (
                  <p className="text-slate-500 text-center py-4">Aucune alerte</p>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {alerts.slice(0, 10).map((alert, index) => (
                      <div key={index} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-medium">{alert.produit?.nom || 'Produit inconnu'}</p>
                          <p className="text-sm text-slate-500">
                            Stock: {alert.actuel} / Min: {alert.seuil}
                          </p>
                        </div>
                        {getAlertBadge(alert.type)}
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Produits en stock bas */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingDown className="w-5 h-5 text-red-500" />
                  Produits en stock bas
                </CardTitle>
              </CardHeader>
              <CardContent>
                {lowStockProducts.length === 0 ? (
                  <p className="text-slate-500 text-center py-4">Tous les stocks sont OK</p>
                ) : (
                  <div className="space-y-3 max-h-80 overflow-y-auto">
                    {lowStockProducts.slice(0, 10).map((product: any) => (
                      <div key={product.id} className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                        <div>
                          <p className="font-medium">{product.nom}</p>
                          <p className="text-sm text-slate-500">
                            {product.reference && <span className="mr-2">Ref: {product.reference}</span>}
                          </p>
                        </div>
                        <div className="text-right">
                          <p className="font-medium">{product.stockActuel} / {product.stockMin}</p>
                          <Progress
                            value={Math.min((product.stockActuel / (product.stockMin * 2)) * 100, 100)}
                            className="w-20 h-2"
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Alerts Tab */}
        <TabsContent value="alerts" className="space-y-4">
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Rechercher un produit..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={alertFilter} onValueChange={setAlertFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Tous les types" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les types</SelectItem>
                    <SelectItem value="RUPTURE">Rupture</SelectItem>
                    <SelectItem value="STOCK_BAS">Stock bas</SelectItem>
                    <SelectItem value="SURSTOCK">Surstock</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Produit</TableHead>
                    <TableHead>Référence</TableHead>
                    <TableHead>Catégorie</TableHead>
                    <TableHead className="text-center">Stock actuel</TableHead>
                    <TableHead className="text-center">Seuil</TableHead>
                    <TableHead className="text-center">Type</TableHead>
                    <TableHead className="text-right">Valeur</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                        Chargement...
                      </TableCell>
                    </TableRow>
                  ) : filteredAlerts.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                        Aucune alerte trouvée
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredAlerts.map((alert, index) => (
                      <TableRow key={index}>
                        <TableCell className="font-medium">{alert.produit?.nom}</TableCell>
                        <TableCell>{alert.produit?.reference || '-'}</TableCell>
                        <TableCell>
                          <Badge variant="outline">{alert.produit?.categorie || 'Non classé'}</Badge>
                        </TableCell>
                        <TableCell className="text-center">
                          <span className={alert.actuel === 0 ? 'text-red-600 font-bold' : ''}>
                            {alert.actuel}
                          </span>
                        </TableCell>
                        <TableCell className="text-center">{alert.seuil}</TableCell>
                        <TableCell className="text-center">{getAlertBadge(alert.type)}</TableCell>
                        <TableCell className="text-right">
                          {formatCurrency(alert.actuel * (alert.produit?.prixUnitaire || 0))}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Movements Tab */}
        <TabsContent value="movements" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex justify-between items-center">
                <CardTitle>Historique des mouvements</CardTitle>
                <Button variant="outline" size="sm" onClick={() => setShowMovementDialog(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Nouveau mouvement
                </Button>
              </div>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Produit</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead className="text-center">Quantité</TableHead>
                    <TableHead className="text-center">Ancien</TableHead>
                    <TableHead className="text-center">Nouveau</TableHead>
                    <TableHead>Raison</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                        Chargement...
                      </TableCell>
                    </TableRow>
                  ) : movements.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                        Aucun mouvement enregistré
                      </TableCell>
                    </TableRow>
                  ) : (
                    movements.map((movement) => (
                      <TableRow key={movement.id}>
                        <TableCell className="text-sm">{formatDate(movement.createdAt)}</TableCell>
                        <TableCell className="font-medium">{movement.produit?.nom || 'N/A'}</TableCell>
                        <TableCell>{getMovementBadge(movement.action)}</TableCell>
                        <TableCell className="text-center font-medium">
                          {movement.action.includes('ENTREE') ? '+' : '-'}{movement.details?.quantite || 0}
                        </TableCell>
                        <TableCell className="text-center">{movement.details?.ancienStock || 0}</TableCell>
                        <TableCell className="text-center">{movement.details?.nouveauStock || 0}</TableCell>
                        <TableCell className="text-sm text-slate-500">
                          {movement.details?.raison || movement.details?.reference || '-'}
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Warehouses Tab */}
        <TabsContent value="warehouses" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {entrepots.map((entrepot) => (
              <Card key={entrepot.id}>
                <CardHeader className="pb-3">
                  <div className="flex justify-between items-start">
                    <div>
                      <CardTitle className="flex items-center gap-2">
                        <Warehouse className="w-5 h-5" />
                        {entrepot.nom}
                      </CardTitle>
                      {entrepot.code && (
                        <p className="text-sm text-slate-500">Code: {entrepot.code}</p>
                      )}
                    </div>
                    <div className="flex gap-1">
                      {entrepot.parDefaut && (
                        <Badge className="bg-emerald-100 text-emerald-800">Par défaut</Badge>
                      )}
                      {!entrepot.actif && (
                        <Badge variant="secondary">Inactif</Badge>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2 text-sm">
                    {entrepot.adresse && (
                      <p className="text-slate-600">{entrepot.adresse}</p>
                    )}
                    {entrepot.ville && (
                      <p className="text-slate-500">{entrepot.ville}</p>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>

        {/* Valuation Tab */}
        <TabsContent value="valuation" className="space-y-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-slate-500">Valeur totale</p>
                  <p className="text-3xl font-bold text-emerald-600">{formatCurrency(valuation?.totalValue || 0)}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-slate-500">Articles en stock</p>
                  <p className="text-3xl font-bold">{valuation?.totalItems || 0}</p>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="text-center">
                  <p className="text-sm text-slate-500">Catégories</p>
                  <p className="text-3xl font-bold">{Object.keys(valuation?.byCategory || {}).length}</p>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Valeur par catégorie</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Catégorie</TableHead>
                    <TableHead className="text-center">Articles</TableHead>
                    <TableHead className="text-right">Valeur</TableHead>
                    <TableHead className="text-right">% du total</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {Object.entries(valuation?.byCategory || {}).map(([category, data]) => (
                    <TableRow key={category}>
                      <TableCell className="font-medium">{category}</TableCell>
                      <TableCell className="text-center">{data.count}</TableCell>
                      <TableCell className="text-right">{formatCurrency(data.value)}</TableCell>
                      <TableCell className="text-right">
                        {valuation?.totalValue ? ((data.value / valuation.totalValue) * 100).toFixed(1) : 0}%
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Movement Dialog */}
      <Dialog open={showMovementDialog} onOpenChange={setShowMovementDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Mouvement de stock</DialogTitle>
            <DialogDescription>
              Enregistrer une entrée, sortie ou ajustement
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Type de mouvement</Label>
              <Select value={movementForm.type} onValueChange={(v: any) => setMovementForm({ ...movementForm, type: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="ENTREE">Entrée</SelectItem>
                  <SelectItem value="SORTIE">Sortie</SelectItem>
                  <SelectItem value="AJUSTEMENT">Ajustement</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Produit</Label>
              <Select value={movementForm.produitId} onValueChange={(v) => setMovementForm({ ...movementForm, produitId: v })}>
                <SelectTrigger>
                  <SelectValue placeholder="Sélectionner un produit" />
                </SelectTrigger>
                <SelectContent>
                  {produits.map(p => (
                    <SelectItem key={p.id} value={p.id}>{p.nom} (Stock: {p.stockActuel})</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Quantité</Label>
              <Input
                type="number"
                value={movementForm.quantite}
                onChange={(e) => setMovementForm({ ...movementForm, quantite: parseInt(e.target.value) || 0 })}
                min={1}
              />
            </div>

            <div className="space-y-2">
              <Label>Raison</Label>
              <Input
                value={movementForm.raison}
                onChange={(e) => setMovementForm({ ...movementForm, raison: e.target.value })}
                placeholder="Raison du mouvement"
              />
            </div>

            <div className="space-y-2">
              <Label>Référence</Label>
              <Input
                value={movementForm.reference}
                onChange={(e) => setMovementForm({ ...movementForm, reference: e.target.value })}
                placeholder="N° de bon, facture, etc."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowMovementDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateMovement} className="bg-emerald-600 hover:bg-emerald-700">
              Enregistrer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Entrepot Dialog */}
      <Dialog open={showEntrepotDialog} onOpenChange={setShowEntrepotDialog}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Nouvel entrepôt</DialogTitle>
            <DialogDescription>
              Créer un nouvel entrepôt ou dépôt de stockage
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Nom *</Label>
                <Input
                  value={entrepotForm.nom}
                  onChange={(e) => setEntrepotForm({ ...entrepotForm, nom: e.target.value })}
                  placeholder="Nom de l'entrepôt"
                />
              </div>
              <div className="space-y-2">
                <Label>Code</Label>
                <Input
                  value={entrepotForm.code}
                  onChange={(e) => setEntrepotForm({ ...entrepotForm, code: e.target.value })}
                  placeholder="Code court"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Adresse</Label>
              <Input
                value={entrepotForm.adresse}
                onChange={(e) => setEntrepotForm({ ...entrepotForm, adresse: e.target.value })}
                placeholder="Adresse"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ville</Label>
                <Input
                  value={entrepotForm.ville}
                  onChange={(e) => setEntrepotForm({ ...entrepotForm, ville: e.target.value })}
                  placeholder="Ville"
                />
              </div>
              <div className="space-y-2">
                <Label>Responsable</Label>
                <Input
                  value={entrepotForm.responsable}
                  onChange={(e) => setEntrepotForm({ ...entrepotForm, responsable: e.target.value })}
                  placeholder="Nom du responsable"
                />
              </div>
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowEntrepotDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateEntrepot} className="bg-emerald-600 hover:bg-emerald-700">
              Créer l'entrepôt
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Transfer Dialog */}
      <Dialog open={showTransferDialog} onOpenChange={setShowTransferDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Transfert de stock</DialogTitle>
            <DialogDescription>
              Transférer des produits entre entrepôts
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Entrepôt source</Label>
                <Select value={transferForm.entrepotSourceId} onValueChange={(v) => setTransferForm({ ...transferForm, entrepotSourceId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {entrepots.filter(e => e.actif).map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Entrepôt destination</Label>
                <Select value={transferForm.entrepotDestId} onValueChange={(v) => setTransferForm({ ...transferForm, entrepotDestId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner" />
                  </SelectTrigger>
                  <SelectContent>
                    {entrepots.filter(e => e.actif && e.id !== transferForm.entrepotSourceId).map(e => (
                      <SelectItem key={e.id} value={e.id}>{e.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <Label>Produits à transférer</Label>
              {transferForm.produits.map((p, index) => (
                <div key={index} className="flex gap-2">
                  <Select value={p.produitId} onValueChange={(v) => {
                    const newProduits = [...transferForm.produits];
                    newProduits[index].produitId = v;
                    setTransferForm({ ...transferForm, produits: newProduits });
                  }}>
                    <SelectTrigger className="flex-1">
                      <SelectValue placeholder="Produit" />
                    </SelectTrigger>
                    <SelectContent>
                      {produits.map(prod => (
                        <SelectItem key={prod.id} value={prod.id}>{prod.nom}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                  <Input
                    type="number"
                    placeholder="Qté"
                    value={p.quantite}
                    onChange={(e) => {
                      const newProduits = [...transferForm.produits];
                      newProduits[index].quantite = parseInt(e.target.value) || 0;
                      setTransferForm({ ...transferForm, produits: newProduits });
                    }}
                    className="w-24"
                  />
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      if (transferForm.produits.length > 1) {
                        setTransferForm({
                          ...transferForm,
                          produits: transferForm.produits.filter((_, i) => i !== index)
                        });
                      }
                    }}
                    className="text-red-500"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
              <Button
                variant="outline"
                size="sm"
                onClick={() => setTransferForm({
                  ...transferForm,
                  produits: [...transferForm.produits, { produitId: '', quantite: 0 }]
                })}
              >
                <Plus className="w-4 h-4 mr-1" />
                Ajouter produit
              </Button>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={transferForm.notes}
                onChange={(e) => setTransferForm({ ...transferForm, notes: e.target.value })}
                placeholder="Notes..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowTransferDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateTransfer} className="bg-emerald-600 hover:bg-emerald-700">
              Créer le transfert
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default StockPage;
