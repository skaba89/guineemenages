'use client';

import { useState, useEffect } from 'react';
import { 
  FileText, Plus, Search, Filter, MoreHorizontal, Eye, Edit, Trash2,
  Send, CheckCircle, XCircle, Clock, AlertCircle, ArrowRight, Copy,
  Calendar, DollarSign, User, Building
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
import api from '@/lib/api';
import { useAppStore } from '@/stores/auth-store';

interface Devis {
  id: string;
  numero: string;
  client: {
    id: string;
    nom: string;
    email?: string;
  };
  dateEmission: string;
  dateValidite: string;
  montantHT: number;
  montantTVA: number;
  montantTTC: number;
  statut: 'BROUILLON' | 'ENVOYE' | 'ACCEPTE' | 'REFUSE' | 'EXPIRE';
  lignes: Array<{
    id: string;
    description: string;
    quantite: number;
    prixUnitaire: number;
    montantTTC: number;
  }>;
  conditions?: string;
  notes?: string;
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
}

const statusConfig = {
  BROUILLON: { label: 'Brouillon', color: 'bg-gray-100 text-gray-800', icon: FileText },
  ENVOYE: { label: 'Envoyé', color: 'bg-blue-100 text-blue-800', icon: Send },
  ACCEPTE: { label: 'Accepté', color: 'bg-green-100 text-green-800', icon: CheckCircle },
  REFUSE: { label: 'Refusé', color: 'bg-red-100 text-red-800', icon: XCircle },
  EXPIRE: { label: 'Expiré', color: 'bg-orange-100 text-orange-800', icon: AlertCircle },
};

export function DevisPage() {
  const { user } = useAppStore();
  const [devis, setDevis] = useState<Devis[]>([]);
  const [clients, setClients] = useState<Client[]>([]);
  const [produits, setProduits] = useState<Produit[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<string>('all');
  
  // Dialog states
  const [showCreateDialog, setShowCreateDialog] = useState(false);
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [selectedDevis, setSelectedDevis] = useState<Devis | null>(null);
  
  // Form states
  const [formData, setFormData] = useState({
    clientId: '',
    dateValidite: '',
    conditions: '',
    notes: '',
    lignes: [{ produitId: '', description: '', quantite: 1, prixUnitaire: 0, tauxTVA: 18 }]
  });

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [devisRes, clientsRes, produitsRes] = await Promise.all([
        api.get('/devis'),
        api.getClients(),
        api.getProduits(),
      ]);
      
      if (devisRes.success) setDevis(devisRes.data || []);
      if (clientsRes.success) setClients(clientsRes.data || []);
      if (produitsRes.success) setProduits(produitsRes.data || []);
    } catch (error) {
      console.error('Erreur chargement:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateDevis = async () => {
    try {
      const response = await api.request('/devis', {
        method: 'POST',
        body: JSON.stringify({
          clientId: formData.clientId,
          dateValidite: formData.dateValidite,
          conditions: formData.conditions,
          notes: formData.notes,
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

  const handleUpdateStatus = async (devisId: string, statut: string) => {
    try {
      const response = await api.request(`/devis/${devisId}/status`, {
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

  const handleConvertToFacture = async (devisId: string) => {
    if (!confirm('Convertir ce devis en facture ?')) return;
    
    try {
      const response = await api.request(`/devis/${devisId}/convert`, {
        method: 'POST',
      });

      if (response.success) {
        alert('Devis converti en facture avec succès');
        loadData();
      } else {
        alert(response.message || 'Erreur lors de la conversion');
      }
    } catch (error) {
      console.error('Erreur conversion:', error);
    }
  };

  const handleDeleteDevis = async (devisId: string) => {
    if (!confirm('Supprimer ce devis ?')) return;
    
    try {
      const response = await api.request(`/devis/${devisId}`, {
        method: 'DELETE',
      });

      if (response.success) {
        loadData();
      }
    } catch (error) {
      console.error('Erreur suppression:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      clientId: '',
      dateValidite: '',
      conditions: '',
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
    
    // If product selected, auto-fill price
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

  const filteredDevis = devis.filter(d => {
    const matchesSearch = d.numero.toLowerCase().includes(search.toLowerCase()) ||
                         d.client.nom.toLowerCase().includes(search.toLowerCase());
    const matchesStatus = filterStatus === 'all' || d.statut === filterStatus;
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
          <h2 className="text-2xl font-bold">Devis</h2>
          <p className="text-slate-500">Gérez vos devis et convertissez-les en factures</p>
        </div>
        <Button onClick={() => setShowCreateDialog(true)} className="bg-emerald-600 hover:bg-emerald-700">
          <Plus className="w-4 h-4 mr-2" />
          Nouveau devis
        </Button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-gray-100 rounded-lg">
                <FileText className="w-6 h-6 text-gray-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Total</p>
                <p className="text-2xl font-bold">{devis.length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-blue-100 rounded-lg">
                <Send className="w-6 h-6 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Envoyés</p>
                <p className="text-2xl font-bold">{devis.filter(d => d.statut === 'ENVOYE').length}</p>
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
                <p className="text-sm text-slate-500">Acceptés</p>
                <p className="text-2xl font-bold">{devis.filter(d => d.statut === 'ACCEPTE').length}</p>
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
                <p className="text-sm text-slate-500">Montant total</p>
                <p className="text-lg font-bold">{formatCurrency(devis.reduce((sum, d) => sum + d.montantTTC, 0))}</p>
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
                <SelectItem value="BROUILLON">Brouillon</SelectItem>
                <SelectItem value="ENVOYE">Envoyé</SelectItem>
                <SelectItem value="ACCEPTE">Accepté</SelectItem>
                <SelectItem value="REFUSE">Refusé</SelectItem>
                <SelectItem value="EXPIRE">Expiré</SelectItem>
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
                <TableHead>N° Devis</TableHead>
                <TableHead>Client</TableHead>
                <TableHead>Date</TableHead>
                <TableHead>Validité</TableHead>
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
              ) : filteredDevis.length === 0 ? (
                <TableRow>
                  <TableCell colSpan={7} className="text-center py-8 text-slate-500">
                    Aucun devis trouvé
                  </TableCell>
                </TableRow>
              ) : (
                filteredDevis.map((devisItem) => {
                  const status = statusConfig[devisItem.statut];
                  const StatusIcon = status.icon;
                  
                  return (
                    <TableRow key={devisItem.id}>
                      <TableCell className="font-medium">{devisItem.numero}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Building className="w-4 h-4 text-slate-400" />
                          {devisItem.client.nom}
                        </div>
                      </TableCell>
                      <TableCell>{formatDate(devisItem.dateEmission)}</TableCell>
                      <TableCell>
                        <div className="flex items-center gap-1">
                          <Calendar className="w-4 h-4 text-slate-400" />
                          {formatDate(devisItem.dateValidite)}
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{formatCurrency(devisItem.montantTTC)}</TableCell>
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
                              setSelectedDevis(devisItem);
                              setShowViewDialog(true);
                            }}>
                              <Eye className="w-4 h-4 mr-2" />
                              Voir détails
                            </DropdownMenuItem>
                            {devisItem.statut === 'BROUILLON' && (
                              <>
                                <DropdownMenuItem onClick={() => handleUpdateStatus(devisItem.id, 'ENVOYE')}>
                                  <Send className="w-4 h-4 mr-2" />
                                  Envoyer
                                </DropdownMenuItem>
                                <DropdownMenuSeparator />
                                <DropdownMenuItem onClick={() => handleDeleteDevis(devisItem.id)} className="text-red-600">
                                  <Trash2 className="w-4 h-4 mr-2" />
                                  Supprimer
                                </DropdownMenuItem>
                              </>
                            )}
                            {devisItem.statut === 'ENVOYE' && (
                              <>
                                <DropdownMenuItem onClick={() => handleUpdateStatus(devisItem.id, 'ACCEPTE')}>
                                  <CheckCircle className="w-4 h-4 mr-2" />
                                  Marquer accepté
                                </DropdownMenuItem>
                                <DropdownMenuItem onClick={() => handleUpdateStatus(devisItem.id, 'REFUSE')}>
                                  <XCircle className="w-4 h-4 mr-2" />
                                  Marquer refusé
                                </DropdownMenuItem>
                              </>
                            )}
                            {(devisItem.statut === 'ACCEPTE' || devisItem.statut === 'ENVOYE') && (
                              <DropdownMenuItem onClick={() => handleConvertToFacture(devisItem.id)}>
                                <ArrowRight className="w-4 h-4 mr-2" />
                                Convertir en facture
                              </DropdownMenuItem>
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

      {/* Create Devis Dialog */}
      <Dialog open={showCreateDialog} onOpenChange={setShowCreateDialog}>
        <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Nouveau devis</DialogTitle>
            <DialogDescription>
              Créez un nouveau devis pour votre client
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>Client *</Label>
                <Select value={formData.clientId} onValueChange={(v) => setFormData({...formData, clientId: v})}>
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
                <Label>Date de validité *</Label>
                <Input
                  type="date"
                  value={formData.dateValidite}
                  onChange={(e) => setFormData({...formData, dateValidite: e.target.value})}
                  min={new Date().toISOString().split('T')[0]}
                />
              </div>
            </div>

            <Separator />

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <Label>Lignes du devis</Label>
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
              <Label>Conditions</Label>
              <Textarea
                placeholder="Conditions de paiement, délais, etc."
                value={formData.conditions}
                onChange={(e) => setFormData({...formData, conditions: e.target.value})}
              />
            </div>

            <div className="space-y-2">
              <Label>Notes internes</Label>
              <Textarea
                placeholder="Notes (non visibles par le client)"
                value={formData.notes}
                onChange={(e) => setFormData({...formData, notes: e.target.value})}
              />
            </div>
          </div>

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowCreateDialog(false)}>
              Annuler
            </Button>
            <Button onClick={handleCreateDevis} className="bg-emerald-600 hover:bg-emerald-700">
              Créer le devis
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* View Devis Dialog */}
      <Dialog open={showViewDialog} onOpenChange={setShowViewDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Devis {selectedDevis?.numero}</DialogTitle>
            <DialogDescription>
              Créé le {selectedDevis && formatDate(selectedDevis.dateEmission)}
            </DialogDescription>
          </DialogHeader>

          {selectedDevis && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-slate-500">Client</p>
                  <p className="font-medium">{selectedDevis.client.nom}</p>
                </div>
                <div>
                  <p className="text-sm text-slate-500">Statut</p>
                  <Badge className={statusConfig[selectedDevis.statut].color}>
                    {statusConfig[selectedDevis.statut].label}
                  </Badge>
                </div>
              </div>

              <Separator />

              <div>
                <p className="text-sm font-medium mb-2">Lignes</p>
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Description</TableHead>
                      <TableHead className="text-right">Qté</TableHead>
                      <TableHead className="text-right">P.U.</TableHead>
                      <TableHead className="text-right">Total</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {selectedDevis.lignes.map((ligne) => (
                      <TableRow key={ligne.id}>
                        <TableCell>{ligne.description}</TableCell>
                        <TableCell className="text-right">{ligne.quantite}</TableCell>
                        <TableCell className="text-right">{formatCurrency(ligne.prixUnitaire)}</TableCell>
                        <TableCell className="text-right">{formatCurrency(ligne.montantTTC)}</TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>

              <div className="flex justify-end">
                <div className="text-right space-y-1">
                  <p className="text-sm">Total HT: {formatCurrency(selectedDevis.montantHT)}</p>
                  <p className="text-sm">TVA: {formatCurrency(selectedDevis.montantTVA)}</p>
                  <p className="text-lg font-bold">Total TTC: {formatCurrency(selectedDevis.montantTTC)}</p>
                </div>
              </div>
            </div>
          )}

          <DialogFooter>
            <Button variant="outline" onClick={() => setShowViewDialog(false)}>
              Fermer
            </Button>
            {selectedDevis && (selectedDevis.statut === 'ACCEPTE' || selectedDevis.statut === 'ENVOYE') && (
              <Button onClick={() => {
                handleConvertToFacture(selectedDevis.id);
                setShowViewDialog(false);
              }} className="bg-emerald-600 hover:bg-emerald-700">
                <ArrowRight className="w-4 h-4 mr-2" />
                Convertir en facture
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export default DevisPage;
