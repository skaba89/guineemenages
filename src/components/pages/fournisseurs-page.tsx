'use client';

import { useState, useEffect } from 'react';
import {
  Truck, Plus, Search, Filter, MoreHorizontal, Eye, Edit, Trash2,
  Phone, Mail, MapPin, Building, Calendar, DollarSign, FileText,
  Package, CheckCircle, Clock, AlertCircle
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
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

interface Fournisseur {
  id: string;
  code?: string;
  nom: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  ville?: string;
  pays: string;
  ninea?: string;
  contactNom?: string;
  contactTel?: string;
  notes?: string;
  actif: boolean;
  commandes?: Array<{
    id: string;
    numero: string;
    montantTTC: number;
    statut: string;
    dateCommande: string;
  }>;
  _count?: {
    commandes: number;
  };
}

interface CommandeFournisseur {
  id: string;
  numero: string;
  fournisseurId: string;
  fournisseur: Fournisseur;
  dateCommande: string;
  dateLivraisonPrevue?: string;
  dateLivraison?: string;
  montantHT: number;
  montantTVA: number;
  montantTTC: number;
  statut: 'BROUILLON' | 'EN_ATTENTE' | 'CONFIRME' | 'RECU_PARTIEL' | 'RECU' | 'ANNULE';
  modePaiement?: string;
  notes?: string;
  lignes: Array<{
    id: string;
    produitId: string;
    produit: {
      id: string;
      nom: string;
      reference?: string;
    };
    description?: string;
    quantite: number;
    quantiteRecue: number;
    prixUnitaire: number;
    montantHT: number;
    recu: boolean;
  }>;
}

const statusConfig = {
  BROUILLON: { label: 'Brouillon', color: 'bg-gray-100 text-gray-800', icon: FileText },
  EN_ATTENTE: { label: 'En attente', color: 'bg-amber-100 text-amber-800', icon: Clock },
  CONFIRME: { label: 'Confirmé', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  RECU_PARTIEL: { label: 'Réception partielle', color: 'bg-orange-100 text-orange-800', icon: Package },
  RECU: { label: 'Réceptionné', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  ANNULE: { label: 'Annulé', color: 'bg-red-100 text-red-800', icon: AlertCircle },
};

const paysList = [
  'Guinée', 'Sénégal', 'Mali', 'Côte d\'Ivoire', 'Burkina Faso', 'Bénin', 'Niger', 'Autre'
];

export function FournisseursPage() {
  const { user } = useAppStore();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('fournisseurs');

  // Data states
  const [fournisseurs, setFournisseurs] = useState<Fournisseur[]>([]);
  const [commandes, setCommandes] = useState<CommandeFournisseur[]>([]);
  const [stats, setStats] = useState<any>(null);
  const [produits, setProduits] = useState<any[]>([]);

  // Filter states
  const [search, setSearch] = useState('');
  const [paysFilter, setPaysFilter] = useState<string>('all');
  const [statutFilter, setStatutFilter] = useState<string>('all');

  // Dialog states
  const [showFournisseurDialog, setShowFournisseurDialog] = useState(false);
  const [showCommandeDialog, setShowCommandeDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedFournisseur, setSelectedFournisseur] = useState<Fournisseur | null>(null);
  const [selectedCommande, setSelectedCommande] = useState<CommandeFournisseur | null>(null);
  const [editMode, setEditMode] = useState(false);

  // Form states
  const [fournisseurForm, setFournisseurForm] = useState({
    code: '',
    nom: '',
    email: '',
    telephone: '',
    adresse: '',
    ville: '',
    pays: 'Guinée',
    ninea: '',
    contactNom: '',
    contactTel: '',
    notes: ''
  });

  const [commandeForm, setCommandeForm] = useState({
    fournisseurId: '',
    dateLivraisonPrevue: '',
    modePaiement: 'VIREMENT',
    notes: '',
    lignes: [{ produitId: '', quantite: 1, prixUnitaire: 0, description: '' }]
  });

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    setLoading(true);
    try {
      const promises = [];

      if (activeTab === 'fournisseurs') {
        promises.push(
          api.getFournisseurs({ actif: true }).then(res => res.success && setFournisseurs(res.data || [])),
          api.getFournisseurStats().then(res => res.success && setStats(res.data))
        );
      }

      if (activeTab === 'commandes') {
        promises.push(
          api.getCommandesFournisseur().then(res => res.success && setCommandes(res.data || []))
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

  const handleCreateFournisseur = async () => {
    try {
      const response = editMode
        ? await api.updateFournisseur(selectedFournisseur!.id, fournisseurForm)
        : await api.createFournisseur(fournisseurForm);

      if (response.success) {
        setShowFournisseurDialog(false);
        resetFournisseurForm();
        loadData();
        alert(editMode ? 'Fournisseur mis à jour' : 'Fournisseur créé avec succès');
      } else {
        alert(response.message || 'Erreur lors de l\'enregistrement');
      }
    } catch (error) {
      console.error('Erreur création fournisseur:', error);
    }
  };

  const handleDeleteFournisseur = async (id: string) => {
    if (!confirm('Supprimer ce fournisseur ?')) return;

    try {
      const response = await api.deleteFournisseur(id);
      if (response.success) {
        loadData();
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
    }
  };

  const handleCreateCommande = async () => {
    try {
      const response = await api.createCommandeFournisseur({
        fournisseurId: commandeForm.fournisseurId,
        dateLivraisonPrevue: commandeForm.dateLivraisonPrevue || undefined,
        modePaiement: commandeForm.modePaiement,
        notes: commandeForm.notes,
        lignes: commandeForm.lignes.filter(l => l.produitId && l.quantite > 0)
      });

      if (response.success) {
        setShowCommandeDialog(false);
        resetCommandeForm();
        setActiveTab('commandes');
        loadData();
        alert('Commande créée avec succès');
      } else {
        alert(response.message || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('Erreur création commande:', error);
    }
  };

  const handleUpdateCommandeStatus = async (id: string, statut: string) => {
    try {
      const response = await api.updateCommandeFournisseurStatus(id, statut);
      if (response.success) {
        loadData();
      }
    } catch (error) {
      console.error('Erreur mise à jour:', error);
    }
  };

  const handleCancelCommande = async (id: string) => {
    if (!confirm('Annuler cette commande ?')) return;

    try {
      const response = await api.cancelCommandeFournisseur(id);
      if (response.success) {
        loadData();
      }
    } catch (error) {
      console.error('Erreur annulation:', error);
    }
  };

  const resetFournisseurForm = () => {
    setFournisseurForm({
      code: '',
      nom: '',
      email: '',
      telephone: '',
      adresse: '',
      ville: '',
      pays: 'Guinée',
      ninea: '',
      contactNom: '',
      contactTel: '',
      notes: ''
    });
    setEditMode(false);
    setSelectedFournisseur(null);
  };

  const resetCommandeForm = () => {
    setCommandeForm({
      fournisseurId: '',
      dateLivraisonPrevue: '',
      modePaiement: 'VIREMENT',
      notes: '',
      lignes: [{ produitId: '', quantite: 1, prixUnitaire: 0, description: '' }]
    });
  };

  const openEditDialog = (fournisseur: Fournisseur) => {
    setSelectedFournisseur(fournisseur);
    setFournisseurForm({
      code: fournisseur.code || '',
      nom: fournisseur.nom,
      email: fournisseur.email || '',
      telephone: fournisseur.telephone || '',
      adresse: fournisseur.adresse || '',
      ville: fournisseur.ville || '',
      pays: fournisseur.pays,
      ninea: fournisseur.ninea || '',
      contactNom: fournisseur.contactNom || '',
      contactTel: fournisseur.contactTel || '',
      notes: fournisseur.notes || ''
    });
    setEditMode(true);
    setShowFournisseurDialog(true);
  };

  const addLigne = () => {
    setCommandeForm({
      ...commandeForm,
      lignes: [...commandeForm.lignes, { produitId: '', quantite: 1, prixUnitaire: 0, description: '' }]
    });
  };

  const updateLigne = (index: number, field: string, value: any) => {
    const newLignes = [...commandeForm.lignes];
    newLignes[index] = { ...newLignes[index], [field]: value };

    if (field === 'produitId' && value) {
      const produit = produits.find(p => p.id === value);
      if (produit) {
        newLignes[index].prixUnitaire = produit.prixUnitaire;
        newLignes[index].description = produit.nom;
      }
    }

    setCommandeForm({ ...commandeForm, lignes: newLignes });
  };

  const removeLigne = (index: number) => {
    if (commandeForm.lignes.length > 1) {
      setCommandeForm({
        ...commandeForm,
        lignes: commandeForm.lignes.filter((_, i) => i !== index)
      });
    }
  };

  const calculateTotal = () => {
    return commandeForm.lignes.reduce((total, ligne) => {
      return total + (ligne.quantite * ligne.prixUnitaire);
    }, 0);
  };

  const filteredFournisseurs = fournisseurs.filter(f => {
    const matchesSearch = f.nom.toLowerCase().includes(search.toLowerCase()) ||
      f.email?.toLowerCase().includes(search.toLowerCase()) ||
      f.code?.toLowerCase().includes(search.toLowerCase());
    const matchesPays = paysFilter === 'all' || f.pays === paysFilter;
    return matchesSearch && matchesPays;
  });

  const filteredCommandes = commandes.filter(c => {
    const matchesSearch = c.numero.toLowerCase().includes(search.toLowerCase()) ||
      c.fournisseur.nom.toLowerCase().includes(search.toLowerCase());
    const matchesStatut = statutFilter === 'all' || c.statut === statutFilter;
    return matchesSearch && matchesStatut;
  });

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('fr-GN').format(amount) + ' GNF';
  };

  const formatDate = (date: string) => {
    return new Date(date).toLocaleDateString('fr-FR');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h2 className="text-2xl font-bold">Fournisseurs</h2>
          <p className="text-slate-500">Gérez vos fournisseurs et commandes d'achat</p>
        </div>
        <div className="flex gap-2">
          {activeTab === 'fournisseurs' && (
            <Button onClick={() => { resetFournisseurForm(); setShowFournisseurDialog(true); }} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Nouveau fournisseur
            </Button>
          )}
          {activeTab === 'commandes' && (
            <Button onClick={() => { resetCommandeForm(); setShowCommandeDialog(true); }} className="bg-emerald-600 hover:bg-emerald-700">
              <Plus className="w-4 h-4 mr-2" />
              Nouvelle commande
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Truck className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Fournisseurs</p>
                <p className="text-2xl font-bold">{fournisseurs.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-lg">
                <Package className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Commandes en cours</p>
                <p className="text-2xl font-bold">{commandes.filter(c => ['EN_ATTENTE', 'CONFIRME', 'RECU_PARTIEL'].includes(c.statut)).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-100 rounded-lg">
                <CheckCircle className="w-6 h-6 text-green-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Réceptionnées</p>
                <p className="text-2xl font-bold">{commandes.filter(c => c.statut === 'RECU').length}</p>
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
                <p className="text-sm text-slate-500">Montant en cours</p>
                <p className="text-lg font-bold">
                  {formatCurrency(commandes.filter(c => ['EN_ATTENTE', 'CONFIRME'].includes(c.statut)).reduce((sum, c) => sum + c.montantTTC, 0))}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList>
          <TabsTrigger value="fournisseurs">Fournisseurs</TabsTrigger>
          <TabsTrigger value="commandes">Commandes d'achat</TabsTrigger>
        </TabsList>

        {/* Fournisseurs Tab */}
        <TabsContent value="fournisseurs" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Rechercher un fournisseur..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={paysFilter} onValueChange={setPaysFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Tous les pays" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les pays</SelectItem>
                    {paysList.map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Fournisseur</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Localisation</TableHead>
                    <TableHead className="text-center">Commandes</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                        Chargement...
                      </TableCell>
                    </TableRow>
                  ) : filteredFournisseurs.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={6} className="text-center py-8 text-slate-500">
                        Aucun fournisseur trouvé
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredFournisseurs.map((fournisseur) => (
                      <TableRow key={fournisseur.id}>
                        <TableCell className="font-mono">{fournisseur.code || '-'}</TableCell>
                        <TableCell>
                          <div className="font-medium">{fournisseur.nom}</div>
                          {fournisseur.contactNom && (
                            <div className="text-sm text-slate-500">{fournisseur.contactNom}</div>
                          )}
                        </TableCell>
                        <TableCell>
                          <div className="space-y-1">
                            {fournisseur.email && (
                              <div className="flex items-center gap-1 text-sm">
                                <Mail className="w-3 h-3 text-slate-400" />
                                {fournisseur.email}
                              </div>
                            )}
                            {fournisseur.telephone && (
                              <div className="flex items-center gap-1 text-sm">
                                <Phone className="w-3 h-3 text-slate-400" />
                                {fournisseur.telephone}
                              </div>
                            )}
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-slate-400" />
                            <span>{fournisseur.ville || ''}{fournisseur.ville && fournisseur.pays ? ', ' : ''}{fournisseur.pays}</span>
                          </div>
                        </TableCell>
                        <TableCell className="text-center">
                          <Badge variant="outline">{fournisseur._count?.commandes || 0}</Badge>
                        </TableCell>
                        <TableCell className="text-right">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="sm">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onClick={() => {
                                setSelectedFournisseur(fournisseur);
                                setShowViewDialog(true);
                              }}>
                                <Eye className="w-4 h-4 mr-2" />
                                Voir détails
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => openEditDialog(fournisseur)}>
                                <Edit className="w-4 h-4 mr-2" />
                                Modifier
                              </DropdownMenuItem>
                              <DropdownMenuItem onClick={() => {
                                resetCommandeForm();
                                setCommandeForm(prev => ({ ...prev, fournisseurId: fournisseur.id }));
                                setShowCommandeDialog(true);
                              }}>
                                <FileText className="w-4 h-4 mr-2" />
                                Créer commande
                              </DropdownMenuItem>
                              <DropdownMenuSeparator />
                              <DropdownMenuItem onClick={() => handleDeleteFournisseur(fournisseur.id)} className="text-red-600">
                                <Trash2 className="w-4 h-4 mr-2" />
                                Supprimer
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Commandes Tab */}
        <TabsContent value="commandes" className="space-y-4">
          {/* Filters */}
          <Card>
            <CardContent className="pt-6">
              <div className="flex flex-col sm:flex-row gap-4">
                <div className="relative flex-1">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
                  <Input
                    placeholder="Rechercher une commande..."
                    value={search}
                    onChange={(e) => setSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={statutFilter} onValueChange={setStatutFilter}>
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <SelectValue placeholder="Tous les statuts" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Tous les statuts</SelectItem>
                    <SelectItem value="EN_ATTENTE">En attente</SelectItem>
                    <SelectItem value="CONFIRME">Confirmé</SelectItem>
                    <SelectItem value="RECU_PARTIEL">Réception partielle</SelectItem>
                    <SelectItem value="RECU">Réceptionné</SelectItem>
                    <SelectItem value="ANNULE">Annulé</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Table */}
          <Card>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>N° Commande</TableHead>
                    <TableHead>Fournisseur</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Livraison prévue</TableHead>
                    <TableHead className="text-right">Montant TTC</TableHead>
                    <TableHead className="text-center">Statut</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {loading ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                        Chargement...
                      </TableCell>
                    </TableRow>
                  ) : filteredCommandes.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                        Aucune commande trouvée
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredCommandes.map((commande) => {
                      const status = statusConfig[commande.statut];
                      const StatusIcon = status.icon;

                      return (
                        <TableRow key={commande.id}>
                          <TableCell className="font-medium">{commande.numero}</TableCell>
                          <TableCell>
                            <div className="flex items-center gap-2">
                              <Truck className="w-4 h-4 text-slate-400" />
                              {commande.fournisseur.nom}
                            </div>
                          </TableCell>
                          <TableCell>{formatDate(commande.dateCommande)}</TableCell>
                          <TableCell>
                            {commande.dateLivraisonPrevue ? (
                              <div className="flex items-center gap-1">
                                <Calendar className="w-4 h-4 text-slate-400" />
                                {formatDate(commande.dateLivraisonPrevue)}
                              </div>
                            ) : '-'}
                          </TableCell>
                          <TableCell className="text-right font-medium">{formatCurrency(commande.montantTTC)}</TableCell>
                          <TableCell className="text-center">
                            <Badge className={status.color}>
                              <StatusIcon className="w-3 h-3 mr-1" />
                              {status.label}
                            </Badge>
                          </TableCell>
                          <TableCell className="text-right">
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button variant="ghost" size="sm">
                                  <MoreHorizontal className="w-4 h-4" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem onClick={() => {
                                  setSelectedCommande(commande);
                                  setShowViewDialog(true);
                                }}>
                                  <Eye className="w-4 h-4 mr-2" />
                                  Voir détails
                                </DropdownMenuItem>
                                {commande.statut === 'EN_ATTENTE' && (
                                  <>
                                    <DropdownMenuItem onClick={() => handleUpdateCommandeStatus(commande.id, 'CONFIRME')}>
                                      <CheckCircle className="w-4 h-4 mr-2" />
                                      Confirmer
                                    </DropdownMenuItem>
                                    <DropdownMenuSeparator />
                                    <DropdownMenuItem onClick={() => handleCancelCommande(commande.id)} className="text-red-600">
                                      <AlertCircle className="w-4 h-4 mr-2" />
                                      Annuler
                                    </DropdownMenuItem>
                                  </>
                                )}
                                {commande.statut === 'CONFIRME' && (
                                  <>
                                    <DropdownMenuItem onClick={() => handleUpdateCommandeStatus(commande.id, 'RECU')}>
                                      <Package className="w-4 h-4 mr-2" />
                                      Marquer comme reçu
                                    </DropdownMenuItem>
                                  </>
                                )}
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </TableCell>
                        </TableRow>
                      );
                    })
                  )}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Fournisseur Dialog */}
      <Dialog open={showFournisseurDialog} onOpenChange={setShowFournisseurDialog}>
        <DialogContent className="max-w-lg">
          <DialogHeader>
            <DialogTitle>{editMode ? 'Modifier le fournisseur' : 'Nouveau fournisseur'}</DialogTitle>
            <DialogDescription>
              {editMode ? 'Modifiez les informations du fournisseur' : 'Ajoutez un nouveau fournisseur'}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Code</Label>
                <Input
                  value={fournisseurForm.code}
                  onChange={(e) => setFournisseurForm({ ...fournisseurForm, code: e.target.value })}
                  placeholder="FRN-001"
                />
              </div>
              <div className="space-y-2">
                <Label>Nom *</Label>
                <Input
                  value={fournisseurForm.nom}
                  onChange={(e) => setFournisseurForm({ ...fournisseurForm, nom: e.target.value })}
                  placeholder="Nom du fournisseur"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Email</Label>
                <Input
                  type="email"
                  value={fournisseurForm.email}
                  onChange={(e) => setFournisseurForm({ ...fournisseurForm, email: e.target.value })}
                  placeholder="email@exemple.com"
                />
              </div>
              <div className="space-y-2">
                <Label>Téléphone</Label>
                <Input
                  value={fournisseurForm.telephone}
                  onChange={(e) => setFournisseurForm({ ...fournisseurForm, telephone: e.target.value })}
                  placeholder="+224..."
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Adresse</Label>
              <Input
                value={fournisseurForm.adresse}
                onChange={(e) => setFournisseurForm({ ...fournisseurForm, adresse: e.target.value })}
                placeholder="Adresse"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Ville</Label>
                <Input
                  value={fournisseurForm.ville}
                  onChange={(e) => setFournisseurForm({ ...fournisseurForm, ville: e.target.value })}
                  placeholder="Ville"
                />
              </div>
              <div className="space-y-2">
                <Label>Pays</Label>
                <Select value={fournisseurForm.pays} onValueChange={(v) => setFournisseurForm({ ...fournisseurForm, pays: v })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {paysList.map(p => (
                      <SelectItem key={p} value={p}>{p}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>NINEA</Label>
                <Input
                  value={fournisseurForm.ninea}
                  onChange={(e) => setFournisseurForm({ ...fournisseurForm, ninea: e.target.value })}
                  placeholder="Numéro d'identification"
                />
              </div>
              <div className="space-y-2">
                <Label>Contact principal</Label>
                <Input
                  value={fournisseurForm.contactNom}
                  onChange={(e) => setFournisseurForm({ ...fournisseurForm, contactNom: e.target.value })}
                  placeholder="Nom du contact"
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={fournisseurForm.notes}
                onChange={(e) => setFournisseurForm({ ...fournisseurForm, notes: e.target.value })}
                placeholder="Notes..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowFournisseurDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateFournisseur} className="bg-emerald-600 hover:bg-emerald-700">
              {editMode ? 'Mettre à jour' : 'Créer le fournisseur'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Commande Dialog */}
      <Dialog open={showCommandeDialog} onOpenChange={setShowCommandeDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouvelle commande fournisseur</DialogTitle>
            <DialogDescription>
              Créez une nouvelle commande d'achat
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Fournisseur *</Label>
                <Select value={commandeForm.fournisseurId} onValueChange={(v) => setCommandeForm({ ...commandeForm, fournisseurId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un fournisseur" />
                  </SelectTrigger>
                  <SelectContent>
                    {fournisseurs.map(f => (
                      <SelectItem key={f.id} value={f.id}>{f.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date de livraison prévue</Label>
                <Input
                  type="date"
                  value={commandeForm.dateLivraisonPrevue}
                  onChange={(e) => setCommandeForm({ ...commandeForm, dateLivraisonPrevue: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Mode de paiement</Label>
              <Select value={commandeForm.modePaiement} onValueChange={(v) => setCommandeForm({ ...commandeForm, modePaiement: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="VIREMENT">Virement bancaire</SelectItem>
                  <SelectItem value="ESPECES">Espèces</SelectItem>
                  <SelectItem value="ORANGE_MONEY">Orange Money</SelectItem>
                  <SelectItem value="MTN_MONEY">MTN Money</SelectItem>
                  <SelectItem value="CHEQUE">Chèque</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>Produits commandés</Label>
                <Button variant="outline" size="sm" onClick={addLigne}>
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter produit
                </Button>
              </div>

              {commandeForm.lignes.map((ligne, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-start">
                  <div className="col-span-4">
                    <Select value={ligne.produitId} onValueChange={(v) => updateLigne(index, 'produitId', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Produit" />
                      </SelectTrigger>
                      <SelectContent>
                        {produits.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.nom}</SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="col-span-3">
                    <Input
                      placeholder="Description"
                      value={ligne.description}
                      onChange={(e) => updateLigne(index, 'description', e.target.value)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      placeholder="Qté"
                      value={ligne.quantite}
                      onChange={(e) => updateLigne(index, 'quantite', parseInt(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-2">
                    <Input
                      type="number"
                      placeholder="P.U."
                      value={ligne.prixUnitaire}
                      onChange={(e) => updateLigne(index, 'prixUnitaire', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className="col-span-1">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => removeLigne(index)}
                      disabled={commandeForm.lignes.length === 1}
                      className="text-red-500"
                    >
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>

            <div className="flex justify-end">
              <div className="text-right">
                <p className="text-sm text-slate-500">Total HT</p>
                <p className="text-xl font-bold text-emerald-600">{formatCurrency(calculateTotal())}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={commandeForm.notes}
                onChange={(e) => setCommandeForm({ ...commandeForm, notes: e.target.value })}
                placeholder="Notes..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCommandeDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateCommande} className="bg-emerald-600 hover:bg-emerald-700">
              Créer la commande
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>
              {activeTab === 'fournisseurs' ? `Fournisseur: ${selectedFournisseur?.nom}` : `Commande ${selectedCommande?.numero}`}
            </DialogTitle>
          </DialogHeader>

          {activeTab === 'fournisseurs' && selectedFournisseur && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Code</p>
                  <p className="font-medium">{selectedFournisseur.code || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Pays</p>
                  <p className="font-medium">{selectedFournisseur.pays}</p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Email</p>
                  <p className="font-medium">{selectedFournisseur.email || '-'}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Téléphone</p>
                  <p className="font-medium">{selectedFournisseur.telephone || '-'}</p>
                </div>
              </div>

              <div>
                <p className="text-sm text-slate-500">Adresse</p>
                <p className="font-medium">
                  {selectedFournisseur.adresse || '-'}
                  {selectedFournisseur.ville && `, ${selectedFournisseur.ville}`}
                </p>
              </div>

              {selectedFournisseur.notes && (
                <div>
                  <p className="text-sm text-slate-500">Notes</p>
                  <p className="font-medium">{selectedFournisseur.notes}</p>
                </div>
              )}

              {selectedFournisseur.commandes && selectedFournisseur.commandes.length > 0 && (
                <>
                  <Separator />
                  <div>
                    <p className="text-sm font-medium mb-2">Dernières commandes</p>
                    <div className="space-y-2">
                      {selectedFournisseur.commandes.slice(0, 5).map(c => (
                        <div key={c.id} className="flex justify-between items-center p-2 bg-slate-50 rounded">
                          <span className="font-medium">{c.numero}</span>
                          <span>{formatCurrency(c.montantTTC)}</span>
                          <Badge className={statusConfig[c.statut as keyof typeof statusConfig]?.color}>
                            {statusConfig[c.statut as keyof typeof statusConfig]?.label}
                          </Badge>
                        </div>
                      ))}
                    </div>
                  </div>
                </>
              )}
            </div>
          )}

          {activeTab === 'commandes' && selectedCommande && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Fournisseur</p>
                  <p className="font-medium">{selectedCommande.fournisseur.nom}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Statut</p>
                  <Badge className={statusConfig[selectedCommande.statut]?.color}>
                    {statusConfig[selectedCommande.statut]?.label}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium mb-2">Produits commandés</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Produit</TableHead>
                      <TableHead className="text-right">Qté</TableHead>
                      <TableHead className="text-right">Reçu</TableHead>
                      <TableHead className="text-right">P.U.</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedCommande.lignes.map((ligne) => (
                      <TableRow key={ligne.id}>
                        <TableCell>{ligne.produit.nom}</TableCell>
                        <TableCell className="text-right">{ligne.quantite}</TableCell>
                        <TableCell className="text-right">{ligne.quantiteRecue}</TableCell>
                        <TableCell className="text-right">{formatCurrency(ligne.prixUnitaire)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(ligne.montantHT)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end">
                <div className="text-right space-y-1">
                  <p className="text-sm">Total HT: {formatCurrency(selectedCommande.montantHT)}</p>
                  <p className="text-sm">TVA: {formatCurrency(selectedCommande.montantTVA)}</p>
                  <p className="text-lg font-bold">Total TTC: {formatCurrency(selectedCommande.montantTTC)}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Fermer
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default FournisseursPage;
