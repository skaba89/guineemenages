'use client';

import { useState, useEffect } from 'react';
import {
  ShoppingCart, Plus, Search, Filter, MoreHorizontal, Eye, Edit, Trash2,
  Truck, CheckCircle, XCircle, Clock, AlertCircle, ArrowRight, FileText,
  Calendar, DollarSign, User, Building, Package, X
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

interface Commande {
  id: string;
  numero: string;
  client: {
    id: string;
    nom: string;
    email?: string;
    telephone?: string;
  };
  dateCommande: string;
  dateLivraison?: string;
  montantHT: number;
  montantTVA: number;
  montantTTC: number;
  statut: 'EN_ATTENTE' | 'CONFIRME' | 'EN_PREPARATION' | 'EXPEDIE' | 'LIVRE' | 'ANNULE';
  adresseLivraison?: string;
  notes?: string;
  lignes: Array<{
    id: string;
    description: string;
    quantite: number;
    quantiteLivree: number;
    prixUnitaire: number;
    montantTTC: number;
    produit?: {
      id: string;
      nom: string;
      reference?: string;
    };
  }>;
  bonLivraison?: {
    id: string;
    numero: string;
    statut: string;
  };
}

interface Client {
  id: string;
  nom: string;
  email?: string;
}

interface Produit {
  id: string;
  nom: string;
  prixUnitaire: number;
  type: string;
  stockActuel: number;
}

const statusConfig = {
  EN_ATTENTE: { label: 'En attente', color: 'bg-gray-100 text-gray-800', icon: Clock },
  CONFIRME: { label: 'Confirmé', color: 'bg-blue-100 text-blue-800', icon: CheckCircle },
  EN_PREPARATION: { label: 'En préparation', color: 'bg-amber-100 text-amber-800', icon: Package },
  EXPEDIE: { label: 'Expédié', color: 'bg-purple-100 text-purple-800', icon: Truck },
  LIVRE: { label: 'Livré', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  ANNULE: { label: 'Annulé', color: 'bg-red-100 text-red-800', icon: XCircle },
};

export function CommandesPage() {
  const { user } = useAppStore();
  const [commandes, setCommandes] = useState<Commande[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [stats, setStats] = useState<any>(null);

  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showLivraisonDialog, setShowLivraisonDialog] = useState(false);
  const [selectedCommande, setSelectedCommande] = useState<Commande | null>(null);

  // Form states
  const [formData, setFormData] = useState({
    clientId: '',
    dateLivraison: '',
    adresseLivraison: '',
    notes: '',
    lignes: [{ produitId: '', description: '', quantite: 1, prixUnitaire: 0, tauxTVA: 18 }]
  });

  // Livraison form
  const [livraisonForm, setLivraisonForm] = useState({
    adresse: '',
    notes: '',
    lignes: [] as Array<{ produitId: string; description: string; quantite: number }>
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [commandesRes, clientsRes, produitsRes, statsRes] = await Promise.all([
        api.request('/commandes'),
        api.getClients(),
        api.getProduits(),
        api.request('/commandes/stats'),
      ]);

      if (commandesRes.success) setCommandes(commandesRes.data || []);
      if (clientsRes.success) setClients(clientsRes.data || []);
      if (produitsRes.success) setProduits(produitsRes.data || []);
      if (statsRes.success) setStats(statsRes.data);
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateCommande = async () => {
    try {
      const response = await api.request('/commandes', {
        method: 'POST',
        body: JSON.stringify({
          clientId: formData.clientId,
          dateLivraison: formData.dateLivraison || undefined,
          adresseLivraison: formData.adresseLivraison || undefined,
          notes: formData.notes || undefined,
          lignes: formData.lignes.filter(l => l.description && l.quantite > 0),
        }),
      });

      if (response.success) {
        setShowCreateDialog(false);
        resetForm();
        loadData();
      } else {
        alert(response.message || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('Erreur création:', error);
    }
  };

  const handleUpdateStatus = async (commandeId: string, statut: string) => {
    try {
      const response = await api.request(`/commandes/${commandeId}/status`, {
        method: 'PUT',
        body: JSON.stringify({ statut }),
      });

      if (response.success) {
        loadData();
      }
    } catch (error) {
      console.error('Erreur mise à jour statut:', error);
    }
  };

  const handleCancelCommande = async (commandeId: string) => {
    if (!confirm('Annuler cette commande ?')) return;

    try {
      const response = await api.request(`/commandes/${commandeId}/cancel`, {
        method: 'POST',
        body: JSON.stringify({}),
      });

      if (response.success) {
        loadData();
      }
    } catch (error) {
      console.error('Erreur annulation:', error);
    }
  };

  const handleConvertToFacture = async (commandeId: string) => {
    if (!confirm('Convertir cette commande en facture ?')) return;

    try {
      const response = await api.request(`/commandes/${commandeId}/facture`, {
        method: 'POST',
      });

      if (response.success) {
        alert('Commande convertie en facture avec succès');
        loadData();
      } else {
        alert(response.message || 'Erreur lors de la conversion');
      }
    } catch (error) {
      console.error('Erreur conversion:', error);
    }
  };

  const handleCreateLivraison = async () => {
    if (!selectedCommande) return;

    try {
      const response = await api.request(`/commandes/${selectedCommande.id}/livraison`, {
        method: 'POST',
        body: JSON.stringify(livraisonForm),
      });

      if (response.success) {
        setShowLivraisonDialog(false);
        loadData();
        alert('Bon de livraison créé avec succès');
      } else {
        alert(response.message || 'Erreur lors de la création');
      }
    } catch (error) {
      console.error('Erreur création livraison:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      clientId: '',
      dateLivraison: '',
      adresseLivraison: '',
      notes: '',
      lignes: [{ produitId: '', description: '', quantite: 1, prixUnitaire: 0, tauxTVA: 18 }]
    });
  };

  const addLigne = () => {
    setFormData({
      ...formData,
      lignes: [...formData.lignes, { produitId: '', description: '', quantite: 1, prixUnitaire: 0, tauxTVA: 18 }]
    });
  };

  const updateLigne = (index: number, field: string, value: any) => {
    const newLignes = [...formData.lignes];
    newLignes[index] = { ...newLignes[index], [field]: value };

    if (field === 'produitId' && value) {
      const produit = produits.find(p => p.id === value);
      if (produit) {
        newLignes[index].prixUnitaire = produit.prixUnitaire;
        newLignes[index].description = produit.nom;
      }
    }

    setFormData({ ...formData, lignes: newLignes });
  };

  const removeLigne = (index: number) => {
    if (formData.lignes.length > 1) {
      setFormData({
        ...formData,
        lignes: formData.lignes.filter((_, i) => i !== index)
      });
    }
  };

  const calculateTotal = () => {
    return formData.lignes.reduce((total, ligne) => {
      const ht = ligne.quantite * ligne.prixUnitaire;
      const tva = ht * (ligne.tauxTVA / 100);
      return total + ht + tva;
    }, 0);
  };

  const openLivraisonDialog = (commande: Commande) => {
    setSelectedCommande(commande);
    setLivraisonForm({
      adresse: commande.adresseLivraison || '',
      notes: '',
      lignes: commande.lignes.map(l => ({
        produitId: l.produit?.id || '',
        description: l.description,
        quantite: l.quantite - l.quantiteLivree
      }))
    });
    setShowLivraisonDialog(true);
  };

  const filteredCommandes = commandes.filter(c => {
    const matchesSearch = c.numero.toLowerCase().includes(search.toLowerCase()) ||
      c.client.nom.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || c.statut === filterStatus;
    return matchesSearch && matchesStatus;
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
          <h2 className="text-2xl font-bold">Commandes Clients</h2>
          <p className="text-slate-500">Gérez les commandes et les livraisons</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          Nouvelle commande
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <ShoppingCart className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total</p>
                <p className="text-2xl font-bold">{stats?.totalCommandes || commandes.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-100 rounded-lg">
                <Clock className="w-6 h-6 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">En cours</p>
                <p className="text-2xl font-bold">{stats?.commandesEnCours || commandes.filter(c => ['EN_ATTENTE', 'CONFIRME', 'EN_PREPARATION', 'EXPEDIE'].includes(c.statut)).length}</p>
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
                <p className="text-sm text-slate-500">Livrées</p>
                <p className="text-2xl font-bold">{stats?.commandesLivrees || commandes.filter(c => c.statut === 'LIVRE').length}</p>
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
                <p className="text-lg font-bold">{formatCurrency(stats?.montantEnCours || 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-6">
          <div className="flex flex-col sm:flex-row gap-4">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Rechercher par numéro ou client..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={filterStatus} onValueChange={setFilterStatus}>
              <SelectTrigger className="w-full sm:w-[180px]">
                <SelectValue placeholder="Tous les statuts" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Tous les statuts</SelectItem>
                <SelectItem value="EN_ATTENTE">En attente</SelectItem>
                <SelectItem value="CONFIRME">Confirmé</SelectItem>
                <SelectItem value="EN_PREPARATION">En préparation</SelectItem>
                <SelectItem value="EXPEDIE">Expédié</SelectItem>
                <SelectItem value="LIVRE">Livré</SelectItem>
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
                <TableHead>Client</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Livraison</TableHead>
                <TableHead>Montant TTC</TableHead>
                <TableHead>Statut</TableHead>
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
                          <Building className="w-4 h-4 text-slate-400" />
                          {commande.client.nom}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(commande.dateCommande)}</TableCell>
                      <TableCell>
                        {commande.dateLivraison ? (
                          <div className="flex items-center gap-1">
                            <Calendar className="w-4 h-4 text-slate-400" />
                            {formatDate(commande.dateLivraison)}
                          </div>
                        ) : '-'}
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(commande.montantTTC)}</TableCell>
                      <TableCell>
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
                                <DropdownMenuItem onClick={() => handleUpdateStatus(commande.id, 'CONFIRME')}>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Confirmer
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleCancelCommande(commande.id)} className="text-red-600">
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Annuler
                                </DropdownMenuItem>
                              </>
                            )}
                            {commande.statut === 'CONFIRME' && (
                              <>
                                <DropdownMenuItem onClick={() => handleUpdateStatus(commande.id, 'EN_PREPARATION')}>
                                  <Package className="w-4 h-4 mr-2" />
                                  En préparation
                                </DropdownMenuItem>
                              </>
                            )}
                            {commande.statut === 'EN_PREPARATION' && (
                              <>
                                <DropdownMenuItem onClick={() => handleUpdateStatus(commande.id, 'EXPEDIE')}>
                                  <Truck className="w-4 h-4 mr-2" />
                                  Expédier
                                </DropdownMenuItem>
                              </>
                            )}
                            {(commande.statut === 'CONFIRME' || commande.statut === 'EN_PREPARATION' || commande.statut === 'EXPEDIE') && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => openLivraisonDialog(commande)}>
                                  <FileText className="w-4 h-4 mr-2" />
                                  Créer bon de livraison
                                </DropdownMenuItem>
                              </>
                            )}
                            {(commande.statut === 'LIVRE' || commande.statut === 'EXPEDIE') && !commande.bonLivraison && (
                              <>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleConvertToFacture(commande.id)}>
                                  <ArrowRight className="w-4 h-4 mr-2" />
                                  Convertir en facture
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

      {/* Create Commande Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouvelle commande</DialogTitle>
            <DialogDescription>
              Créez une nouvelle commande client
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Client *</Label>
                <Select value={formData.clientId} onValueChange={(v) => setFormData({ ...formData, clientId: v })}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un client" />
                  </SelectTrigger>
                  <SelectContent>
                    {clients.map(client => (
                      <SelectItem key={client.id} value={client.id}>{client.nom}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Date de livraison souhaitée</Label>
                <Input
                  type="date"
                  value={formData.dateLivraison}
                  onChange={(e) => setFormData({ ...formData, dateLivraison: e.target.value })}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label>Adresse de livraison</Label>
              <Input
                placeholder="Adresse de livraison"
                value={formData.adresseLivraison}
                onChange={(e) => setFormData({ ...formData, adresseLivraison: e.target.value })}
              />
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>Lignes de commande</Label>
                <Button variant="outline" size="sm" onClick={addLigne}>
                  <Plus className="w-4 h-4 mr-1" />
                  Ajouter ligne
                </Button>
              </div>

              {formData.lignes.map((ligne, index) => (
                <div key={index} className="grid grid-cols-12 gap-2 items-start">
                  <div className="col-span-4">
                    <Select value={ligne.produitId} onValueChange={(v) => updateLigne(index, 'produitId', v)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Produit" />
                      </SelectTrigger>
                      <SelectContent>
                        {produits.map(p => (
                          <SelectItem key={p.id} value={p.id}>{p.nom} (Stock: {p.stockActuel})</SelectItem>
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
                      disabled={formData.lignes.length === 1}
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
                <p className="text-sm text-slate-500">Total TTC</p>
                <p className="text-xl font-bold text-emerald-600">{formatCurrency(calculateTotal())}</p>
              </div>
            </div>

            <Separator />

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                placeholder="Notes internes..."
                value={formData.notes}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateCommande} className="bg-emerald-600 hover:bg-emerald-700">
              Créer la commande
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Commande Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Commande {selectedCommande?.numero}</DialogTitle>
            <DialogDescription>
              Créée le {selectedCommande && formatDate(selectedCommande.dateCommande)}
            </DialogDescription>
          </DialogHeader>

          {selectedCommande && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Client</p>
                  <p className="font-medium">{selectedCommande.client.nom}</p>
                  {selectedCommande.client.email && (
                    <p className="text-sm text-slate-500">{selectedCommande.client.email}</p>
                  )}
                </div>
                <div>
                  <p className="text-sm text-slate-500">Statut</p>
                  <Badge className={statusConfig[selectedCommande.statut].color}>
                    {statusConfig[selectedCommande.statut].label}
                  </Badge>
                </div>
              </div>

              {selectedCommande.adresseLivraison && (
                <div>
                  <p className="text-sm text-slate-500">Adresse de livraison</p>
                  <p className="font-medium">{selectedCommande.adresseLivraison}</p>
                </div>
              )}

              <Separator />

              <div>
                <p className="text-sm font-medium mb-2">Lignes</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Qté</TableHead>
                      <TableHead className="text-right">Livré</TableHead>
                      <TableHead className="text-right">P.U.</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedCommande.lignes.map((ligne) => (
                      <TableRow key={ligne.id}>
                        <TableCell>{ligne.description}</TableCell>
                        <TableCell className="text-right">{ligne.quantite}</TableCell>
                        <TableCell className="text-right">{ligne.quantiteLivree}</TableCell>
                        <TableCell className="text-right">{formatCurrency(ligne.prixUnitaire)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(ligne.montantTTC)}</TableCell>
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

              {selectedCommande.bonLivraison && (
                <>
                  <Separator />
                  <div className="flex items-center gap-2">
                    <FileText className="w-4 h-4 text-slate-500" />
                    <span className="text-sm">Bon de livraison: {selectedCommande.bonLivraison.numero}</span>
                    <Badge variant="outline">{selectedCommande.bonLivraison.statut}</Badge>
                  </div>
                </>
              )}
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Fermer
            </Button>
            {selectedCommande && (selectedCommande.statut === 'LIVRE' || selectedCommande.statut === 'EXPEDIE') && (
              <Button onClick={() => {
                handleConvertToFacture(selectedCommande.id);
                setShowViewDialog(false);
              }} className="bg-emerald-600 hover:bg-emerald-700">
                <ArrowRight className="w-4 h-4 mr-2" />
                Convertir en facture
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Create Livraison Dialog */}
      <Dialog open={showLivraisonDialog} onOpenChange={setShowLivraisonDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Bon de livraison</DialogTitle>
            <DialogDescription>
              Commande {selectedCommande?.numero}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="space-y-2">
              <Label>Adresse de livraison</Label>
              <Input
                value={livraisonForm.adresse}
                onChange={(e) => setLivraisonForm({ ...livraisonForm, adresse: e.target.value })}
                placeholder="Adresse"
              />
            </div>

            <div className="space-y-2">
              <Label>Produits à livrer</Label>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Description</TableHead>
                    <TableHead className="text-right">Reste à livrer</TableHead>
                    <TableHead className="text-right">Qté à livrer</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {livraisonForm.lignes.map((ligne, index) => (
                    <TableRow key={index}>
                      <TableCell>{ligne.description}</TableCell>
                      <TableCell className="text-right">{selectedCommande?.lignes[index]?.quantite || 0} - {selectedCommande?.lignes[index]?.quantiteLivree || 0}</TableCell>
                      <TableCell className="text-right w-24">
                        <Input
                          type="number"
                          value={ligne.quantite}
                          onChange={(e) => {
                            const newLignes = [...livraisonForm.lignes];
                            newLignes[index].quantite = parseInt(e.target.value) || 0;
                            setLivraisonForm({ ...livraisonForm, lignes: newLignes });
                          }}
                          className="w-20 text-right"
                          min={0}
                        />
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>

            <div className="space-y-2">
              <Label>Notes</Label>
              <Textarea
                value={livraisonForm.notes}
                onChange={(e) => setLivraisonForm({ ...livraisonForm, notes: e.target.value })}
                placeholder="Notes..."
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowLivraisonDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateLivraison} className="bg-emerald-600 hover:bg-emerald-700">
              Créer le bon de livraison
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default CommandesPage;
