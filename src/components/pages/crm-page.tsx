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
import { Textarea } from '@/components/ui/textarea';
import { Progress } from '@/components/ui/progress';
import { 
  Users, 
  TrendingUp, 
  Target, 
  Calendar, 
  Plus, 
  Eye,
  Phone,
  Mail,
  Building,
  CheckCircle,
  Clock,
  AlertCircle,
  DollarSign,
  Activity,
  ChevronRight
} from 'lucide-react';
import api from '@/lib/api';

interface Prospect {
  id: string;
  nom: string;
  prenom?: string;
  email?: string;
  telephone?: string;
  entreprise?: string;
  source?: string;
  statut: string;
  score: number;
  budget?: number;
  dernierContact?: string;
  _count?: { opportunites: number; activites: number };
}

interface Opportunite {
  id: string;
  nom: string;
  montant: number;
  probabilite: number;
  etape: string;
  statut: string;
  prospect: { nom: string; entreprise?: string };
  dateCloturePrevue?: string;
}

interface Activite {
  id: string;
  type: string;
  titre: string;
  dateDebut: string;
  statut: string;
  priorite: string;
  prospect?: { nom: string };
}

interface Dashboard {
  totalProspects: number;
  opportunitesActives: number;
  activitesAujourdhui: number;
  pipelineStats: {
    totalPipeline: number;
    ponderePipeline: number;
    nombreOpportunites: number;
  };
  prospectsParStatut: Array<{ statut: string; count: number }>;
}

export default function CRMPage() {
  const [dashboard, setDashboard] = useState<Dashboard | null>(null);
  const [prospects, setProspects] = useState<Prospect[]>([]);
  const [opportunites, setOpportunites] = useState<Opportunite[]>([]);
  const [activites, setActivites] = useState<Activite[]>([]);
  const [loading, setLoading] = useState(true);
  const [showNewProspect, setShowNewProspect] = useState(false);
  const [showNewOpportunite, setShowNewOpportunite] = useState(false);
  const [showNewActivite, setShowNewActivite] = useState(false);
  const [selectedProspect, setSelectedProspect] = useState<string>('');

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      const [dashboardRes, prospectsRes, opportunitesRes, activitesRes] = await Promise.all([
        api.get('/crm/dashboard'),
        api.get('/crm/prospects'),
        api.get('/crm/opportunites'),
        api.get('/crm/activites'),
      ]);
      setDashboard(dashboardRes.data);
      setProspects(prospectsRes.data.data || []);
      setOpportunites(opportunitesRes.data.data || []);
      setActivites(activitesRes.data.data || []);
    } catch (error) {
      console.error('Erreur chargement données CRM:', error);
    } finally {
      setLoading(false);
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
      case 'NOUVEAU': return 'bg-blue-500';
      case 'CONTACTE': return 'bg-yellow-500';
      case 'QUALIFIE': return 'bg-purple-500';
      case 'PROPOSITION': return 'bg-orange-500';
      case 'NEGOCIATION': return 'bg-pink-500';
      case 'GAGNE': return 'bg-green-500';
      case 'PERDU': return 'bg-red-500';
      default: return 'bg-gray-500';
    }
  };

  const getEtapeColor = (etape: string) => {
    switch (etape) {
      case 'PROSPECTION': return 'bg-blue-100 text-blue-700';
      case 'QUALIFICATION': return 'bg-yellow-100 text-yellow-700';
      case 'PROPOSITION': return 'bg-orange-100 text-orange-700';
      case 'NEGOCIATION': return 'bg-purple-100 text-purple-700';
      case 'CLOSURE': return 'bg-green-100 text-green-700';
      default: return 'bg-gray-100 text-gray-700';
    }
  };

  const getTypeActiviteIcon = (type: string) => {
    switch (type) {
      case 'APPEL': return <Phone className="h-4 w-4" />;
      case 'EMAIL': return <Mail className="h-4 w-4" />;
      case 'REUNION': return <Calendar className="h-4 w-4" />;
      case 'TACHE': return <CheckCircle className="h-4 w-4" />;
      default: return <Activity className="h-4 w-4" />;
    }
  };

  const creerProspect = async (formData: FormData) => {
    try {
      await api.post('/crm/prospects', {
        nom: formData.get('nom'),
        prenom: formData.get('prenom'),
        email: formData.get('email'),
        telephone: formData.get('telephone'),
        entreprise: formData.get('entreprise'),
        poste: formData.get('poste'),
        source: formData.get('source'),
        budget: formData.get('budget') ? Number(formData.get('budget')) * 100 : undefined,
        notes: formData.get('notes'),
      });
      setShowNewProspect(false);
      loadData();
    } catch (error) {
      console.error('Erreur création prospect:', error);
    }
  };

  const creerOpportunite = async (formData: FormData) => {
    try {
      await api.post('/crm/opportunites', {
        prospectId: selectedProspect || formData.get('prospectId'),
        nom: formData.get('nom'),
        description: formData.get('description'),
        montant: Number(formData.get('montant')) * 100,
        probabilite: Number(formData.get('probabilite')),
        dateCloturePrevue: formData.get('dateCloturePrevue') || undefined,
      });
      setShowNewOpportunite(false);
      loadData();
    } catch (error) {
      console.error('Erreur création opportunité:', error);
    }
  };

  const creerActivite = async (formData: FormData) => {
    try {
      await api.post('/crm/activites', {
        prospectId: formData.get('prospectId') || undefined,
        opportuniteId: formData.get('opportuniteId') || undefined,
        type: formData.get('type'),
        titre: formData.get('titre'),
        description: formData.get('description'),
        dateDebut: formData.get('dateDebut'),
        dateFin: formData.get('dateFin') || undefined,
        priorite: formData.get('priorite'),
      });
      setShowNewActivite(false);
      loadData();
    } catch (error) {
      console.error('Erreur création activité:', error);
    }
  };

  const convertirEnClient = async (prospectId: string) => {
    if (!confirm('Convertir ce prospect en client ?')) return;
    try {
      await api.post(`/crm/prospects/${prospectId}/convertir`);
      loadData();
    } catch (error) {
      console.error('Erreur conversion prospect:', error);
    }
  };

  const gagnerOpportunite = async (opportuniteId: string) => {
    if (!confirm('Marquer cette opportunité comme gagnée ?')) return;
    try {
      await api.post(`/crm/opportunites/${opportuniteId}/gagner`);
      loadData();
    } catch (error) {
      console.error('Erreur gain opportunité:', error);
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
          <h1 className="text-3xl font-bold">CRM</h1>
          <p className="text-muted-foreground">
            Gestion des prospects, opportunités et activités commerciales
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => setShowNewActivite(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Activité
          </Button>
          <Button onClick={() => setShowNewProspect(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Prospect
          </Button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid gap-4 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Prospects</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard?.totalProspects || 0}</div>
            <p className="text-xs text-muted-foreground">
              Contacts en cours de prospection
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {dashboard?.pipelineStats ? formatMontant(dashboard.pipelineStats.totalPipeline) : '0 GNF'}
            </div>
            <p className="text-xs text-muted-foreground">
              {dashboard?.pipelineStats?.nombreOpportunites || 0} opportunités en cours
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Pipeline Pondéré</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">
              {dashboard?.pipelineStats ? formatMontant(dashboard.pipelineStats.ponderePipeline) : '0 GNF'}
            </div>
            <p className="text-xs text-muted-foreground">
              Valeur estimée avec probabilités
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Activités Aujourd'hui</CardTitle>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{dashboard?.activitesAujourdhui || 0}</div>
            <p className="text-xs text-muted-foreground">
              Tâches et rendez-vous planifiés
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Main Content */}
      <Tabs defaultValue="prospects" className="space-y-4">
        <TabsList>
          <TabsTrigger value="prospects">Prospects</TabsTrigger>
          <TabsTrigger value="pipeline">Pipeline</TabsTrigger>
          <TabsTrigger value="activites">Activités</TabsTrigger>
        </TabsList>

        {/* Prospects */}
        <TabsContent value="prospects" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Liste des Prospects</CardTitle>
                <CardDescription>
                  Gérez vos contacts et suivez leur progression
                </CardDescription>
              </div>
              <Button onClick={() => setShowNewProspect(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nouveau Prospect
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Nom / Entreprise</TableHead>
                    <TableHead>Contact</TableHead>
                    <TableHead>Source</TableHead>
                    <TableHead>Statut</TableHead>
                    <TableHead>Score</TableHead>
                    <TableHead>Opp.</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {prospects.map((prospect) => (
                    <TableRow key={prospect.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">
                            {prospect.entreprise || `${prospect.nom} ${prospect.prenom || ''}`}
                          </div>
                          {prospect.entreprise && (
                            <div className="text-xs text-muted-foreground">
                              {prospect.nom} {prospect.prenom}
                            </div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>
                        <div className="text-sm">
                          {prospect.email && <div>{prospect.email}</div>}
                          {prospect.telephone && <div className="text-muted-foreground">{prospect.telephone}</div>}
                        </div>
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">{prospect.source || '-'}</Badge>
                      </TableCell>
                      <TableCell>
                        <Badge className={getStatutColor(prospect.statut)}>
                          {prospect.statut}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          <Progress value={prospect.score} className="w-16 h-2" />
                          <span className="text-sm">{prospect.score}</span>
                        </div>
                      </TableCell>
                      <TableCell>{prospect._count?.opportunites || 0}</TableCell>
                      <TableCell>
                        <div className="flex gap-1">
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => {
                              setSelectedProspect(prospect.id);
                              setShowNewOpportunite(true);
                            }}
                          >
                            <Target className="h-4 w-4" />
                          </Button>
                          <Button 
                            variant="ghost" 
                            size="sm"
                            onClick={() => convertirEnClient(prospect.id)}
                          >
                            <CheckCircle className="h-4 w-4" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Pipeline */}
        <TabsContent value="pipeline" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Pipeline de Vente</CardTitle>
                <CardDescription>
                  Visualisez et gérez vos opportunités par étape
                </CardDescription>
              </div>
              <Button onClick={() => setShowNewOpportunite(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Opportunité
              </Button>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-5">
                {['PROSPECTION', 'QUALIFICATION', 'PROPOSITION', 'NEGOCIATION', 'CLOSURE'].map((etape) => {
                  const opps = opportunites.filter(o => o.etape === etape && o.statut === 'EN_COURS');
                  const total = opps.reduce((sum, o) => sum + o.montant, 0);
                  
                  return (
                    <div key={etape} className="space-y-2">
                      <div className={`p-3 rounded-t-lg ${getEtapeColor(etape)}`}>
                        <div className="font-medium">{etape}</div>
                        <div className="text-sm">{opps.length} opp. • {formatMontant(total)}</div>
                      </div>
                      <div className="space-y-2 min-h-[200px]">
                        {opps.map((opp) => (
                          <Card key={opp.id} className="p-3 cursor-pointer hover:shadow-md transition-shadow">
                            <div className="font-medium text-sm truncate">{opp.nom}</div>
                            <div className="text-xs text-muted-foreground mt-1">
                              {opp.prospect.entreprise || opp.prospect.nom}
                            </div>
                            <div className="flex justify-between items-center mt-2">
                              <span className="font-medium text-sm">{formatMontant(opp.montant)}</span>
                              <span className="text-xs text-muted-foreground">{opp.probabilite}%</span>
                            </div>
                            {opp.dateCloturePrevue && (
                              <div className="text-xs text-muted-foreground mt-1">
                                <Calendar className="h-3 w-3 inline mr-1" />
                                {new Date(opp.dateCloturePrevue).toLocaleDateString('fr')}
                              </div>
                            )}
                            <div className="flex gap-1 mt-2">
                              <Button 
                                variant="ghost" 
                                size="sm" 
                                className="h-6 text-xs"
                                onClick={() => gagnerOpportunite(opp.id)}
                              >
                                Gagner
                              </Button>
                            </div>
                          </Card>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Activités */}
        <TabsContent value="activites" className="space-y-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between">
              <div>
                <CardTitle>Activités</CardTitle>
                <CardDescription>
                  Suivez vos appels, emails, réunions et tâches
                </CardDescription>
              </div>
              <Button onClick={() => setShowNewActivite(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Nouvelle Activité
              </Button>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Type</TableHead>
                    <TableHead>Titre</TableHead>
                    <TableHead>Prospect</TableHead>
                    <TableHead>Date</TableHead>
                    <TableHead>Priorité</TableHead>
                    <TableHead>Statut</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {activites.map((activite) => (
                    <TableRow key={activite.id}>
                      <TableCell>
                        <div className="flex items-center gap-2">
                          {getTypeActiviteIcon(activite.type)}
                          <span>{activite.type}</span>
                        </div>
                      </TableCell>
                      <TableCell className="font-medium">{activite.titre}</TableCell>
                      <TableCell>{activite.prospect?.nom || '-'}</TableCell>
                      <TableCell>
                        {new Date(activite.dateDebut).toLocaleDateString('fr')}
                      </TableCell>
                      <TableCell>
                        <Badge variant={activite.priorite === 'HAUTE' ? 'destructive' : 'secondary'}>
                          {activite.priorite}
                        </Badge>
                      </TableCell>
                      <TableCell>
                        <Badge variant={activite.statut === 'TERMINE' ? 'default' : 'outline'}>
                          {activite.statut}
                        </Badge>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>

      {/* Dialog Nouveau Prospect */}
      <Dialog open={showNewProspect} onOpenChange={setShowNewProspect}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nouveau Prospect</DialogTitle>
            <DialogDescription>
              Ajoutez un nouveau contact à votre pipeline
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); creerProspect(new FormData(e.currentTarget)); }}>
            <div className="grid gap-4 py-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="nom">Nom *</Label>
                  <Input id="nom" name="nom" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="prenom">Prénom</Label>
                  <Input id="prenom" name="prenom" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="entreprise">Entreprise</Label>
                <Input id="entreprise" name="entreprise" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="email">Email</Label>
                  <Input id="email" name="email" type="email" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="telephone">Téléphone</Label>
                  <Input id="telephone" name="telephone" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <Select name="source">
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="SITE_WEB">Site web</SelectItem>
                    <SelectItem value="REFERRAL">Référence</SelectItem>
                    <SelectItem value="RESEAUX_SOCIAUX">Réseaux sociaux</SelectItem>
                    <SelectItem value="COLD_CALLING">Prospection téléphonique</SelectItem>
                    <SelectItem value="SALON">Salon / Événement</SelectItem>
                    <SelectItem value="AUTRE">Autre</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="budget">Budget estimé (GNF)</Label>
                <Input id="budget" name="budget" type="number" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="notes">Notes</Label>
                <Textarea id="notes" name="notes" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNewProspect(false)}>
                Annuler
              </Button>
              <Button type="submit">Créer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Nouvelle Opportunité */}
      <Dialog open={showNewOpportunite} onOpenChange={setShowNewOpportunite}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvelle Opportunité</DialogTitle>
            <DialogDescription>
              Créez une nouvelle opportunité de vente
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); creerOpportunite(new FormData(e.currentTarget)); }}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="prospectId">Prospect *</Label>
                <Select name="prospectId" defaultValue={selectedProspect}>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner un prospect..." />
                  </SelectTrigger>
                  <SelectContent>
                    {prospects.map((p) => (
                      <SelectItem key={p.id} value={p.id}>
                        {p.entreprise || p.nom}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="nom">Nom de l'opportunité *</Label>
                <Input id="nom" name="nom" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="montant">Montant (GNF) *</Label>
                  <Input id="montant" name="montant" type="number" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="probabilite">Probabilité (%)</Label>
                  <Input id="probabilite" name="probabilite" type="number" min="0" max="100" defaultValue="50" />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="dateCloturePrevue">Date de clôture prévue</Label>
                <Input id="dateCloturePrevue" name="dateCloturePrevue" type="date" />
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNewOpportunite(false)}>
                Annuler
              </Button>
              <Button type="submit">Créer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Dialog Nouvelle Activité */}
      <Dialog open={showNewActivite} onOpenChange={setShowNewActivite}>
        <DialogContent className="max-w-md">
          <DialogHeader>
            <DialogTitle>Nouvelle Activité</DialogTitle>
            <DialogDescription>
              Planifiez une nouvelle activité
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={(e) => { e.preventDefault(); creerActivite(new FormData(e.currentTarget)); }}>
            <div className="grid gap-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="type">Type *</Label>
                <Select name="type" required>
                  <SelectTrigger>
                    <SelectValue placeholder="Sélectionner..." />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="APPEL">Appel téléphonique</SelectItem>
                    <SelectItem value="EMAIL">Email</SelectItem>
                    <SelectItem value="REUNION">Réunion</SelectItem>
                    <SelectItem value="TACHE">Tâche</SelectItem>
                    <SelectItem value="NOTE">Note</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="titre">Titre *</Label>
                <Input id="titre" name="titre" required />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="dateDebut">Date début *</Label>
                  <Input id="dateDebut" name="dateDebut" type="datetime-local" required />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="priorite">Priorité</Label>
                  <Select name="priorite">
                    <SelectTrigger>
                      <SelectValue placeholder="Normale" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="BASSE">Basse</SelectItem>
                      <SelectItem value="NORMALE">Normale</SelectItem>
                      <SelectItem value="HAUTE">Haute</SelectItem>
                    </SelectContent>
                  </Select>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="description">Description</Label>
                <Textarea id="description" name="description" />
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setShowNewActivite(false)}>
                Annuler
              </Button>
              <Button type="submit">Créer</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
