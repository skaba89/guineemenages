'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  Calculator, 
  FileText, 
  BarChart3, 
  BookOpen, 
  Plus, 
  Eye,
  TrendingUp,
  TrendingDown,
  CheckCircle,
  Clock,
  AlertCircle
} from 'lucide-react';
import api from '@/lib/api';

interface Exercice {
  id: string;
  annee: number;
  dateDebut: string;
  dateFin: string;
  statut: string;
  resultatNet: number;
}

interface Journal {
  id: string;
  code: string;
  nom: string;
  type: string;
}

interface Ecriture {
  id: string;
  numeroPiece: string;
  dateEcriture: string;
  compteNumero: string;
  compteIntitule: string;
  libelle: string;
  debit: number;
  credit: number;
}

interface Bilan {
  actif: {
    immobilisations: { montant: number };
    stocks: { montant: number };
    creances: { montant: number };
    tresorerie: { montant: number };
    totalActif: number;
  };
  passif: {
    capitaux: { montant: number };
    dettes: { montant: number };
    totalPassif: number;
  };
}

interface CompteResultat {
  charges: {
    achats: { montant: number };
    services: { montant: number };
    personnel: { montant: number };
    totalCharges: number;
  };
  produits: {
    ventes: { montant: number };
    totalProduits: number;
  };
  resultatNet: number;
}

export default function ComptabilitePage() {
  const [exercices, setExercices] = useState<Exercice[]>([]);
  const [exerciceActif, setExerciceActif] = useState<Exercice | null>(null);
  const [journaux, setJournaux] = useState<Journal[]>([]);
  const [ecritures, setEcritures] = useState<Ecriture[]>([]);
  const [bilan, setBilan] = useState<Bilan | null>(null);
  const [compteResultat, setCompteResultat] = useState<CompteResultat | null>(null);
  const [loading, setLoading] = useState(true);
  const [showNewExercice, setShowNewExercice] = useState(false);
  const [showNewEcriture, setShowNewEcriture] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [exercicesRes] = await Promise.all([
        api.get('/comptabilite/exercices'),
      ]);
      setExercices(exercicesRes.data);
      
      // Trouver l'exercice actif
      const actif = exercicesRes.data.find((e: Exercice) => e.statut === 'OUVERT');
      if (actif) {
        setExerciceActif(actif);
        loadExerciceData(actif.id);
      }
    } catch (error) {
      console.error('Erreur chargement données comptabilité:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadExerciceData = async (exerciceId: string) => {
    try {
      const [journauxRes, ecrituresRes, bilanRes, resultatRes] = await Promise.all([
        api.get('/comptabilite/journaux'),
        api.get(`/comptabilite/ecritures?exerciceId=${exerciceId}`),
        api.get(`/comptabilite/bilan?exerciceId=${exerciceId}`),
        api.get(`/comptabilite/compte-resultat?exerciceId=${exerciceId}`),
      ]);
      setJournaux(journauxRes.data);
      setEcritures(ecrituresRes.data);
      setBilan(bilanRes.data);
      setCompteResultat(resultatRes.data);
    } catch (error) {
      console.error('Erreur chargement données exercice:', error);
    }
  };

  const formatMontant = (montant: number) => {
    return new Intl.NumberFormat('fr-GN', {
      style: 'decimal',
      minimumFractionDigits: 0,
    }).format(montant / 100) + ' GNF';
  };

  const getStatutColor = (statut: string) => {
    switch (statut) {
      case 'OUVERT': return 'bg-green-500';
      case 'CLOTURE': return 'bg-blue-500';
      case 'ARCHIVE': return 'bg-gray-500';
      default: return 'bg-gray-500';
    }
  };

  const creerExercice = async (data: { annee: number }) => {
    try {
      await api.post('/comptabilite/exercices', {
        annee: data.annee,
        dateDebut: `${data.annee}-01-01`,
        dateFin: `${data.annee}-12-31`,
      });
      setShowNewExercice(false);
      loadData();
    } catch (error) {
      console.error('Erreur création exercice:', error);
    }
  };

  const cloturerExercice = async () => {
    if (!exerciceActif) return;
    if (!confirm('Êtes-vous sûr de vouloir clôturer cet exercice ?')) return;
    
    try {
      await api.post(`/comptabilite/exercices/${exerciceActif.id}/cloturer`);
      loadData();
    } catch (error) {
      console.error('Erreur clôture exercice:', error);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">Comptabilité OHADA</h1>
          <p className="text-muted-foreground">
            Gestion comptable conforme au plan comptable Syscohada révisé
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowNewExercice(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Nouvel Exercice
          </Button>
          {exerciceActif && (
            <Button variant="destructive" onClick={cloturerExercice}>
              Clôturer Exercice {exerciceActif.annee}
            </Button>
          )}
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Exercice Actif</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {exerciceActif ? exerciceActif.annee : 'Aucun'}
            </div>
            <p className="text-xs text-muted-foreground">
              {exerciceActif ? `Du ${new Date(exerciceActif.dateDebut).toLocaleDateString('fr')} au ${new Date(exerciceActif.dateFin).toLocaleDateString('fr')}` : 'Créez un exercice'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Résultat Net</CardTitle>
            {compteResultat?.resultatNet && compteResultat.resultatNet >= 0 ? (
              <TrendingUp className="h-4 w-4 text-green-500" />
            ) : (
              <TrendingDown className="h-4 w-4 text-red-500" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${compteResultat?.resultatNet && compteResultat.resultatNet < 0 ? 'text-red-500' : 'text-green-500'}`}>
              {compteResultat ? formatMontant(compteResultat.resultatNet) : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              {compteResultat?.resultatNet && compteResultat.resultatNet >= 0 ? 'Bénéfice' : 'Perte'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Actif</CardTitle>
            <BarChart3 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {bilan ? formatMontant(bilan.actif.totalActif) : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              Immobilisations + Stocks + Créances + Trésorerie
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Écritures</CardTitle>
            <FileText className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{ecritures.length}</div>
            <p className="text-xs text-muted-foreground">
              Lignes comptables ce exercice
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="journaux" className="space-y-4">
        <TabsList>
          <TabsTrigger value="journaux">Journaux</TabsTrigger>
          <TabsTrigger value="ecritures">Écritures</TabsTrigger>
          <TabsTrigger value="bilan">Bilan</TabsTrigger>
          <TabsTrigger value="resultat">Compte de Résultat</TabsTrigger>
          <TabsTrigger value="plan">Plan Comptable</TabsTrigger>
        </TabsList>

        {/* Journaux */}
        <TabsContent value="journaux" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Journal des Opérations</CardTitle>
              <CardDescription>
                Journaux comptables OHADA (Ventes, Achats, Banque, Caisse, OD)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Code</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {journaux.map((journal) => (
                    <TableRow key={journal.id}>
                      <TableCell className="font-medium">{journal.code}</TableCell>
                      <TableCell>{journal.nom}</TableCell>
                      <TableCell>{journal.type}</TableCell>
                      <TableCell>
                        <Badge className="bg-green-500">Actif</Badge>
                      </TableCell>
                      <TableCell>
                        <Button variant="ghost" size="sm">
                          <Eye className="h-4 w-4" />
                        </Button>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Écritures */}
        <TabsContent value="ecritures" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Écritures Comptables</CardTitle>
                <CardDescription>
                  Liste des écritures du journal
                </CardDescription>
              </div>
              <Button onClick={() => setShowNewEcriture(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Écriture
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Pièce</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Compte</TableHead>
                    <TableHead>Libellé</TableHead>
                    <TableHead className="text-right">Débit</TableHead>
                    <TableHead className="text-right">Crédit</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {ecritures.slice(0, 20).map((ecriture) => (
                    <TableRow key={ecriture.id}>
                      <TableCell className="font-medium">{ecriture.numeroPiece}</TableCell>
                      <TableCell>{new Date(ecriture.dateEcriture).toLocaleDateString('fr')}</TableCell>
                      <TableCell>
                        <div>
                          <div className="font-medium">{ecriture.compteNumero}</div>
                          <div className="text-xs text-muted-foreground">{ecriture.compteIntitule}</div>
                        </div>
                      </TableCell>
                      <TableCell>{ecriture.libelle}</TableCell>
                      <TableCell className="text-right">
                        {ecriture.debit > 0 ? formatMontant(ecriture.debit) : '-'}
                      </TableCell>
                      <TableCell className="text-right">
                        {ecriture.credit > 0 ? formatMontant(ecriture.credit) : '-'}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Bilan */}
        <TabsContent value="bilan" className="space-y-4">
          {bilan && (
            <div className="grid gap-6 md:grid-cols-2">
              {/* ACTIF */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-600">ACTIF</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span>Immobilisations</span>
                    <span className="font-medium">{formatMontant(bilan.actif.immobilisations.montant)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span>Stocks</span>
                    <span className="font-medium">{formatMontant(bilan.actif.stocks.montant)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span>Créances clients</span>
                    <span className="font-medium">{formatMontant(bilan.actif.creances.montant)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span>Trésorerie</span>
                    <span className="font-medium">{formatMontant(bilan.actif.tresorerie.montant)}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-green-100 rounded-lg border-2 border-green-300">
                    <span className="font-bold text-green-700">TOTAL ACTIF</span>
                    <span className="font-bold text-green-700 text-lg">{formatMontant(bilan.actif.totalActif)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* PASSIF */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-blue-600">PASSIF</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span>Capitaux propres</span>
                    <span className="font-medium">{formatMontant(bilan.passif.capitaux.montant)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span>Dettes</span>
                    <span className="font-medium">{formatMontant(bilan.passif.dettes.montant)}</span>
                  </div>
                  <div className="h-24"></div>
                  <div className="flex justify-between items-center p-4 bg-blue-100 rounded-lg border-2 border-blue-300">
                    <span className="font-bold text-blue-700">TOTAL PASSIF</span>
                    <span className="font-bold text-blue-700 text-lg">{formatMontant(bilan.passif.totalPassif)}</span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Compte de Résultat */}
        <TabsContent value="resultat" className="space-y-4">
          {compteResultat && (
            <div className="grid gap-6 md:grid-cols-2">
              {/* CHARGES */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-red-600">CHARGES</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span>Achats consommés</span>
                    <span className="font-medium">{formatMontant(compteResultat.charges.achats.montant)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span>Services externes</span>
                    <span className="font-medium">{formatMontant(compteResultat.charges.services.montant)}</span>
                  </div>
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span>Charges de personnel</span>
                    <span className="font-medium">{formatMontant(compteResultat.charges.personnel.montant)}</span>
                  </div>
                  <div className="flex justify-between items-center p-4 bg-red-100 rounded-lg border-2 border-red-300">
                    <span className="font-bold text-red-700">TOTAL CHARGES</span>
                    <span className="font-bold text-red-700 text-lg">{formatMontant(compteResultat.charges.totalCharges)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* PRODUITS */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-green-600">PRODUITS</CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex justify-between items-center p-3 bg-gray-50 rounded">
                    <span>Chiffre d'affaires</span>
                    <span className="font-medium">{formatMontant(compteResultat.produits.ventes.montant)}</span>
                  </div>
                  <div className="h-24"></div>
                  <div className="h-16"></div>
                  <div className="flex justify-between items-center p-4 bg-green-100 rounded-lg border-2 border-green-300">
                    <span className="font-bold text-green-700">TOTAL PRODUITS</span>
                    <span className="font-bold text-green-700 text-lg">{formatMontant(compteResultat.produits.totalProduits)}</span>
                  </div>
                </CardContent>
              </Card>

              {/* RÉSULTAT NET */}
              <Card className="md:col-span-2">
                <CardContent className="pt-6">
                  <div className={`flex justify-between items-center p-6 rounded-lg ${compteResultat.resultatNet >= 0 ? 'bg-green-100 border-2 border-green-400' : 'bg-red-100 border-2 border-red-400'}`}>
                    <div className="flex items-center gap-4">
                      {compteResultat.resultatNet >= 0 ? (
                        <CheckCircle className="h-8 w-8 text-green-600" />
                      ) : (
                        <AlertCircle className="h-8 w-8 text-red-600" />
                      )}
                      <div>
                        <div className="text-lg font-medium">
                          {compteResultat.resultatNet >= 0 ? 'BÉNÉFICE' : 'PERTE'}
                        </div>
                        <div className="text-sm text-muted-foreground">Résultat Net de l'Exercice</div>
                      </div>
                    </div>
                    <span className={`text-3xl font-bold ${compteResultat.resultatNet >= 0 ? 'text-green-700' : 'text-red-700'}`}>
                      {formatMontant(compteResultat.resultatNet)}
                    </span>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </TabsContent>

        {/* Plan Comptable */}
        <TabsContent value="plan" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Plan Comptable OHADA</CardTitle>
              <CardDescription>
                Plan comptable Syscohada révisé (9 classes)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3">
                {[
                  { classe: 1, nom: 'Capitaux', color: 'bg-blue-500' },
                  { classe: 2, nom: 'Immobilisations', color: 'bg-purple-500' },
                  { classe: 3, nom: 'Stocks', color: 'bg-yellow-500' },
                  { classe: 4, nom: 'Tiers', color: 'bg-orange-500' },
                  { classe: 5, nom: 'Trésorerie', color: 'bg-green-500' },
                  { classe: 6, nom: 'Charges', color: 'bg-red-500' },
                  { classe: 7, nom: 'Produits', color: 'bg-emerald-500' },
                  { classe: 8, nom: 'Résultats', color: 'bg-indigo-500' },
                  { classe: 9, nom: 'Comptes analytiques', color: 'bg-gray-500' },
                ].map((item) => (
                  <Card key={item.classe}>
                    <CardContent className="pt-6">
                      <div className="flex items-center gap-3">
                        <div className={`w-10 h-10 rounded-full ${item.color} flex items-center justify-center text-white font-bold`}>
                          {item.classe}
                        </div>
                        <div>
                          <div className="font-medium">Classe {item.classe}</div>
                          <div className="text-sm text-muted-foreground">{item.nom}</div>
                        </div>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Nouvel Exercice */}
      <Dialog open={showNewExercice} onOpenChange={setShowNewExercice}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Créer un nouvel exercice comptable</DialogTitle>
            <DialogDescription>
              L'exercice sera créé du 1er janvier au 31 décembre de l'année choisie.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => {
            e.preventDefault();
            const formData = new FormData(e.currentTarget);
            creerExercice({ annee: Number(formData.get('annee')) });
          }}>
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="annee">Année</Label>
                <Input
                  id="annee"
                  name="annee"
                  type="number"
                  min={2020}
                  max={2050}
                  defaultValue={new Date().getFullYear()}
                />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNewExercice(false)}>
                Annuler
              </Button>
              <Button type="submit">Créer l'exercice</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
