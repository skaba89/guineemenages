'use client';

import { useState } from 'react';
import { Plus, Search, Edit2, Trash2, Users, User, Mail, Phone, Calendar, Briefcase } from 'lucide-react';
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
import { Employe } from '@/types';

const departements = [
  'Administration',
  'Commercial',
  'Finance',
  'Logistique',
  'Marketing',
  'Ressources Humaines',
  'Technique',
  'Direction'
];

const typesContrat = [
  { value: 'CDI', label: 'CDI - Contrat à durée indéterminée' },
  { value: 'CDD', label: 'CDD - Contrat à durée déterminée' },
  { value: 'APPRENTISSAGE', label: 'Contrat d\'apprentissage' },
  { value: 'STAGE', label: 'Stage' },
];

export function EmployesPage() {
  const { employes, addEmploye, updateEmploye, deleteEmploye } = useAppStore();
  const [search, setSearch] = useState('');
  const [filterDept, setFilterDept] = useState<string>('all');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [editingEmploye, setEditingEmploye] = useState<Employe | null>(null);
  const [formData, setFormData] = useState({
    matricule: '',
    nom: '',
    prenom: '',
    email: '',
    telephone: '',
    adresse: '',
    dateNaissance: '',
    dateEmbauche: new Date().toISOString().split('T')[0],
    poste: '',
    departement: '',
    salaireBase: 0,
    typeContrat: 'CDI' as Employe['typeContrat']
  });

  const filteredEmployes = employes.filter(e => {
    const matchSearch = 
      e.nom.toLowerCase().includes(search.toLowerCase()) ||
      e.prenom.toLowerCase().includes(search.toLowerCase()) ||
      e.matricule.toLowerCase().includes(search.toLowerCase());
    const matchDept = filterDept === 'all' || e.departement === filterDept;
    return matchSearch && matchDept;
  });

  const handleSubmit = () => {
    if (editingEmploye) {
      updateEmploye(editingEmploye.id, formData);
    } else {
      addEmploye(formData);
    }
    setIsDialogOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setFormData({
      matricule: `EMP-${String(employes.length + 1).padStart(3, '0')}`,
      nom: '',
      prenom: '',
      email: '',
      telephone: '',
      adresse: '',
      dateNaissance: '',
      dateEmbauche: new Date().toISOString().split('T')[0],
      poste: '',
      departement: '',
      salaireBase: 0,
      typeContrat: 'CDI'
    });
    setEditingEmploye(null);
  };

  const openEditDialog = (employe: Employe) => {
    setEditingEmploye(employe);
    setFormData({
      matricule: employe.matricule,
      nom: employe.nom,
      prenom: employe.prenom,
      email: employe.email || '',
      telephone: employe.telephone || '',
      adresse: employe.adresse || '',
      dateNaissance: employe.dateNaissance || '',
      dateEmbauche: employe.dateEmbauche,
      poste: employe.poste,
      departement: employe.departement || '',
      salaireBase: employe.salaireBase,
      typeContrat: employe.typeContrat
    });
    setIsDialogOpen(true);
  };

  const stats = {
    total: employes.length,
    actifs: employes.filter(e => e.actif).length,
    cdi: employes.filter(e => e.typeContrat === 'CDI').length,
    masseSalariale: employes.reduce((acc, e) => acc + e.salaireBase, 0),
    parDept: departements.map(d => ({
      nom: d,
      count: employes.filter(e => e.departement === d).length
    })).filter(d => d.count > 0)
  };

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Users className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total employés</p>
                <p className="text-xl font-bold">{stats.total}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <User className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Actifs</p>
                <p className="text-xl font-bold">{stats.actifs}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Briefcase className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">En CDI</p>
                <p className="text-xl font-bold">{stats.cdi}</p>
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
                <p className="text-sm text-slate-500">Masse salariale</p>
                <p className="text-xl font-bold">{formatGNF(stats.masseSalariale)}</p>
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
          <Select value={filterDept} onValueChange={setFilterDept}>
            <SelectTrigger className="w-48">
              <SelectValue placeholder="Département" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">Tous les départements</SelectItem>
              {departements.map(d => (
                <SelectItem key={d} value={d}>{d}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvel employé
          </Button>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>{editingEmploye ? 'Modifier l\'employé' : 'Nouvel employé'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="matricule">Matricule</Label>
                  <Input
                    id="matricule"
                    value={formData.matricule}
                    onChange={(e) => setFormData({...formData, matricule: e.target.value})}
                    placeholder="EMP-001"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="typeContrat">Type de contrat</Label>
                  <Select value={formData.typeContrat} onValueChange={(value) => setFormData({...formData, typeContrat: value as Employe['typeContrat']})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {typesContrat.map(t => (
                        <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="nom">Nom *</Label>
                  <Input
                    id="nom"
                    value={formData.nom}
                    onChange={(e) => setFormData({...formData, nom: e.target.value})}
                    placeholder="Nom de famille"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="prenom">Prénom *</Label>
                  <Input
                    id="prenom"
                    value={formData.prenom}
                    onChange={(e) => setFormData({...formData, prenom: e.target.value})}
                    placeholder="Prénom"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="email">Email</Label>
                  <Input
                    id="email"
                    type="email"
                    value={formData.email}
                    onChange={(e) => setFormData({...formData, email: e.target.value})}
                    placeholder="email@exemple.com"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="telephone">Téléphone</Label>
                  <Input
                    id="telephone"
                    value={formData.telephone}
                    onChange={(e) => setFormData({...formData, telephone: e.target.value})}
                    placeholder="+224 620 00 00 00"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="adresse">Adresse</Label>
                <Input
                  id="adresse"
                  value={formData.adresse}
                  onChange={(e) => setFormData({...formData, adresse: e.target.value})}
                  placeholder="Adresse complète"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="dateNaissance">Date de naissance</Label>
                  <Input
                    id="dateNaissance"
                    type="date"
                    value={formData.dateNaissance}
                    onChange={(e) => setFormData({...formData, dateNaissance: e.target.value})}
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="dateEmbauche">Date d'embauche *</Label>
                  <Input
                    id="dateEmbauche"
                    type="date"
                    value={formData.dateEmbauche}
                    onChange={(e) => setFormData({...formData, dateEmbauche: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="poste">Poste *</Label>
                  <Input
                    id="poste"
                    value={formData.poste}
                    onChange={(e) => setFormData({...formData, poste: e.target.value})}
                    placeholder="Intitulé du poste"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="departement">Département</Label>
                  <Select value={formData.departement} onValueChange={(value) => setFormData({...formData, departement: value})}>
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner" />
                    </SelectTrigger>
                    <SelectContent>
                      {departements.map(d => (
                        <SelectItem key={d} value={d}>{d}</SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="salaireBase">Salaire de base (GNF) *</Label>
                <Input
                  id="salaireBase"
                  type="number"
                  value={formData.salaireBase}
                  onChange={(e) => setFormData({...formData, salaireBase: parseInt(e.target.value) || 0})}
                  placeholder="0"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSubmit}>
                {editingEmploye ? 'Modifier' : 'Créer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Employés Table */}
      <Card>
        <CardHeader>
          <CardTitle>{filteredEmployes.length} employé(s)</CardTitle>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Employé</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>Poste</TableHead>
                <TableHead>Département</TableHead>
                <TableHead>Contrat</TableHead>
                <TableHead className="text-right">Salaire</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredEmployes.map((employe) => (
                <TableRow key={employe.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center">
                        <span className="font-semibold text-emerald-600">
                          {employe.prenom[0]}{employe.nom[0]}
                        </span>
                      </div>
                      <div>
                        <p className="font-medium">{employe.prenom} {employe.nom}</p>
                        <p className="text-sm text-slate-500">{employe.matricule}</p>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">
                      <p className="flex items-center gap-1"><Mail className="w-3 h-3" /> {employe.email || '-'}</p>
                      <p className="flex items-center gap-1 text-slate-500"><Phone className="w-3 h-3" /> {employe.telephone || '-'}</p>
                    </div>
                  </TableCell>
                  <TableCell>{employe.poste}</TableCell>
                  <TableCell>
                    <Badge variant="outline">{employe.departement || '-'}</Badge>
                  </TableCell>
                  <TableCell>
                    <Badge variant={employe.typeContrat === 'CDI' ? 'default' : 'secondary'}>
                      {employe.typeContrat}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right font-medium">{formatGNF(employe.salaireBase)}</TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button variant="ghost" size="icon" onClick={() => openEditDialog(employe)}>
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
                            <AlertDialogTitle>Supprimer l'employé ?</AlertDialogTitle>
                            <AlertDialogDescription>
                              Êtes-vous sûr de vouloir supprimer {employe.prenom} {employe.nom} ?
                            </AlertDialogDescription>
                          </AlertDialogHeader>
                          <AlertDialogFooter>
                            <AlertDialogCancel>Annuler</AlertDialogCancel>
                            <AlertDialogAction 
                              className="bg-red-600 hover:bg-red-700"
                              onClick={() => deleteEmploye(employe.id)}
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
