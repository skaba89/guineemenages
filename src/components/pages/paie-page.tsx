'use client';

import { useState } from 'react';
import { Plus, Search, Eye, Calculator, DollarSign, Users, FileCheck, TrendingUp } from 'lucide-react';
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
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { useAppStore } from '@/stores/auth-store';
import { formatGNF, formatDate, calculerCNSS, calculerIPR, mockBulletinsPaie } from '@/lib/mock-data';
import { BulletinPaie, Employe } from '@/types';

const moisOptions = [
  { value: '1', label: 'Janvier' },
  { value: '2', label: 'Février' },
  { value: '3', label: 'Mars' },
  { value: '4', label: 'Avril' },
  { value: '5', label: 'Mai' },
  { value: '6', label: 'Juin' },
  { value: '7', label: 'Juillet' },
  { value: '8', label: 'Août' },
  { value: '9', label: 'Septembre' },
  { value: '10', label: 'Octobre' },
  { value: '11', label: 'Novembre' },
  { value: '12', label: 'Décembre' },
];

export function PaiePage() {
  const { employes } = useAppStore();
  const [bulletins, setBulletins] = useState<BulletinPaie[]>(mockBulletinsPaie);
  const [search, setSearch] = useState('');
  const [filterMois, setFilterMois] = useState<string>(new Date().getMonth().toString());
  const [filterAnnee, setFilterAnnee] = useState<string>(new Date().getFullYear().toString());
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false);
  const [viewingBulletin, setViewingBulletin] = useState<BulletinPaie | null>(null);
  const [formData, setFormData] = useState({
    employeId: '',
    mois: new Date().getMonth() + 1,
    annee: new Date().getFullYear(),
    salaireBase: 0,
    heuresSupplementaires: 0,
    tauxHoraire: 0,
    primes: 0,
    indemnites: 0,
    autresAvantages: 0,
    acomptes: 0,
    autreRetenues: 0
  });

  const filteredBulletins = bulletins.filter(b => {
    const employe = employes.find(e => e.id === b.employeId);
    const matchSearch = employe?.nom.toLowerCase().includes(search.toLowerCase()) ||
      employe?.prenom.toLowerCase().includes(search.toLowerCase());
    const matchMois = filterMois === '' || b.mois === parseInt(filterMois);
    const matchAnnee = filterAnnee === '' || b.annee === parseInt(filterAnnee);
    return matchSearch && matchMois && matchAnnee;
  });

  const calculerBulletin = () => {
    const employe = employes.find(e => e.id === formData.employeId);
    if (!employe) return null;

    const salaireBase = formData.salaireBase || employe.salaireBase;
    const montantHeuresSupp = formData.heuresSupplementaires * formData.tauxHoraire;
    const brutTotal = salaireBase + montantHeuresSupp + formData.primes + formData.indemnites + formData.autresAvantages;
    
    const cnss = calculerCNSS(brutTotal);
    const ipr = calculerIPR(brutTotal, cnss.employe);
    
    const netAPayer = brutTotal - cnss.employe - ipr - formData.acomptes - formData.autreRetenues;
    const coutTotalEmployeur = brutTotal + cnss.employeur;

    return {
      salaireBase,
      montantHeuresSupp,
      brutTotal,
      cnssEmploye: cnss.employe,
      cnssEmployeur: cnss.employeur,
      ipr,
      netAPayer,
      coutTotalEmployeur
    };
  };

  const handleSubmit = () => {
    const calculs = calculerBulletin();
    if (!calculs) return;

    const employe = employes.find(e => e.id === formData.employeId);
    const newBulletin: BulletinPaie = {
      id: `bp_${Date.now()}`,
      employeId: formData.employeId,
      employe,
      mois: formData.mois,
      annee: formData.annee,
      salaireBase: calculs.salaireBase,
      heuresSupplementaires: formData.heuresSupplementaires,
      montantHeuresSupp: calculs.montantHeuresSupp,
      primes: formData.primes,
      indemnites: formData.indemnites,
      autresAvantages: formData.autresAvantages,
      brutTotal: calculs.brutTotal,
      cnssEmploye: calculs.cnssEmploye,
      cnssEmployeur: calculs.cnssEmployeur,
      ipr: calculs.ipr,
      autreRetenues: formData.autreRetenues,
      acomptes: formData.acomptes,
      netAPayer: calculs.netAPayer,
      coutTotalEmployeur: calculs.coutTotalEmployeur,
      statut: 'BROUILLON',
      createdAt: new Date().toISOString()
    };

    setBulletins([...bulletins, newBulletin]);
    setIsDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      employeId: '',
      mois: new Date().getMonth() + 1,
      annee: new Date().getFullYear(),
      salaireBase: 0,
      heuresSupplementaires: 0,
      tauxHoraire: 0,
      primes: 0,
      indemnites: 0,
      autresAvantages: 0,
      acomptes: 0,
      autreRetenues: 0
    });
  };

  const openViewDialog = (bulletin: BulletinPaie) => {
    setViewingBulletin(bulletin);
    setIsViewDialogOpen(true);
  };

  const validerBulletin = (bulletinId: string) => {
    setBulletins(bulletins.map(b => 
      b.id === bulletinId ? { ...b, statut: 'VALIDE' as const } : b
    ));
  };

  const payerBulletin = (bulletinId: string) => {
    setBulletins(bulletins.map(b => 
      b.id === bulletinId ? { 
        ...b, 
        statut: 'PAYE' as const,
        datePaiement: new Date().toISOString().split('T')[0]
      } : b
    ));
  };

  const calculs = calculerBulletin();

  const stats = {
    totalBulletins: bulletins.length,
    payes: bulletins.filter(b => b.statut === 'PAYE').length,
    enAttente: bulletins.filter(b => b.statut === 'BROUILLON' || b.statut === 'VALIDE').length,
    totalNet: bulletins.reduce((acc, b) => acc + b.netAPayer, 0),
    totalCoutEmployeur: bulletins.reduce((acc, b) => acc + b.coutTotalEmployeur, 0),
  };

  const getStatutBadge = (statut: BulletinPaie['statut']) => {
    switch (statut) {
      case 'BROUILLON':
        return <Badge variant="secondary">Brouillon</Badge>;
      case 'VALIDE':
        return <Badge variant="default" className="bg-blue-600">Validé</Badge>;
      case 'PAYE':
        return <Badge variant="default" className="bg-emerald-600">Payé</Badge>;
    }
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <FileCheck className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Bulletins</p>
                <p className="text-xl font-bold">{stats.totalBulletins}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <DollarSign className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Payés</p>
                <p className="text-xl font-bold">{stats.payes}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <TrendingUp className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total net</p>
                <p className="text-lg font-bold">{formatGNF(stats.totalNet)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Users className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Coût employeur</p>
                <p className="text-lg font-bold">{formatGNF(stats.totalCoutEmployeur)}</p>
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
              placeholder="Rechercher un employé..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-10"
            />
          </div>
          <Select value={filterMois} onValueChange={setFilterMois}>
            <SelectTrigger className="w-36">
              <SelectValue placeholder="Mois" />
            </SelectTrigger>
            <SelectContent>
              {moisOptions.map(m => (
                <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={filterAnnee} onValueChange={setFilterAnnee}>
            <SelectTrigger className="w-28">
              <SelectValue placeholder="Année" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="2024">2024</SelectItem>
              <SelectItem value="2023">2023</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Nouveau bulletin
          </Button>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Nouveau bulletin de paie</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-3 gap-4">
                <div className="grid gap-2">
                  <Label>Employé *</Label>
                  <Select value={formData.employeId} onValueChange={(value) => {
                    const emp = employes.find(e => e.id === value);
                    setFormData({
                      ...formData, 
                      employeId: value,
                      salaireBase: emp?.salaireBase || 0
                    });
                  }}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {employes.map(e => (
                        <SelectItem key={e.id} value={e.id}>{e.prenom} {e.nom}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Mois</Label>
                  <Select value={formData.mois.toString()} onValueChange={(value) => setFormData({...formData, mois: parseInt(value)})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {moisOptions.map(m => (
                        <SelectItem key={m.value} value={m.value}>{m.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid gap-2">
                  <Label>Année</Label>
                  <Select value={formData.annee.toString()} onValueChange={(value) => setFormData({...formData, annee: parseInt(value)})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="2024">2024</SelectItem>
                      <SelectItem value="2023">2023</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Éléments du salaire</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Salaire de base (GNF)</Label>
                    <Input
                      type="number"
                      value={formData.salaireBase}
                      onChange={(e) => setFormData({...formData, salaireBase: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Heures supplémentaires</Label>
                    <Input
                      type="number"
                      value={formData.heuresSupplementaires}
                      onChange={(e) => setFormData({...formData, heuresSupplementaires: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Taux horaire HS</Label>
                    <Input
                      type="number"
                      value={formData.tauxHoraire}
                      onChange={(e) => setFormData({...formData, tauxHoraire: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Primes (GNF)</Label>
                    <Input
                      type="number"
                      value={formData.primes}
                      onChange={(e) => setFormData({...formData, primes: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Indemnités (GNF)</Label>
                    <Input
                      type="number"
                      value={formData.indemnites}
                      onChange={(e) => setFormData({...formData, indemnites: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Autres avantages (GNF)</Label>
                    <Input
                      type="number"
                      value={formData.autresAvantages}
                      onChange={(e) => setFormData({...formData, autresAvantages: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>
              </div>

              <div className="border-t pt-4">
                <h4 className="font-medium mb-3">Retenues</h4>
                <div className="grid grid-cols-2 gap-4">
                  <div className="grid gap-2">
                    <Label>Acomptes (GNF)</Label>
                    <Input
                      type="number"
                      value={formData.acomptes}
                      onChange={(e) => setFormData({...formData, acomptes: parseInt(e.target.value) || 0})}
                    />
                  </div>
                  <div className="grid gap-2">
                    <Label>Autres retenues (GNF)</Label>
                    <Input
                      type="number"
                      value={formData.autreRetenues}
                      onChange={(e) => setFormData({...formData, autreRetenues: parseInt(e.target.value) || 0})}
                    />
                  </div>
                </div>
              </div>

              {calculs && (
                <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                  <h4 className="font-medium mb-3 flex items-center gap-2">
                    <Calculator className="w-4 h-4" />
                    Calculs automatiques
                  </h4>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="flex justify-between">
                      <span className="text-slate-500">Brut total</span>
                      <span className="font-medium">{formatGNF(calculs.brutTotal)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">CNSS Employé (5%)</span>
                      <span className="font-medium text-red-600">-{formatGNF(calculs.cnssEmploye)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">CNSS Employeur (18%)</span>
                      <span className="font-medium">{formatGNF(calculs.cnssEmployeur)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-slate-500">IPR</span>
                      <span className="font-medium text-red-600">-{formatGNF(calculs.ipr)}</span>
                    </div>
                  </div>
                  <div className="border-t pt-2 mt-2">
                    <div className="flex justify-between text-lg font-bold">
                      <span>Net à payer</span>
                      <span className="text-emerald-600">{formatGNF(calculs.netAPayer)}</span>
                    </div>
                    <div className="flex justify-between text-sm">
                      <span className="text-slate-500">Coût total employeur</span>
                      <span className="font-medium">{formatGNF(calculs.coutTotalEmployeur)}</span>
                    </div>
                  </div>
                </div>
              )}
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSubmit}>
                Créer le bulletin
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Bulletins Table */}
      <Card>
        <CardHeader>
          <CardTitle>{filteredBulletins.length} bulletin(s)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employé</TableHead>
                <TableHead>Période</TableHead>
                <TableHead className="text-right">Brut</TableHead>
                <TableHead className="text-right">CNSS</TableHead>
                <TableHead className="text-right">IPR</TableHead>
                <TableHead className="text-right">Net à payer</TableHead>
                <TableHead className="text-center">Statut</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredBulletins.map((bulletin) => (
                <TableRow key={bulletin.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{bulletin.employe?.prenom} {bulletin.employe?.nom}</p>
                      <p className="text-sm text-slate-500">{bulletin.employe?.poste}</p>
                    </div>
                  </TableCell>
                  <TableCell>{moisOptions.find(m => m.value === bulletin.mois.toString())?.label} {bulletin.annee}</TableCell>
                  <TableCell className="text-right">{formatGNF(bulletin.brutTotal)}</TableCell>
                  <TableCell className="text-right">{formatGNF(bulletin.cnssEmploye)}</TableCell>
                  <TableCell className="text-right">{formatGNF(bulletin.ipr)}</TableCell>
                  <TableCell className="text-right font-semibold text-emerald-600">{formatGNF(bulletin.netAPayer)}</TableCell>
                  <TableCell className="text-center">{getStatutBadge(bulletin.statut)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openViewDialog(bulletin)}>
                        <Eye className="w-4 h-4" />
                      </Button>
                      {bulletin.statut === 'BROUILLON' && (
                        <Button variant="ghost" size="icon" onClick={() => validerBulletin(bulletin.id)}>
                          <FileCheck className="w-4 h-4 text-blue-600" />
                        </Button>
                      )}
                      {bulletin.statut === 'VALIDE' && (
                        <Button variant="ghost" size="icon" onClick={() => payerBulletin(bulletin.id)}>
                          <DollarSign className="w-4 h-4 text-emerald-600" />
                        </Button>
                      )}
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
            <DialogTitle>Bulletin de paie</DialogTitle>
          </DialogHeader>
          {viewingBulletin && (
            <div className="space-y-4">
              <div className="bg-slate-50 p-4 rounded-lg">
                <div className="flex justify-between items-start mb-2">
                  <div>
                    <p className="font-bold text-lg">{viewingBulletin.employe?.prenom} {viewingBulletin.employe?.nom}</p>
                    <p className="text-sm text-slate-500">{viewingBulletin.employe?.poste}</p>
                  </div>
                  {getStatutBadge(viewingBulletin.statut)}
                </div>
                <p className="text-sm">
                  {moisOptions.find(m => m.value === viewingBulletin.mois.toString())?.label} {viewingBulletin.annee}
                </p>
              </div>
              
              <div className="space-y-2">
                <h4 className="font-medium">Gains</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between"><span>Salaire de base</span><span>{formatGNF(viewingBulletin.salaireBase)}</span></div>
                  {viewingBulletin.montantHeuresSupp > 0 && (
                    <div className="flex justify-between"><span>Heures supp. ({viewingBulletin.heuresSupplementaires}h)</span><span>{formatGNF(viewingBulletin.montantHeuresSupp)}</span></div>
                  )}
                  {viewingBulletin.primes > 0 && (
                    <div className="flex justify-between"><span>Primes</span><span>{formatGNF(viewingBulletin.primes)}</span></div>
                  )}
                  {viewingBulletin.indemnites > 0 && (
                    <div className="flex justify-between"><span>Indemnités</span><span>{formatGNF(viewingBulletin.indemnites)}</span></div>
                  )}
                  <div className="flex justify-between font-semibold border-t pt-1"><span>Brut total</span><span>{formatGNF(viewingBulletin.brutTotal)}</span></div>
                </div>
              </div>

              <div className="space-y-2">
                <h4 className="font-medium">Retenues</h4>
                <div className="text-sm space-y-1">
                  <div className="flex justify-between"><span>CNSS (5%)</span><span className="text-red-600">-{formatGNF(viewingBulletin.cnssEmploye)}</span></div>
                  <div className="flex justify-between"><span>IPR</span><span className="text-red-600">-{formatGNF(viewingBulletin.ipr)}</span></div>
                  {viewingBulletin.acomptes > 0 && (
                    <div className="flex justify-between"><span>Acomptes</span><span className="text-red-600">-{formatGNF(viewingBulletin.acomptes)}</span></div>
                  )}
                </div>
              </div>

              <div className="border-t pt-3">
                <div className="flex justify-between text-xl font-bold">
                  <span>Net à payer</span>
                  <span className="text-emerald-600">{formatGNF(viewingBulletin.netAPayer)}</span>
                </div>
                <div className="flex justify-between text-sm text-slate-500 mt-1">
                  <span>Coût total employeur</span>
                  <span>{formatGNF(viewingBulletin.coutTotalEmployeur)}</span>
                </div>
              </div>

              {viewingBulletin.datePaiement && (
                <p className="text-sm text-emerald-600 text-center">
                  Payé le {formatDate(viewingBulletin.datePaiement)}
                </p>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
