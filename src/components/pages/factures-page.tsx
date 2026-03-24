'use client';

import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, FileText, Eye, Send, CheckCircle, Clock, AlertCircle } from 'lucide-react';
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
import { formatGNF, formatDate } from '@/lib/mock-data';
import { Facture } from '@/types';

const statuts = [
  { value: 'BROUILLON', label: 'Brouillon', color: 'secondary' },
  { value: 'ENVOYEE', label: 'Envoyée', color: 'default' },
  { value: 'PAYEE', label: 'Payée', color: 'success' },
  { value: 'EN_RETARD', label: 'En retard', color: 'destructive' },
  { value: 'ANNULEE', label: 'Annulée', color: 'outline' },
];

const modesPaiement = [
  { value: 'ESPECES', label: 'Espèces' },
  { value: 'VIREMENT', label: 'Virement bancaire' },
  { value: 'ORANGE_MONEY', label: 'Orange Money' },
  { value: 'MTN_MONEY', label: 'MTN Money' },
  { value: 'CHEQUE', label: 'Chèque' },
];

export function FacturesPage() {
  const { factures, clients, addFacture, updateFacture, deleteFacture } = useAppStore();
  const [search, setSearch] = useState('');
  const [filterStatut, setFilterStatut] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [editingFacture, setEditingFacture] = useState<Facture | null>(null);
  const [viewingFacture, setViewingFacture] = useState<Facture | null>(null);
  const [formData, setFormData] = useState({
    clientId: '',
    dateEmission: new Date().toISOString().split('T')[0],
    dateEcheance: '',
    montantHT: 0,
    montantTVA: 0,
    montantTTC: 0,
    statut: 'BROUILLON' as Facture['statut'],
    modePaiement: 'VIREMENT' as Facture['modePaiement'],
    notes: ''
  });

  const filteredFactures = factures.filter(f => {
    const matchSearch = f.numero.toLowerCase().includes(search.toLowerCase()) ||
      f.client?.nom.toLowerCase().includes(search.toLowerCase());
    const matchStatut = filterStatut === 'all' || f.statut === filterStatut;
    return matchSearch && matchStatut;
  });

  const handleSubmit = () => {
    const client = clients.find(c => c.id === formData.clientId);
    const factureData = {
      ...formData,
      client,
      lignes: []
    };

    if (editingFacture) {
      updateFacture(editingFacture.id, factureData);
    } else {
      addFacture(factureData);
    }
    setIsDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      clientId: '',
      dateEmission: new Date().toISOString().split('T')[0],
      dateEcheance: '',
      montantHT: 0,
      montantTVA: 0,
      montantTTC: 0,
      statut: 'BROUILLON',
      modePaiement: 'VIREMENT',
      notes: ''
    });
    setEditingFacture(null);
  };

  const openEditDialog = (facture: Facture) => {
    setEditingFacture(facture);
    setFormData({
      clientId: facture.clientId,
      dateEmission: facture.dateEmission,
      dateEcheance: facture.dateEcheance,
      montantHT: facture.montantHT,
      montantTVA: facture.montantTVA,
      montantTTC: facture.montantTTC,
      statut: facture.statut,
      modePaiement: facture.modePaiement || 'VIREMENT',
      notes: facture.notes || ''
    });
    setIsDialogOpen(true);
  };

  const openViewDialog = (facture: Facture) => {
    setViewingFacture(facture);
    setIsViewDialogOpen(true);
  };

  const handleMontantChange = (montantHT: number) => {
    const montantTVA = Math.round(montantHT * 0.18);
    const montantTTC = montantHT + montantTVA;
    setFormData({ ...formData, montantHT, montantTVA, montantTTC });
  };

  const getStatutBadge = (statut: Facture['statut']) => {
    const config = statuts.find(s => s.value === statut);
    return (
      <Badge 
        variant={config?.color as "default" | "secondary" | "destructive" | "outline"}
        className={statut === 'PAYEE' ? 'bg-emerald-600 hover:bg-emerald-700' : ''}
      >
        {config?.label}
      </Badge>
    );
  };

  const stats = {
    total: factures.length,
    payees: factures.filter(f => f.statut === 'PAYEE').length,
    enAttente: factures.filter(f => f.statut === 'ENVOYEE' || f.statut === 'BROUILLON').length,
    enRetard: factures.filter(f => f.statut === 'EN_RETARD').length,
    totalMontant: factures.reduce((acc, f) => acc + f.montantTTC, 0),
    totalPaye: factures.filter(f => f.statut === 'PAYEE').reduce((acc, f) => acc + f.montantTTC, 0),
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileText className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total factures</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <CheckCircle className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Payées</p>
                <p className="text-xl font-bold">{stats.payees}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Clock className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">En attente</p>
                <p className="text-xl font-bold">{stats.enAttente}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-red-100 rounded-lg">
                <AlertCircle className="w-5 h-5 text-red-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">En retard</p>
                <p className="text-xl font-bold">{stats.enRetard}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="flex gap-4 flex-1">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
            <Input
              placeholder="Rechercher une facture..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterStatut} onValueChange={setFilterStatut}>
            <SelectTrigger className="w-40">
              <SelectValue placeholder="Statut" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les statuts</SelectItem>
              {statuts.map(s => (
                <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvelle facture
          </Button>
          <DialogContent className="max-w-lg">
            <DialogHeader>
              <DialogTitle>{editingFacture ? 'Modifier la facture' : 'Nouvelle facture'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="client">Client *</Label>
                <Select value={formData.clientId} onValueChange={(value) => setFormData({...formData, clientId: value})}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(c => (
                      <SelectItem key={c.id} value={c.id}>{c.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="dateEmission">Date d'émission</Label>
                  <Input
                    id="dateEmission"
                    type="date"
                    value={formData.dateEmission}
                    onChange={(e) => setFormData({...formData, dateEmission: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dateEcheance">Date d'échéance</Label>
                  <Input
                    id="dateEcheance"
                    type="date"
                    value={formData.dateEcheance}
                    onChange={(e) => setFormData({...formData, dateEcheance: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="montantHT">Montant HT (GNF)</Label>
                <Input
                  id="montantHT"
                  type="number"
                  value={formData.montantHT}
                  onChange={(e) => handleMontantChange(parseInt(e.target.value) || 0)}
                />
              </div>
              <div className="grid grid-cols-2 gap-4 bg-slate-50 p-3 rounded-lg">
                <div>
                  <p className="text-sm text-slate-500">TVA (18%)</p>
                  <p className="font-semibold">{formatGNF(formData.montantTVA)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Montant TTC</p>
                  <p className="font-bold text-emerald-600">{formatGNF(formData.montantTTC)}</p>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="statut">Statut</Label>
                  <Select value={formData.statut} onValueChange={(value) => setFormData({...formData, statut: value as Facture['statut']})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {statuts.map(s => (
                        <SelectItem key={s.value} value={s.value}>{s.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="modePaiement">Mode de paiement</Label>
                  <Select value={formData.modePaiement} onValueChange={(value) => setFormData({...formData, modePaiement: value as Facture['modePaiement']})}>
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
                  placeholder="Notes ou remarques..."
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSubmit}>
                {editingFacture ? 'Modifier' : 'Créer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Factures Table */}
      <Card>
        <CardHeader>
          <CardTitle>{filteredFactures.length} facture(s)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>N° Facture</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Échéance</TableHead>
                <TableHead className="text-right">Montant TTC</TableHead>
                <TableHead className="text-center">Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredFactures.map((facture) => (
                <TableRow key={facture.id}>
                  <TableCell className="font-medium">{facture.numero}</TableCell>
                  <TableCell>{facture.client?.nom || '-'}</TableCell>
                  <TableCell>{formatDate(facture.dateEmission)}</TableCell>
                  <TableCell>{formatDate(facture.dateEcheance)}</TableCell>
                  <TableCell className="text-right font-semibold">{formatGNF(facture.montantTTC)}</TableCell>
                  <TableCell className="text-center">{getStatutBadge(facture.statut)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openViewDialog(facture)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(facture)}>
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
                            <AlertDialogTitle>Supprimer la facture ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Êtes-vous sûr de vouloir supprimer la facture {facture.numero} ?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction 
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => deleteFacture(facture.id)}
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

      {/* View Dialog */}
      <Dialog open={isViewDialogOpen} onOpenChange={setIsViewDialogOpen}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>Détails de la facture</DialogTitle>
          </DialogHeader>
          {viewingFacture && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg">
                <div className="flex justify-between items-center mb-2">
                  <span className="text-2xl font-bold">{viewingFacture.numero}</span>
                  {getStatutBadge(viewingFacture.statut)}
                </div>
                <p className="text-slate-500">Client: {viewingFacture.client?.nom}</p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Date d'émission</p>
                  <p className="font-medium">{formatDate(viewingFacture.dateEmission)}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Date d'échéance</p>
                  <p className="font-medium">{formatDate(viewingFacture.dateEcheance)}</p>
                </div>
              </div>
              <div className="border-t pt-4">
                <div className="flex justify-between mb-2">
                  <span className="text-slate-500">Montant HT</span>
                  <span className="font-medium">{formatGNF(viewingFacture.montantHT)}</span>
                </div>
                <div className="flex justify-between mb-2">
                  <span className="text-slate-500">TVA (18%)</span>
                  <span className="font-medium">{formatGNF(viewingFacture.montantTVA)}</span>
                </div>
                <div className="flex justify-between text-lg font-bold border-t pt-2">
                  <span>Montant TTC</span>
                  <span className="text-emerald-600">{formatGNF(viewingFacture.montantTTC)}</span>
                </div>
              </div>
              {viewingFacture.modePaiement && (
                <div>
                  <p className="text-sm text-slate-500">Mode de paiement</p>
                  <p className="font-medium">
                    {modesPaiement.find(m => m.value === viewingFacture.modePaiement)?.label}
                  </p>
                </div>
              )}
              {viewingFacture.notes && (
                <div>
                  <p className="text-sm text-slate-500">Notes</p>
                  <p className="font-medium">{viewingFacture.notes}</p>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
