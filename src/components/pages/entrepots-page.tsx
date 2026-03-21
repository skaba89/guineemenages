'use client';

import { useState, useEffect } from 'react';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  Warehouse, 
  Package, 
  MapPin, 
  Phone,
  User,
  Star,
  Eye,
  ArrowRightLeft
} from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { formatGNF } from '@/lib/mock-data';
import api from '@/lib/api';

interface Entrepot {
  id: string;
  nom: string;
  code?: string;
  adresse?: string;
  ville?: string;
  telephone?: string;
  responsable?: string;
  actif: boolean;
  parDefaut: boolean;
  nbProduits?: number;
  totalProduits?: number;
  totalQuantite?: number;
  valeurTotale?: number;
  stocks?: Array<{
    id: string;
    quantite: number;
    produit: {
      id: string;
      nom: string;
      reference?: string;
      unite: string;
      prixUnitaire: number;
    };
  }>;
  createdAt: string;
}

export function EntrepotsPage() {
  const [entrepots, setEntrepots] = useState<Entrepot[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [isDialogOpen, setIsDialogOpen] = useState(false);
  const [isStockDialogOpen, setIsStockDialogOpen] = useState(false);
  const [selectedEntrepot, setSelectedEntrepot] = useState<Entrepot | null>(null);
  const [formData, setFormData] = useState({
    nom: '',
    code: '',
    adresse: '',
    ville: '',
    telephone: '',
    responsable: '',
  });

  const fetchEntrepots = async () => {
    setLoading(true);
    try {
      const response = await api.getEntrepots();
      if (response.success && response.data) {
        setEntrepots(response.data);
      }
    } catch (error) {
      console.error('Error fetching entrepots:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchEntrepots();
  }, []);

  const filteredEntrepots = entrepots.filter(e =>
    e.nom.toLowerCase().includes(search.toLowerCase()) ||
    e.code?.toLowerCase().includes(search.toLowerCase()) ||
    e.ville?.toLowerCase().includes(search.toLowerCase())
  );

  const handleSubmit = async () => {
    try {
      if (selectedEntrepot) {
        const response = await api.updateEntrepot(selectedEntrepot.id, formData);
        if (response.success) {
          fetchEntrepots();
        }
      } else {
        const response = await api.createEntrepot(formData);
        if (response.success) {
          fetchEntrepots();
        }
      }
      setIsDialogOpen(false);
      resetForm();
    } catch (error) {
      console.error('Error saving entrepot:', error);
    }
  };

  const resetForm = () => {
    setFormData({
      nom: '',
      code: '',
      adresse: '',
      ville: '',
      telephone: '',
      responsable: '',
    });
    setSelectedEntrepot(null);
  };

  const openEditDialog = (entrepot: Entrepot) => {
    setSelectedEntrepot(entrepot);
    setFormData({
      nom: entrepot.nom,
      code: entrepot.code || '',
      adresse: entrepot.adresse || '',
      ville: entrepot.ville || '',
      telephone: entrepot.telephone || '',
      responsable: entrepot.responsable || '',
    });
    setIsDialogOpen(true);
  };

  const openStockDialog = async (entrepot: Entrepot) => {
    try {
      const response = await api.getEntrepot(entrepot.id);
      if (response.success && response.data) {
        setSelectedEntrepot(response.data);
        setIsStockDialogOpen(true);
      }
    } catch (error) {
      console.error('Error fetching entrepot stock:', error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await api.updateEntrepot(id, { actif: false });
      if (response.success) {
        fetchEntrepots();
      }
    } catch (error) {
      console.error('Error deleting entrepot:', error);
    }
  };

  const totalValeur = entrepots.reduce((sum, e) => sum + (e.valeurTotale || 0), 0);
  const totalProduits = entrepots.reduce((sum, e) => sum + (e.totalProduits || 0), 0);

  return (
    <div className="space-y-6">
      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-emerald-100 rounded-lg">
                <Warehouse className="w-5 h-5 text-emerald-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Entrepôts actifs</p>
                <p className="text-xl font-bold">{entrepots.filter(e => e.actif).length}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-blue-100 rounded-lg">
                <Package className="w-5 h-5 text-blue-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Produits en stock</p>
                <p className="text-xl font-bold">{totalProduits}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-amber-100 rounded-lg">
                <Package className="w-5 h-5 text-amber-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Articles stockés</p>
                <p className="text-xl font-bold">{entrepots.reduce((sum, e) => sum + (e.totalQuantite || 0), 0)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-100 rounded-lg">
                <Package className="w-5 h-5 text-purple-600" />
              </div>
              <div>
                <p className="text-sm text-slate-500">Valeur totale</p>
                <p className="text-xl font-bold">{formatGNF(totalValeur)}</p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Actions Bar */}
      <div className="flex flex-col sm:flex-row gap-4 justify-between">
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <Input
            placeholder="Rechercher un entrepôt..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-10"
          />
        </div>
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={() => { resetForm(); setIsDialogOpen(true); }}>
            <Plus className="w-4 h-4 mr-2" />
            Nouvel entrepôt
          </Button>
          <DialogContent className="max-w-md">
            <DialogHeader>
              <DialogTitle>{selectedEntrepot ? 'Modifier l\'entrepôt' : 'Nouvel entrepôt'}</DialogTitle>
            </DialogHeader>
            <div className="grid gap-4 py-4">
              <div className="grid gap-2">
                <Label htmlFor="nom">Nom *</Label>
                <Input
                  id="nom"
                  value={formData.nom}
                  onChange={(e) => setFormData({ ...formData, nom: e.target.value })}
                  placeholder="Nom de l'entrepôt"
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="code">Code</Label>
                <Input
                  id="code"
                  value={formData.code}
                  onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                  placeholder="Code court (ex: WH001)"
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="grid gap-2">
                  <Label htmlFor="ville">Ville</Label>
                  <Input
                    id="ville"
                    value={formData.ville}
                    onChange={(e) => setFormData({ ...formData, ville: e.target.value })}
                    placeholder="Ville"
                  />
                </div>
                <div className="grid gap-2">
                  <Label htmlFor="telephone">Téléphone</Label>
                  <Input
                    id="telephone"
                    value={formData.telephone}
                    onChange={(e) => setFormData({ ...formData, telephone: e.target.value })}
                    placeholder="Téléphone"
                  />
                </div>
              </div>
              <div className="grid gap-2">
                <Label htmlFor="adresse">Adresse</Label>
                <Textarea
                  id="adresse"
                  value={formData.adresse}
                  onChange={(e) => setFormData({ ...formData, adresse: e.target.value })}
                  placeholder="Adresse complète"
                  rows={2}
                />
              </div>
              <div className="grid gap-2">
                <Label htmlFor="responsable">Responsable</Label>
                <Input
                  id="responsable"
                  value={formData.responsable}
                  onChange={(e) => setFormData({ ...formData, responsable: e.target.value })}
                  placeholder="Nom du responsable"
                />
              </div>
            </div>
            <DialogFooter>
              <Button variant="outline" onClick={() => setIsDialogOpen(false)}>Annuler</Button>
              <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSubmit}>
                {selectedEntrepot ? 'Modifier' : 'Créer'}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>

      {/* Entrepots Grid */}
      {loading ? (
        <div className="text-center py-8">
          <p className="text-slate-500">Chargement...</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {filteredEntrepots.map((entrepot) => (
            <Card key={entrepot.id} className={`hover:shadow-lg transition-shadow ${!entrepot.actif ? 'opacity-60' : ''}`}>
              <CardHeader className="pb-2">
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-emerald-100 rounded-lg">
                      <Warehouse className="w-5 h-5 text-emerald-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{entrepot.nom}</CardTitle>
                      {entrepot.code && (
                        <p className="text-xs text-slate-500">{entrepot.code}</p>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    {entrepot.parDefaut && (
                      <Badge className="bg-amber-500 text-xs">
                        <Star className="w-3 h-3 mr-1" />
                        Par défaut
                      </Badge>
                    )}
                    {!entrepot.actif && (
                      <Badge variant="secondary" className="text-xs">Inactif</Badge>
                    )}
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-3">
                {entrepot.adresse && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <MapPin className="w-4 h-4 text-slate-400" />
                    <span>{entrepot.adresse}{entrepot.ville ? `, ${entrepot.ville}` : ''}</span>
                  </div>
                )}
                {entrepot.responsable && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <User className="w-4 h-4 text-slate-400" />
                    <span>{entrepot.responsable}</span>
                  </div>
                )}
                {entrepot.telephone && (
                  <div className="flex items-center gap-2 text-sm text-slate-600">
                    <Phone className="w-4 h-4 text-slate-400" />
                    <span>{entrepot.telephone}</span>
                  </div>
                )}
                
                <div className="grid grid-cols-2 gap-2 pt-2 border-t">
                  <div className="text-center p-2 bg-slate-50 rounded">
                    <p className="text-lg font-bold text-emerald-600">{entrepot.totalProduits || 0}</p>
                    <p className="text-xs text-slate-500">Produits</p>
                  </div>
                  <div className="text-center p-2 bg-slate-50 rounded">
                    <p className="text-lg font-bold text-blue-600">{formatGNF(entrepot.valeurTotale || 0)}</p>
                    <p className="text-xs text-slate-500">Valeur</p>
                  </div>
                </div>

                <div className="flex justify-between pt-2">
                  <Button variant="outline" size="sm" onClick={() => openStockDialog(entrepot)}>
                    <Eye className="w-4 h-4 mr-1" />
                    Stock
                  </Button>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="icon" onClick={() => openEditDialog(entrepot)}>
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
                          <AlertDialogTitle>Désactiver l'entrepôt ?</AlertDialogTitle>
                          <AlertDialogDescription>
                            Êtes-vous sûr de vouloir désactiver {entrepot.nom} ?
                          </AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Annuler</AlertDialogCancel>
                          <AlertDialogAction
                            className="bg-red-600 hover:bg-red-700"
                            onClick={() => handleDelete(entrepot.id)}
                          >
                            Désactiver
                          </AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}

      {/* Stock Dialog */}
      <Dialog open={isStockDialogOpen} onOpenChange={setIsStockDialogOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Stock - {selectedEntrepot?.nom}</DialogTitle>
          </DialogHeader>
          {selectedEntrepot?.stocks && selectedEntrepot.stocks.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Produit</TableHead>
                  <TableHead>Référence</TableHead>
                  <TableHead className="text-center">Quantité</TableHead>
                  <TableHead className="text-right">Prix unitaire</TableHead>
                  <TableHead className="text-right">Valeur</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {selectedEntrepot.stocks.map((stock) => (
                  <TableRow key={stock.id}>
                    <TableCell className="font-medium">{stock.produit.nom}</TableCell>
                    <TableCell>{stock.produit.reference || '-'}</TableCell>
                    <TableCell className="text-center">
                      <Badge variant="outline">{stock.quantite} {stock.produit.unite}</Badge>
                    </TableCell>
                    <TableCell className="text-right">{formatGNF(stock.produit.prixUnitaire)}</TableCell>
                    <TableCell className="text-right font-medium">
                      {formatGNF(stock.quantite * stock.produit.prixUnitaire)}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-8">
              <Package className="w-12 h-12 text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500">Aucun produit en stock dans cet entrepôt</p>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
}
