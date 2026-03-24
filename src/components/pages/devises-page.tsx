'use client';

import { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Badge } from '@/components/ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogFooter } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { 
  DollarSign, 
  RefreshCw, 
  TrendingUp, 
  ArrowRightLeft, 
  Plus,
  Globe,
  Clock,
  CheckCircle
} from 'lucide-react';
import api from '@/lib/api';

interface Devise {
  code: string;
  nom: string;
  symbole: string;
  pays?: string;
  actif: boolean;
}

interface TauxChange {
  id: string;
  deviseSource: { code: string; nom: string };
  deviseCible: { code: string; nom: string };
  taux: number;
  dateEffet: string;
  source: string;
  actif: boolean;
}

interface Conversion {
  id: string;
  montant: number;
  deviseSource: string;
  deviseCible: string;
  tauxApplique: number;
  montantConverti: number;
  dateConversion: string;
  reference?: string;
}

function DevisesPageComponent() {
  const [devises, setDevises] = useState<Devise[]>([]);
  const [tauxActuels, setTauxActuels] = useState<any>(null);
  const [conversions, setConversions] = useState<Conversion[]>([]);
  const [loading, setLoading] = useState(true);
  const [showConverter, setShowConverter] = useState(false);
  const [showNewTaux, setShowNewTaux] = useState(false);
  const [conversionResult, setConversionResult] = useState<any>(null);

  // Form states
  const [convertFrom, setConvertFrom] = useState('EUR');
  const [convertTo, setConvertTo] = useState('GNF');
  const [convertAmount, setConvertAmount] = useState('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [devisesRes, tauxRes, conversionsRes] = await Promise.all([
        api.get('/devises'),
        api.get('/devises/taux-actuels/EUR'),
        api.get('/devises/conversions'),
      ]);
      setDevises(devisesRes.data);
      setTauxActuels(tauxRes.data);
      setConversions(conversionsRes.data);
    } catch (error) {
      console.error('Erreur chargement devises:', error);
    } finally {
      setLoading(false);
    }
  };

  const formatMontant = (montant: number, devise: string = 'GNF') => {
    return new Intl.NumberFormat('fr-GN', {
      style: 'decimal',
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(montant) + ' ' + devise;
  };

  const convertir = async () => {
    if (!convertAmount) return;
    try {
      const res = await api.post('/devises/convertir', {
        montant: Number(convertAmount),
        deviseSource: convertFrom,
        deviseCible: convertTo,
      });
      setConversionResult(res.data);
    } catch (error) {
      console.error('Erreur conversion:', error);
    }
  };

  const definirTaux = async (formData: FormData) => {
    try {
      await api.post('/devises/taux', {
        deviseSource: formData.get('deviseSource'),
        deviseCible: formData.get('deviseCible'),
        taux: Number(formData.get('taux')),
        source: 'MANUEL',
      });
      setShowNewTaux(false);
      loadData();
    } catch (error) {
      console.error('Erreur définition taux:', error);
    }
  };

  const updateTauxFromAPI = async () => {
    try {
      await api.post('/devises/taux/update-api');
      loadData();
    } catch (error) {
      console.error('Erreur mise à jour taux:', error);
    }
  };

  const getDeviseFlag = (code: string) => {
    const flags: Record<string, string> = {
      'GNF': '🇬🇳',
      'XOF': '🌍',
      'XAF': '🌍',
      'EUR': '🇪🇺',
      'USD': '🇺🇸',
      'GBP': '🇬🇧',
      'CNY': '🇨🇳',
      'NGN': '🇳🇬',
      'GHS': '🇬🇭',
    };
    return flags[code] || '🌍';
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
          <h1 className="text-3xl font-bold">Multi-Devises</h1>
          <p className="text-muted-foreground">
            Gestion des taux de change et conversions pour l'Afrique de l'Ouest
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={updateTauxFromAPI}>
            <RefreshCw className="h-4 w-4 mr-2" />
            Actualiser les taux
          </Button>
          <Button onClick={() => setShowConverter(true)}>
            <ArrowRightLeft className="h-4 w-4 mr-2" />
            Convertir
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Devises Supportées</CardTitle>
            <Globe className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{devises.length}</div>
            <p className="text-xs text-muted-foreground">
              Afrique de l'Ouest et internationales
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dernière Mise à Jour</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {tauxActuels?.dateMaj ? new Date(tauxActuels.dateMaj).toLocaleDateString('fr') : '-'}
            </div>
            <p className="text-xs text-muted-foreground">
              Taux actualisés régulièrement
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conversions</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{conversions.length}</div>
            <p className="text-xs text-muted-foreground">
              Opérations ce mois
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="taux" className="space-y-4">
        <TabsList>
          <TabsTrigger value="taux">Taux de Change</TabsTrigger>
          <TabsTrigger value="devises">Devises</TabsTrigger>
          <TabsTrigger value="historique">Historique Conversions</TabsTrigger>
        </TabsList>

        {/* Taux de Change */}
        <TabsContent value="taux" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Taux de Change Actuels</CardTitle>
                <CardDescription>
                  Taux de référence basés sur l'Euro (EUR)
                </CardDescription>
              </div>
              <Button variant="outline" onClick={() => setShowNewTaux(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Définir un taux
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Devise</TableHead>
                    <TableHead>Nom</TableHead>
                    <TableHead className="text-right">Taux (1 EUR =)</TableHead>
                    <TableHead>Pays</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {tauxActuels?.taux?.map((item: any) => (
                    <TableRow key={item.code}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <span className="text-xl">{getDeviseFlag(item.code)}</span>
                          <span className="font-bold">{item.code}</span>
                        </div>
                      </TableCell>
                      <TableCell>{item.nom}</TableCell>
                      <TableCell className="text-right font-medium">
                        {item.taux ? item.taux.toLocaleString('fr', { maximumFractionDigits: 4 }) : '-'}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{item.pays || 'International'}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Devises */}
        <TabsContent value="devises" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Devises Disponibles</CardTitle>
              <CardDescription>
                Toutes les devises supportées par le système
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-3 lg:grid-cols-4">
                {devises.map((devise) => (
                  <Card key={devise.code} className="p-4">
                    <div className="flex items-center gap-3">
                      <span className="text-3xl">{getDeviseFlag(devise.code)}</span>
                      <div>
                        <div className="font-bold">{devise.code}</div>
                        <div className="text-sm text-muted-foreground">{devise.nom}</div>
                        {devise.pays && (
                          <Badge variant="outline" className="mt-1">{devise.pays}</Badge>
                        )}
                      </div>
                    </div>
                  </Card>
                ))}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Historique Conversions */}
        <TabsContent value="historique" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Historique des Conversions</CardTitle>
              <CardDescription>
                Liste des conversions effectuées
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Montant Source</TableHead>
                    <TableHead>Taux</TableHead>
                    <TableHead>Montant Converti</TableHead>
                    <TableHead>Référence</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {conversions.map((conv) => (
                    <TableRow key={conv.id}>
                      <TableCell>
                        {new Date(conv.dateConversion).toLocaleDateString('fr')}
                      </TableCell>
                      <TableCell>
                        <span className="font-medium">{formatMontant(conv.montant, conv.deviseSource)}</span>
                      </TableCell>
                      <TableCell>{conv.tauxApplique.toFixed(4)}</TableCell>
                      <TableCell>
                        <span className="font-medium text-green-600">
                          {formatMontant(conv.montantConverti, conv.deviseCible)}
                        </span>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{conv.reference || '-'}</Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Convertisseur */}
      <Dialog open={showConverter} onOpenChange={setShowConverter}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Convertisseur de Devises</DialogTitle>
            <DialogDescription>
              Convertissez un montant entre deux devises
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="space-y-2">
              <Label>Montant à convertir</Label>
              <Input
                type="number"
                value={convertAmount}
                onChange={(e) => setConvertAmount(e.target.value)}
                placeholder="Entrez un montant"
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label>De</Label>
                <Select value={convertFrom} onValueChange={setConvertFrom}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {devises.map((d) => (
                      <SelectItem key={d.code} value={d.code}>
                        {getDeviseFlag(d.code)} {d.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label>Vers</Label>
                <Select value={convertTo} onValueChange={setConvertTo}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {devises.map((d) => (
                      <SelectItem key={d.code} value={d.code}>
                        {getDeviseFlag(d.code)} {d.code}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={convertir} className="w-full">
              <ArrowRightLeft className="h-4 w-4 mr-2" />
              Convertir
            </Button>
            
            {conversionResult && (
              <Card className="bg-green-50 border-green-200">
                <CardContent className="pt-4">
                  <div className="text-center">
                    <div className="text-sm text-muted-foreground">Résultat</div>
                    <div className="text-2xl font-bold text-green-600">
                      {formatMontant(conversionResult.montantConverti, convertTo)}
                    </div>
                    <div className="text-xs text-muted-foreground mt-1">
                      Taux: 1 {convertFrom} = {conversionResult.taux.toFixed(4)} {convertTo}
                    </div>
                  </div>
                </CardContent>
              </Card>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Dialog Nouveau Taux */}
      <Dialog open={showNewTaux} onOpenChange={setShowNewTaux}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Définir un Taux de Change</DialogTitle>
            <DialogDescription>
              Entrez manuellement un nouveau taux de change
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); definirTaux(new FormData(e.currentTarget)); }}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="deviseSource">Devise Source</Label>
                  <Select name="deviseSource">
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {devises.map((d) => (
                        <SelectItem key={d.code} value={d.code}>
                          {d.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="deviseCible">Devise Cible</Label>
                  <Select name="deviseCible">
                    <SelectTrigger>
                      <SelectValue placeholder="Sélectionner..." />
                    </SelectTrigger>
                    <SelectContent>
                      {devises.map((d) => (
                        <SelectItem key={d.code} value={d.code}>
                          {d.code}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="taux">Taux (1 source = X cible)</Label>
                <Input id="taux" name="taux" type="number" step="0.0001" required />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNewTaux(false)}>
                Annuler
              </Button>
              <Button type="submit">Enregistrer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}

export const DevisesPage = DevisesPageComponent;
export default DevisesPageComponent;
