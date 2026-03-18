'use client';

import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, TrendingDown, CreditCard, Wallet, Receipt, Calendar, ArrowUpRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
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
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from '@/components/ui/dialog';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@/components/ui/alert-dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppStore } from '@/stores/auth-store';
import { formatGNF, formatDate, categoriesDepenses } from '@/lib/mock-data';
import { Depense } from '@/types';

const modesPaiement = [
  { value: 'ESPECES', label: 'Espèces', icon: Wallet },
  { value: 'VIREMENT', label: 'Virement', icon: CreditCard },
  { value: 'ORANGE_MONEY', label: 'Orange Money', icon: Wallet },
  { value: 'MTN_MONEY', label: 'MTN Money', icon: Wallet },
  { value: 'CHEQUE', label: 'Chèque', icon: Receipt },
  { value: 'CARTE', label: 'Carte bancaire', icon: CreditCard },
];

export function DepensesPage() {
  const { depenses, addDepense, updateDepense, deleteDepense } = useAppStore();
  const [search, setSearch] = useState('');
  const [filterCategorie, setFilterCategorie] = useState<string>('all');
  const [filterMois, setFilterMois] = useState<string>('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingDepense, setEditingDepense] = useState<Depense | null>(null);
  const [formData, setFormData] = useState({
    description: '',
    montant: 0,
    categorie: '',
    date: new Date().toISOString().split('T')[0],
    modePaiement: 'ESPECES' as Depense['modePaiement'],
    notes: ''
  });

  const filteredDepenses = depenses.filter(d => {
    const matchSearch = d.description.toLowerCase().includes(search.toLowerCase());
    const matchCategorie = filterCategorie === 'all' || d.categorie === filterCategorie;
    const matchMois = filterMois === '' || d.date.startsWith(filterMois);
    return matchSearch && matchCategorie && matchMois;
  });

  const handleSubmit = () => {
    if (editingDepense) {
      updateDepense(editingDepense.id, formData);
    } else {
      addDepense(formData);
    }
    setIsDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      description: '',
      montant: 0,
      categorie: '',
      date: new Date().toISOString().split('T')[0],
      modePaiement: 'ESPECES',
      notes: ''
    });
    setEditingDepense(null);
  };

  const openEditDialog = (depense: Depense) => {
    setEditingDepense(depense);
    setFormData({
      description: depense.description,
      montant: depense.montant,
      categorie: depense.categorie,
      date: depense.date,
      modePaiement: depense.modePaiement,
      notes: depense.notes || ''
    });
    setIsDialogOpen(true);
  };

  const stats = {
    total: depenses.length,
    totalMontant: depenses.reduce((acc, d) => acc + d.montant, 0),
    ceMois: depenses.filter(d => {
      const now = new Date();
      const depenseDate = new Date(d.date);
      return depenseDate.getMonth() === now.getMonth() && depenseDate.getFullYear() === now.getFullYear();
    }).reduce((acc, d) => acc + d.montant, 0),
    parCategorie: categoriesDepenses.map(c => ({
      nom: c,
      total: depenses.filter(d => d.categorie === c).reduce((acc, d) => acc + d.montant, 0)
    })).filter(c => c.total > 0).sort((a, b) => b.total - a.total),
    parMode: modesPaiement.map(m => ({
      mode: m.label,
      total: depenses.filter(d => d.modePaiement === m.value).reduce((acc, d) => acc + d.montant, 0)
    })).filter(m => m.total > 0)
  };

  const categorieColors: Record<string, string> = {
    'Loyer': 'bg-red-100 text-red-700',
    'Énergie': 'bg-yellow-100 text-yellow-700',
    'Transport': 'bg-blue-100 text-blue-700',
    'Fournitures': 'bg-purple-100 text-purple-700',
    'Maintenance': 'bg-orange-100 text-orange-700',
    'Salaires': 'bg-green-100 text-green-700',
    'Marketing': 'bg-pink-100 text-pink-700',
    'Télécommunications': 'bg-cyan-100 text-cyan-700',
    'Assurance': 'bg-indigo-100 text-indigo-700',
    'Fiscalité': 'bg-rose-100 text-rose-700',
    'Autres': 'bg-gray-100 text-gray-700',
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <TrendingDown className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total dépenses</p>
                <p className="text-xl font-bold">{formatGNF(stats.totalMontant)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Calendar className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Ce mois</p>
                <p className="text-xl font-bold">{formatGNF(stats.ceMois)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Receipt className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Transactions</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <ArrowUpRight className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Moyenne</p>
                <p className="text-xl font-bold">
                  {stats.total > 0 ? formatGNF(Math.round(stats.totalMontant / stats.total)) : '0 GNF'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Par Catégorie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Par catégorie</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.parCategorie.slice(0, 5).map((cat, index) => (
                <div key={cat.nom} className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <div className={`px-2 py-1 rounded text-xs font-medium ${categorieColors[cat.nom] || 'bg-gray-100 text-gray-700'}`}>
                      {cat.nom}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-600 rounded-full" 
                        style={{ width: `${(cat.total / stats.totalMontant) * 100}%` }}
                      />
                    </div>
                    <span className="font-medium text-sm w-28 text-right">{formatGNF(cat.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Par Mode de paiement */}
        <Card>
          <CardHeader>
            <CardTitle className="text-lg">Par mode de paiement</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {stats.parMode.map((m) => (
                <div key={m.mode} className="flex items-center justify-between">
                  <span className="text-sm">{m.mode}</span>
                  <div className="flex items-center gap-3">
                    <div className="w-24 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-blue-600 rounded-full" 
                        style={{ width: `${(m.total / stats.totalMontant) * 100}%` }}
                      />
                    </div>
                    <span className="font-medium text-sm w-28 text-right">{formatGNF(m.total)}</span>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-4 flex-1 flex-wrap">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Rechercher une dépense..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterCategorie} onValueChange={setFilterCategorie}>
            <SelectTrigger className="w-44">
              <SelectValue placeholder="Catégorie" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Toutes catégories</SelectItem>
              {categoriesDepenses.map(c => (
                <SelectItem key={c} value={c}>{c}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Input
            type="month"
            value={filterMois}
            onChange={(e) => setFilterMois(e.target.value)}
            className="w-40"
          />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle dépense
          </Button>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{editingDepense ? 'Modifier la dépense' : 'Nouvelle dépense'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="description">Description *</Label>
                <Input
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData({...formData, description: e.target.value})}
                  placeholder="Description de la dépense"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="montant">Montant (GNF) *</Label>
                  <Input
                    id="montant"
                    type="number"
                    value={formData.montant}
                    onChange={(e) => setFormData({...formData, montant: parseInt(e.target.value) || 0})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="date">Date *</Label>
                  <Input
                    id="date"
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({...formData, date: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="categorie">Catégorie *</Label>
                  <Select value={formData.categorie} onValueChange={(value) => setFormData({...formData, categorie: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {categoriesDepenses.map(c => (
                        <SelectItem key={c} value={c}>{c}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="modePaiement">Mode de paiement</Label>
                  <Select value={formData.modePaiement} onValueChange={(value) => setFormData({...formData, modePaiement: value as Depense['modePaiement']})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {modesPaiement.map(m => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="notes">Notes</Label>
                <Input
                  id="notes"
                  value={formData.notes}
                  onChange={(e) => setFormData({...formData, notes: e.target.value})}
                  placeholder="Notes ou détails supplémentaires"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSubmit}>
                {editingDepense ? 'Modifier' : 'Créer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Depenses Table */}
      <Card>
        <CardHeader>
          <CardTitle>{filteredDepenses.length} dépense(s)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Description</TableHead>
                <TableHead>Catégorie</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Mode de paiement</TableHead>
                <TableHead className="text-right">Montant</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredDepenses.map((depense) => (
                <TableRow key={depense.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{depense.description}</p>
                      {depense.notes && (
                        <p className="text-sm text-slate-500">{depense.notes}</p>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge 
                      variant="outline" 
                      className={categorieColors[depense.categorie] || ''}
                    >
                      {depense.categorie}
                    </Badge>
                  </TableCell>
                  <TableCell>{formatDate(depense.date)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      {(() => {
                        const mode = modesPaiement.find(m => m.value === depense.modePaiement);
                        const Icon = mode?.icon || Wallet;
                        return <Icon className="w-4 h-4 text-slate-400" />;
                      })()}
                      <span className="text-sm">{modesPaiement.find(m => m.value === depense.modePaiement)?.label}</span>
                    </div>
                  </TableCell>
                  <TableCell className="text-right font-semibold text-red-600">
                    -{formatGNF(depense.montant)}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(depense)}>
                        <Edit2 className="w-4 h-4" />
                      </Button>
                      <AlertDialog>
                        <AlertDialogTrigger asChild>
                          <Button variant="ghost" size="icon" className="text-red-600 hover:text-red-700">
                            <Trash2 className="w-4 h-4" />
                          </Button>
                        </AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader>
                            <AlertDialogTitle>Supprimer la dépense ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Êtes-vous sûr de vouloir supprimer "{depense.description}" ?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction 
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => deleteDepense(depense.id)}
                            >
                              Supprimer
                            </AlertDialogAction>
                          </AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    </div>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
