'use client';

import { useState } from 'react';
import { Building, User, Lock, Bell, Palette, Database, Save, CheckCircle } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Badge } from '@/components/ui/badge';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Separator } from '@/components/ui/separator';
import { useAppStore } from '@/stores/auth-store';
import { formatGNF } from '@/lib/mock-data';

export function SettingsPage() {
  const { user, company, logout } = useAppStore();
  const [saved, setSaved] = useState(false);
  
  // Company settings
  const [companyData, setCompanyData] = useState({
    nom: company?.nom || '',
    email: company?.email || '',
    telephone: company?.telephone || '',
    adresse: company?.adresse || '',
    ville: company?.ville || '',
    pays: company?.pays || 'Guinée',
    ninea: company?.ninea || '',
    devise: company?.devise || 'GNF'
  });

  // User settings
  const [userData, setUserData] = useState({
    nom: user?.nom || '',
    prenom: user?.prenom || '',
    email: user?.email || '',
    telephone: user?.telephone || ''
  });

  // Notification settings
  const [notifications, setNotifications] = useState({
    emailFactures: true,
    emailPaiements: true,
    emailStock: true,
    emailPaie: true,
    pushFactures: false,
    pushPaiements: true
  });

  // Appearance settings
  const [appearance, setAppearance] = useState({
    theme: 'light',
    language: 'fr',
    dateFormat: 'DD/MM/YYYY',
    currency: 'GNF'
  });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 3000);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Paramètres</h2>
          <p className="text-slate-500">Gérez vos préférences et paramètres de compte</p>
        </div>
        <Button className="bg-emerald-600 hover:bg-emerald-700" onClick={handleSave}>
          {saved ? <CheckCircle className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          {saved ? 'Enregistré' : 'Enregistrer'}
        </Button>
      </div>

      <Tabs defaultValue="company" className="space-y-6">
        <TabsList className="grid grid-cols-5 w-full max-w-2xl">
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            <span className="hidden sm:inline">Entreprise</span>
          </TabsTrigger>
          <TabsTrigger value="profile" className="flex items-center gap-2">
            <User className="w-4 h-4" />
            <span className="hidden sm:inline">Profil</span>
          </TabsTrigger>
          <TabsTrigger value="security" className="flex items-center gap-2">
            <Lock className="w-4 h-4" />
            <span className="hidden sm:inline">Sécurité</span>
          </TabsTrigger>
          <TabsTrigger value="notifications" className="flex items-center gap-2">
            <Bell className="w-4 h-4" />
            <span className="hidden sm:inline">Notifications</span>
          </TabsTrigger>
          <TabsTrigger value="appearance" className="flex items-center gap-2">
            <Palette className="w-4 h-4" />
            <span className="hidden sm:inline">Apparence</span>
          </TabsTrigger>
        </TabsList>

        {/* Company Settings */}
        <TabsContent value="company">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="w-5 h-5" />
                  Informations de l'entreprise
                </CardTitle>
                <CardDescription>
                  Ces informations apparaîtront sur vos factures et documents officiels.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="companyName">Nom de l'entreprise</Label>
                    <Input
                      id="companyName"
                      value={companyData.nom}
                      onChange={(e) => setCompanyData({...companyData, nom: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="ninea">NINEA</Label>
                    <Input
                      id="ninea"
                      value={companyData.ninea}
                      onChange={(e) => setCompanyData({...companyData, ninea: e.target.value})}
                      placeholder="Numéro d'identification national"
                    />
                  </div>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="companyEmail">Email professionnel</Label>
                    <Input
                      id="companyEmail"
                      type="email"
                      value={companyData.email}
                      onChange={(e) => setCompanyData({...companyData, email: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyPhone">Téléphone</Label>
                    <Input
                      id="companyPhone"
                      value={companyData.telephone}
                      onChange={(e) => setCompanyData({...companyData, telephone: e.target.value})}
                    />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="companyAddress">Adresse</Label>
                  <Input
                    id="companyAddress"
                    value={companyData.adresse}
                    onChange={(e) => setCompanyData({...companyData, adresse: e.target.value})}
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label htmlFor="companyCity">Ville</Label>
                    <Input
                      id="companyCity"
                      value={companyData.ville}
                      onChange={(e) => setCompanyData({...companyData, ville: e.target.value})}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyCountry">Pays</Label>
                    <Select value={companyData.pays} onValueChange={(value) => setCompanyData({...companyData, pays: value})}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="Guinée">Guinée</SelectItem>
                        <SelectItem value="Sénégal">Sénégal</SelectItem>
                        <SelectItem value="Mali">Mali</SelectItem>
                        <SelectItem value="Côte d'Ivoire">Côte d'Ivoire</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Subscription Info */}
            <Card>
              <CardHeader>
                <CardTitle>Abonnement</CardTitle>
                <CardDescription>Votre plan actuel et les fonctionnalités disponibles.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-100 rounded-lg">
                      <Database className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold">Plan {company?.plan || 'STANDARD'}</p>
                      <p className="text-sm text-slate-500">Accès complet à toutes les fonctionnalités</p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-600">Actif</Badge>
                </div>
                <Separator className="my-4" />
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                  <div>
                    <p className="text-slate-500">Clients</p>
                    <p className="font-medium">Illimité</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Produits</p>
                    <p className="font-medium">Illimité</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Factures/mois</p>
                    <p className="font-medium">Illimité</p>
                  </div>
                  <div>
                    <p className="text-slate-500">Employés</p>
                    <p className="font-medium">Illimité</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Profile Settings */}
        <TabsContent value="profile">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="w-5 h-5" />
                Informations personnelles
              </CardTitle>
              <CardDescription>
                Mettez à jour vos informations personnelles.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center gap-6">
                <div className="w-20 h-20 bg-emerald-600 rounded-full flex items-center justify-center text-white text-2xl font-bold">
                  {userData.prenom[0]}{userData.nom[0]}
                </div>
                <div>
                  <Button variant="outline" size="sm">Changer la photo</Button>
                  <p className="text-xs text-slate-500 mt-1">JPG, PNG. Max 2MB</p>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="firstName">Prénom</Label>
                  <Input
                    id="firstName"
                    value={userData.prenom}
                    onChange={(e) => setUserData({...userData, prenom: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    value={userData.nom}
                    onChange={(e) => setUserData({...userData, nom: e.target.value})}
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="userEmail">Email</Label>
                  <Input
                    id="userEmail"
                    type="email"
                    value={userData.email}
                    onChange={(e) => setUserData({...userData, email: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="userPhone">Téléphone</Label>
                  <Input
                    id="userPhone"
                    value={userData.telephone}
                    onChange={(e) => setUserData({...userData, telephone: e.target.value})}
                  />
                </div>
              </div>
              <div className="pt-4 border-t">
                <p className="text-sm text-slate-500">
                  Rôle: <Badge>{user?.role || 'ADMIN'}</Badge>
                </p>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Security Settings */}
        <TabsContent value="security">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Lock className="w-5 h-5" />
                  Changer le mot de passe
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="currentPassword">Mot de passe actuel</Label>
                  <Input id="currentPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                  <Input id="newPassword" type="password" />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <Input id="confirmPassword" type="password" />
                </div>
                <Button>Modifier le mot de passe</Button>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Sessions actives</CardTitle>
                <CardDescription>Gérez vos appareils connectés.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-center justify-between p-3 bg-slate-50 rounded-lg">
                    <div className="flex items-center gap-3">
                      <div className="w-2 h-2 bg-emerald-500 rounded-full"></div>
                      <div>
                        <p className="font-medium">Session actuelle</p>
                        <p className="text-sm text-slate-500">Conakry, Guinée • Chrome sur Windows</p>
                      </div>
                    </div>
                    <Badge className="bg-emerald-600">Active</Badge>
                  </div>
                </div>
              </CardContent>
            </Card>

            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600">Zone de danger</CardTitle>
                <CardDescription>Actions irréversibles.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium">Déconnexion</p>
                    <p className="text-sm text-slate-500">Se déconnecter de tous les appareils</p>
                  </div>
                  <Button variant="outline" onClick={logout}>Se déconnecter</Button>
                </div>
                <Separator />
                <div className="flex items-center justify-between">
                  <div>
                    <p className="font-medium text-red-600">Supprimer le compte</p>
                    <p className="text-sm text-slate-500">Cette action est irréversible</p>
                  </div>
                  <Button variant="destructive">Supprimer</Button>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Notifications Settings */}
        <TabsContent value="notifications">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Bell className="w-5 h-5" />
                Préférences de notification
              </CardTitle>
              <CardDescription>
                Choisissez comment vous souhaitez être notifié.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div>
                <h4 className="font-medium mb-4">Notifications par email</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Nouvelles factures</p>
                      <p className="text-sm text-slate-500">Recevoir un email pour chaque nouvelle facture</p>
                    </div>
                    <Switch 
                      checked={notifications.emailFactures} 
                      onCheckedChange={(checked) => setNotifications({...notifications, emailFactures: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Paiements reçus</p>
                      <p className="text-sm text-slate-500">Être notifié des paiements</p>
                    </div>
                    <Switch 
                      checked={notifications.emailPaiements} 
                      onCheckedChange={(checked) => setNotifications({...notifications, emailPaiements: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Alertes stock</p>
                      <p className="text-sm text-slate-500">Être alerté des stocks bas</p>
                    </div>
                    <Switch 
                      checked={notifications.emailStock} 
                      onCheckedChange={(checked) => setNotifications({...notifications, emailStock: checked})}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Paie</p>
                      <p className="text-sm text-slate-500">Rappels de paie mensuelle</p>
                    </div>
                    <Switch 
                      checked={notifications.emailPaie} 
                      onCheckedChange={(checked) => setNotifications({...notifications, emailPaie: checked})}
                    />
                  </div>
                </div>
              </div>
              <Separator />
              <div>
                <h4 className="font-medium mb-4">Notifications push</h4>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium">Notifications navigateur</p>
                      <p className="text-sm text-slate-500">Autoriser les notifications dans le navigateur</p>
                    </div>
                    <Switch />
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* Appearance Settings */}
        <TabsContent value="appearance">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Palette className="w-5 h-5" />
                Apparence et format
              </CardTitle>
              <CardDescription>
                Personnalisez l'apparence de votre interface.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Thème</Label>
                  <Select value={appearance.theme} onValueChange={(value) => setAppearance({...appearance, theme: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="light">Clair</SelectItem>
                      <SelectItem value="dark">Sombre</SelectItem>
                      <SelectItem value="system">Système</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Langue</Label>
                  <Select value={appearance.language} onValueChange={(value) => setAppearance({...appearance, language: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="fr">Français</SelectItem>
                      <SelectItem value="en">English</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label>Format de date</Label>
                  <Select value={appearance.dateFormat} onValueChange={(value) => setAppearance({...appearance, dateFormat: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="DD/MM/YYYY">DD/MM/YYYY</SelectItem>
                      <SelectItem value="MM/DD/YYYY">MM/DD/YYYY</SelectItem>
                      <SelectItem value="YYYY-MM-DD">YYYY-MM-DD</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Devise</Label>
                  <Select value={appearance.currency} onValueChange={(value) => setAppearance({...appearance, currency: value})}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="GNF">GNF - Franc guinéen</SelectItem>
                      <SelectItem value="EUR">EUR - Euro</SelectItem>
                      <SelectItem value="USD">USD - Dollar US</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
