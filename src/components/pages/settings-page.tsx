'use client';

import { useState, useEffect } from 'react';
import { 
  Building, User, Lock, Bell, Palette, Database, Save, CheckCircle, 
  CreditCard, Globe, Users, AlertTriangle, RefreshCw, Check, Smartphone,
  Shield, ShieldCheck, ShieldOff, QrCode, Key, SmartphoneNfc, Wallet
} from 'lucide-react';
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
import { Textarea } from '@/components/ui/textarea';
import { useAppStore } from '@/stores/auth-store';
import { formatGNF } from '@/lib/mock-data';
import api from '@/lib/api';

// Liste des pays supportés
const PAYS_LIST = [
  { code: 'GN', nom: 'Guinée', devise: 'GNF', symbole: 'GNF' },
  { code: 'SN', nom: 'Sénégal', devise: 'XOF', symbole: 'FCFA' },
  { code: 'ML', nom: 'Mali', devise: 'XOF', symbole: 'FCFA' },
  { code: 'CI', nom: 'Côte d\'Ivoire', devise: 'XOF', symbole: 'FCFA' },
  { code: 'BF', nom: 'Burkina Faso', devise: 'XOF', symbole: 'FCFA' },
  { code: 'BJ', nom: 'Bénin', devise: 'XOF', symbole: 'FCFA' },
  { code: 'NE', nom: 'Niger', devise: 'XOF', symbole: 'FCFA' },
];

interface PlanData {
  id: string;
  nom: string;
  description: string;
  prixMensuel: number;
  prixAnnuel: number;
  maxEmployes: number | string;
  maxUtilisateurs: number | string;
  maxClients: number | string;
  maxProduits: number | string;
  maxFacturesMois: number | string;
  modules: string;
  support: string;
  sauvegardeAuto: boolean;
  apiAccess: boolean;
  personnalisation: boolean;
  multiSociete: boolean;
  rapportsAvances: boolean;
}

interface SocieteData {
  id: string;
  nom: string;
  email: string;
  telephone: string;
  adresse: string;
  ville: string;
  pays: string;
  codePays: string;
  ninea: string;
  logo: string;
  devise: string;
  symboleDevise: string;
  langue: string;
  plan: PlanData | null;
  notificationEmail: boolean;
  notificationSMS: boolean;
  configTauxCNSSEmploye: number | null;
  configTauxCNSSEmployeur: number | null;
  configPlafondCNSS: number | null;
  configTauxTVA: number | null;
  utilisateurs: any[];
}

export function SettingsPage() {
  const { user, company, logout, setCompany } = useAppStore();
  const [saved, setSaved] = useState(false);
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState('company');
  
  // Company settings
  const [companyData, setCompanyData] = useState({
    nom: '',
    email: '',
    telephone: '',
    adresse: '',
    ville: '',
    pays: 'Guinée',
    codePays: 'GN',
    ninea: '',
    devise: 'GNF',
    symboleDevise: 'GNF'
  });

  // User settings
  const [userData, setUserData] = useState({
    nom: '',
    prenom: '',
    email: '',
    telephone: ''
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

  // Fiscal configuration
  const [fiscalConfig, setFiscalConfig] = useState({
    tauxCNSSEmploye: 5,
    tauxCNSSEmployeur: 18,
    plafondCNSS: 5000000,
    tauxTVA: 18
  });

  // Password change
  const [passwordData, setPasswordData] = useState({
    ancienPassword: '',
    nouveauPassword: '',
    confirmPassword: ''
  });

  // 2FA settings
  const [twoFAStatus, setTwoFAStatus] = useState<{
    enabled: boolean;
    method: 'totp' | 'sms' | null;
    phone?: string;
  }>({ enabled: false, method: null });

  const [twoFAMethod, setTwoFAMethod] = useState<'totp' | 'sms'>('totp');
  const [twoFACode, setTwoFACode] = useState('');
  const [twoFASetup, setTwoFASetup] = useState<{
    qrCodeUrl?: string;
    secret?: string;
    recoveryCodes?: string[];
    otp?: string;
  }>({});
  const [show2FASetup, setShow2FASetup] = useState(false);
  const [disable2FAPassword, setDisable2FAPassword] = useState('');
  const [showDisable2FA, setShowDisable2FA] = useState(false);

  // Mobile Money settings
  const [mobileMoneyConfig, setMobileMoneyConfig] = useState({
    orangeMoney: {
      enabled: false,
      apiKey: '',
      apiSecret: '',
      merchantCode: '',
    },
    mtnMoney: {
      enabled: false,
      subscriberKey: '',
      subscriptionKey: '',
    }
  });

  // Plans
  const [plans, setPlans] = useState<PlanData[]>([]);
  const [currentPlan, setCurrentPlan] = useState<any>(null);
  const [abonnementInfo, setAbonnementInfo] = useState<any>(null);

  // Load data on mount
  useEffect(() => {
    loadSocieteData();
    loadPlans();
    loadAbonnement();
    load2FAStatus();
    loadMobileMoneyConfig();
  }, []);

  const load2FAStatus = async () => {
    try {
      const response = await api.get2FAStatus();
      if (response.success && response.data) {
        setTwoFAStatus(response.data as any);
      }
    } catch (error) {
      console.error('Erreur chargement 2FA:', error);
    }
  };

  const loadMobileMoneyConfig = async () => {
    try {
      const response = await api.getMobileMoneyConfig();
      if (response.success && response.data) {
        setMobileMoneyConfig(response.data as any);
      }
    } catch (error) {
      console.error('Erreur chargement Mobile Money config:', error);
    }
  };

  const handleInitiate2FA = async () => {
    setLoading(true);
    try {
      const response = await api.initiate2FASetup(twoFAMethod);
      if (response.success && response.data) {
        setTwoFASetup(response.data as any);
        setShow2FASetup(true);
      }
    } catch (error) {
      console.error('Erreur init 2FA:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleVerify2FA = async () => {
    setLoading(true);
    try {
      const response = await api.verify2FASetup(twoFACode);
      if (response.success) {
        load2FAStatus();
        setShow2FASetup(false);
        setTwoFACode('');
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Erreur verify 2FA:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDisable2FA = async () => {
    if (!disable2FAPassword) return;
    setLoading(true);
    try {
      const response = await api.disable2FA(disable2FAPassword);
      if (response.success) {
        load2FAStatus();
        setDisable2FAPassword('');
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Erreur disable 2FA:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveMobileMoney = async () => {
    setLoading(true);
    try {
      const response = await api.saveMobileMoneyConfig(mobileMoneyConfig);
      if (response.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Erreur sauvegarde Mobile Money:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSocieteData = async () => {
    setLoading(true);
    try {
      const response = await api.getSociete();
      if (response.success && response.data) {
        const data = response.data as SocieteData;
        setCompanyData({
          nom: data.nom || '',
          email: data.email || '',
          telephone: data.telephone || '',
          adresse: data.adresse || '',
          ville: data.ville || '',
          pays: data.pays || 'Guinée',
          codePays: data.codePays || 'GN',
          ninea: data.ninea || '',
          devise: data.devise || 'GNF',
          symboleDevise: data.symboleDevise || 'GNF'
        });
        setFiscalConfig({
          tauxCNSSEmploye: (data.configTauxCNSSEmploye || 0.05) * 100,
          tauxCNSSEmployeur: (data.configTauxCNSSEmployeur || 0.18) * 100,
          plafondCNSS: (data.configPlafondCNSS || 500000000) / 100,
          tauxTVA: (data.configTauxTVA || 0.18) * 100
        });
        setCurrentPlan(data.plan);
        setNotifications({
          emailFactures: data.notificationEmail,
          emailPaiements: data.notificationEmail,
          emailStock: data.notificationEmail,
          emailPaie: data.notificationEmail,
          pushFactures: false,
          pushPaiements: false
        });
      }
    } catch (error) {
      console.error('Erreur chargement société:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPlans = async () => {
    try {
      const response = await api.getPlans();
      if (response.success && response.data) {
        setPlans(response.data as PlanData[]);
      }
    } catch (error) {
      console.error('Erreur chargement plans:', error);
    }
  };

  const loadAbonnement = async () => {
    try {
      const response = await api.getAbonnementActuel();
      if (response.success && response.data) {
        setAbonnementInfo(response.data);
      }
    } catch (error) {
      console.error('Erreur chargement abonnement:', error);
    }
  };

  const handleSaveCompany = async () => {
    setLoading(true);
    try {
      const response = await api.updateSociete({
        nom: companyData.nom,
        email: companyData.email,
        telephone: companyData.telephone,
        adresse: companyData.adresse,
        ville: companyData.ville,
        pays: companyData.pays,
        codePays: companyData.codePays,
        ninea: companyData.ninea,
        notificationEmail: notifications.emailFactures
      });
      
      if (response.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
        if (response.data) {
          setCompany(response.data as any);
        }
      }
    } catch (error) {
      console.error('Erreur sauvegarde:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSaveFiscal = async () => {
    setLoading(true);
    try {
      const response = await api.updateFiscalConfig({
        configTauxCNSSEmploye: fiscalConfig.tauxCNSSEmploye / 100,
        configTauxCNSSEmployeur: fiscalConfig.tauxCNSSEmployeur / 100,
        configPlafondCNSS: fiscalConfig.plafondCNSS * 100,
        configTauxTVA: fiscalConfig.tauxTVA / 100
      });
      
      if (response.success) {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (error) {
      console.error('Erreur sauvegarde fiscal:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePassword = async () => {
    if (passwordData.nouveauPassword !== passwordData.confirmPassword) {
      alert('Les mots de passe ne correspondent pas');
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.changePassword(
        passwordData.ancienPassword,
        passwordData.nouveauPassword
      );
      
      if (response.success) {
        setPasswordData({ ancienPassword: '', nouveauPassword: '', confirmPassword: '' });
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        alert(response.message || 'Erreur lors du changement de mot de passe');
      }
    } catch (error) {
      console.error('Erreur changement mot de passe:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleChangePlan = async (planId: string, duree: 'mensuel' | 'annuel') => {
    setLoading(true);
    try {
      const response = await api.changerPlan(planId, duree);
      if (response.success) {
        loadAbonnement();
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      } else {
        alert(response.message || 'Erreur lors du changement de plan');
      }
    } catch (error) {
      console.error('Erreur changement plan:', error);
    } finally {
      setLoading(false);
    }
  };

  const handlePaysChange = (codePays: string) => {
    const pays = PAYS_LIST.find(p => p.code === codePays);
    if (pays) {
      setCompanyData({
        ...companyData,
        codePays: pays.code,
        pays: pays.nom,
        devise: pays.devise,
        symboleDevise: pays.symbole
      });
      
      // Update fiscal defaults based on country
      if (codePays === 'GN') {
        setFiscalConfig({ tauxCNSSEmploye: 5, tauxCNSSEmployeur: 18, plafondCNSS: 5000000, tauxTVA: 18 });
      } else if (codePays === 'SN') {
        setFiscalConfig({ tauxCNSSEmploye: 5.6, tauxCNSSEmployeur: 20.9, plafondCNSS: 350000, tauxTVA: 18 });
      } else if (codePays === 'CI') {
        setFiscalConfig({ tauxCNSSEmploye: 6.3, tauxCNSSEmployeur: 11.7, plafondCNSS: 480000, tauxTVA: 18 });
      }
    }
  };

  const formatPrice = (price: number, devise: string = 'GNF') => {
    return new Intl.NumberFormat('fr-FR').format(price / 100) + ' ' + devise;
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Paramètres</h2>
          <p className="text-slate-500">Gérez vos préférences et paramètres de compte</p>
        </div>
        <Button 
          className="bg-emerald-600 hover:bg-emerald-700" 
          onClick={handleSaveCompany}
          disabled={loading}
        >
          {saved ? <CheckCircle className="w-4 h-4 mr-2" /> : <Save className="w-4 h-4 mr-2" />}
          {loading ? 'Enregistrement...' : saved ? 'Enregistré' : 'Enregistrer'}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-6 w-full max-w-3xl">
          <TabsTrigger value="company" className="flex items-center gap-2">
            <Building className="w-4 h-4" />
            <span className="hidden sm:inline">Entreprise</span>
          </TabsTrigger>
          <TabsTrigger value="fiscal" className="flex items-center gap-2">
            <Globe className="w-4 h-4" />
            <span className="hidden sm:inline">Pays & Fiscal</span>
          </TabsTrigger>
          <TabsTrigger value="plan" className="flex items-center gap-2">
            <CreditCard className="w-4 h-4" />
            <span className="hidden sm:inline">Abonnement</span>
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
                    <Label htmlFor="ninea">NINEA / Identifiant fiscal</Label>
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
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
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
                    <Select value={companyData.codePays} onValueChange={handlePaysChange}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {PAYS_LIST.map(pays => (
                          <SelectItem key={pays.code} value={pays.code}>
                            {pays.nom}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="companyDevise">Devise</Label>
                    <Input
                      id="companyDevise"
                      value={companyData.symboleDevise}
                      disabled
                      className="bg-slate-50"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Fiscal Configuration */}
        <TabsContent value="fiscal">
          <div className="grid gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Globe className="w-5 h-5" />
                  Configuration fiscale - {companyData.pays}
                </CardTitle>
                <CardDescription>
                  Paramètres fiscaux et sociaux adaptés à votre pays. 
                  Ces valeurs sont pré-configurées selon la législation locale.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <p className="text-sm text-blue-800">
                    <strong>Note:</strong> Les valeurs par défaut sont basées sur la législation de {companyData.pays}. 
                    Vous pouvez les personnaliser si nécessaire.
                  </p>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Taux CNSS Employé (%)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.1"
                        value={fiscalConfig.tauxCNSSEmploye}
                        onChange={(e) => setFiscalConfig({...fiscalConfig, tauxCNSSEmploye: parseFloat(e.target.value)})}
                      />
                      <span className="text-slate-500">%</span>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label>Taux CNSS Employeur (%)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        step="0.1"
                        value={fiscalConfig.tauxCNSSEmployeur}
                        onChange={(e) => setFiscalConfig({...fiscalConfig, tauxCNSSEmployeur: parseFloat(e.target.value)})}
                      />
                      <span className="text-slate-500">%</span>
                    </div>
                  </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="space-y-2">
                    <Label>Plafond CNSS ({companyData.symboleDevise})</Label>
                    <Input
                      type="number"
                      value={fiscalConfig.plafondCNSS}
                      onChange={(e) => setFiscalConfig({...fiscalConfig, plafondCNSS: parseInt(e.target.value)})}
                    />
                    <p className="text-xs text-slate-500">Montant maximum sur lequel la CNSS est calculée</p>
                  </div>
                  <div className="space-y-2">
                    <Label>Taux TVA par défaut (%)</Label>
                    <div className="flex items-center gap-2">
                      <Input
                        type="number"
                        value={fiscalConfig.tauxTVA}
                        onChange={(e) => setFiscalConfig({...fiscalConfig, tauxTVA: parseInt(e.target.value)})}
                      />
                      <span className="text-slate-500">%</span>
                    </div>
                  </div>
                </div>
                
                <div className="flex justify-end">
                  <Button onClick={handleSaveFiscal} disabled={loading}>
                    <Save className="w-4 h-4 mr-2" />
                    Enregistrer la configuration fiscale
                  </Button>
                </div>
              </CardContent>
            </Card>

            {/* Barème IR par pays */}
            <Card>
              <CardHeader>
                <CardTitle>Barème d'imposition - {companyData.pays}</CardTitle>
                <CardDescription>
                  Tranches d'imposition sur le revenu applicables dans votre pays.
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left py-2 px-4">Tranche de revenu</th>
                        <th className="text-right py-2 px-4">Taux</th>
                      </tr>
                    </thead>
                    <tbody>
                      {companyData.codePays === 'GN' && (
                        <>
                          <tr className="border-b"><td className="py-2 px-4">0 - 3 000 000 GNF</td><td className="text-right py-2 px-4">0%</td></tr>
                          <tr className="border-b"><td className="py-2 px-4">3 000 001 - 5 000 000 GNF</td><td className="text-right py-2 px-4">10%</td></tr>
                          <tr className="border-b"><td className="py-2 px-4">5 000 001 - 10 000 000 GNF</td><td className="text-right py-2 px-4">15%</td></tr>
                          <tr><td className="py-2 px-4">Plus de 10 000 000 GNF</td><td className="text-right py-2 px-4">20%</td></tr>
                        </>
                      )}
                      {companyData.codePays === 'SN' && (
                        <>
                          <tr className="border-b"><td className="py-2 px-4">0 - 63 000 FCFA</td><td className="text-right py-2 px-4">0%</td></tr>
                          <tr className="border-b"><td className="py-2 px-4">63 001 - 150 000 FCFA</td><td className="text-right py-2 px-4">20%</td></tr>
                          <tr className="border-b"><td className="py-2 px-4">150 001 - 350 000 FCFA</td><td className="text-right py-2 px-4">30%</td></tr>
                          <tr className="border-b"><td className="py-2 px-4">350 001 - 800 000 FCFA</td><td className="text-right py-2 px-4">35%</td></tr>
                          <tr><td className="py-2 px-4">Plus de 800 000 FCFA</td><td className="text-right py-2 px-4">40%</td></tr>
                        </>
                      )}
                      {companyData.codePays === 'CI' && (
                        <>
                          <tr className="border-b"><td className="py-2 px-4">0 - 75 000 FCFA</td><td className="text-right py-2 px-4">0%</td></tr>
                          <tr className="border-b"><td className="py-2 px-4">75 001 - 165 000 FCFA</td><td className="text-right py-2 px-4">10%</td></tr>
                          <tr className="border-b"><td className="py-2 px-4">165 001 - 285 000 FCFA</td><td className="text-right py-2 px-4">15%</td></tr>
                          <tr className="border-b"><td className="py-2 px-4">285 001 - 405 000 FCFA</td><td className="text-right py-2 px-4">20%</td></tr>
                          <tr className="border-b"><td className="py-2 px-4">405 001 - 555 000 FCFA</td><td className="text-right py-2 px-4">25%</td></tr>
                          <tr className="border-b"><td className="py-2 px-4">555 001 - 755 000 FCFA</td><td className="text-right py-2 px-4">30%</td></tr>
                          <tr className="border-b"><td className="py-2 px-4">755 001 - 1 105 000 FCFA</td><td className="text-right py-2 px-4">35%</td></tr>
                          <tr><td className="py-2 px-4">Plus de 1 105 000 FCFA</td><td className="text-right py-2 px-4">40%</td></tr>
                        </>
                      )}
                      {!['GN', 'SN', 'CI'].includes(companyData.codePays) && (
                        <tr><td className="py-2 px-4" colSpan={2}>Barème spécifique au pays sélectionné</td></tr>
                      )}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>

        {/* Plan & Subscription */}
        <TabsContent value="plan">
          <div className="grid gap-6">
            {/* Current Plan */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <CreditCard className="w-5 h-5" />
                  Abonnement actuel
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="p-3 bg-emerald-100 rounded-lg">
                      <Database className="w-6 h-6 text-emerald-600" />
                    </div>
                    <div>
                      <p className="font-semibold text-lg">Plan {currentPlan?.nom || abonnementInfo?.plan?.nom || 'GRATUIT'}</p>
                      <p className="text-sm text-slate-500">
                        {abonnementInfo?.dateFin 
                          ? `Expire le ${new Date(abonnementInfo.dateFin).toLocaleDateString('fr-FR')}`
                          : 'Accès gratuit'}
                      </p>
                    </div>
                  </div>
                  <Badge className="bg-emerald-600">Actif</Badge>
                </div>
                
                {abonnementInfo?.utilisation && (
                  <>
                    <Separator className="my-4" />
                    <div className="grid grid-cols-2 md:grid-cols-5 gap-4 text-sm">
                      <div>
                        <p className="text-slate-500">Employés</p>
                        <p className="font-medium">
                          {abonnementInfo.utilisation.employes.actuel}
                          {abonnementInfo.utilisation.employes.max && ` / ${abonnementInfo.utilisation.employes.max}`}
                        </p>
                        {abonnementInfo.utilisation.employes.pourcentage && (
                          <div className="w-full bg-slate-200 rounded-full h-1.5 mt-1">
                            <div 
                              className="bg-emerald-500 h-1.5 rounded-full" 
                              style={{ width: `${Math.min(abonnementInfo.utilisation.employes.pourcentage, 100)}%` }}
                            />
                          </div>
                        )}
                      </div>
                      <div>
                        <p className="text-slate-500">Utilisateurs</p>
                        <p className="font-medium">
                          {abonnementInfo.utilisation.utilisateurs.actuel}
                          {abonnementInfo.utilisation.utilisateurs.max && ` / ${abonnementInfo.utilisation.utilisateurs.max}`}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Clients</p>
                        <p className="font-medium">
                          {abonnementInfo.utilisation.clients.actuel}
                          {abonnementInfo.utilisation.clients.max && ` / ${abonnementInfo.utilisation.clients.max}`}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Produits</p>
                        <p className="font-medium">
                          {abonnementInfo.utilisation.produits.actuel}
                          {abonnementInfo.utilisation.produits.max && ` / ${abonnementInfo.utilisation.produits.max}`}
                        </p>
                      </div>
                      <div>
                        <p className="text-slate-500">Factures ce mois</p>
                        <p className="font-medium">
                          {abonnementInfo.utilisation.facturesMois.actuel}
                          {abonnementInfo.utilisation.facturesMois.max && ` / ${abonnementInfo.utilisation.facturesMois.max}`}
                        </p>
                      </div>
                    </div>
                  </>
                )}
              </CardContent>
            </Card>

            {/* Available Plans */}
            <Card>
              <CardHeader>
                <CardTitle>Plans disponibles</CardTitle>
                <CardDescription>Choisissez le plan adapté à la taille de votre entreprise.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {plans.map((plan) => (
                    <div 
                      key={plan.id}
                      className={`border rounded-lg p-4 ${currentPlan?.id === plan.id ? 'border-emerald-500 bg-emerald-50' : ''}`}
                    >
                      <div className="flex justify-between items-start mb-2">
                        <h4 className="font-semibold">{plan.nom}</h4>
                        {currentPlan?.id === plan.id && (
                          <Badge className="bg-emerald-600 text-xs">Actuel</Badge>
                        )}
                      </div>
                      <p className="text-xs text-slate-500 mb-3 line-clamp-2">{plan.description}</p>
                      <div className="mb-3">
                        <p className="text-2xl font-bold">{formatPrice(plan.prixMensuel, companyData.symboleDevise)}</p>
                        <p className="text-xs text-slate-500">/mois</p>
                      </div>
                      <div className="space-y-1 text-xs mb-4">
                        <p>• Employés: {plan.maxEmployes === 'Illimité' || plan.maxEmployes === -1 ? 'Illimité' : plan.maxEmployes}</p>
                        <p>• Utilisateurs: {plan.maxUtilisateurs === 'Illimité' || plan.maxUtilisateurs === -1 ? 'Illimité' : plan.maxUtilisateurs}</p>
                        <p>• {plan.rapportsAvances ? '✓' : '✗'} Rapports avancés</p>
                        <p>• {plan.apiAccess ? '✓' : '✗'} API Access</p>
                      </div>
                      {currentPlan?.id !== plan.id && (
                        <Button 
                          size="sm" 
                          className="w-full"
                          variant={plan.prixMensuel === 0 ? 'outline' : 'default'}
                          onClick={() => handleChangePlan(plan.id, 'mensuel')}
                          disabled={loading}
                        >
                          {plan.prixMensuel === 0 ? 'Choisir' : 'Upgrader'}
                        </Button>
                      )}
                    </div>
                  ))}
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
                  {userData.prenom[0] || user?.prenom?.[0]}{userData.nom[0] || user?.nom?.[0]}
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
                    value={userData.prenom || user?.prenom || ''}
                    onChange={(e) => setUserData({...userData, prenom: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="lastName">Nom</Label>
                  <Input
                    id="lastName"
                    value={userData.nom || user?.nom || ''}
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
                    value={userData.email || user?.email || ''}
                    disabled
                    className="bg-slate-50"
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
                  <Input 
                    id="currentPassword" 
                    type="password"
                    value={passwordData.ancienPassword}
                    onChange={(e) => setPasswordData({...passwordData, ancienPassword: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="newPassword">Nouveau mot de passe</Label>
                  <Input 
                    id="newPassword" 
                    type="password"
                    value={passwordData.nouveauPassword}
                    onChange={(e) => setPasswordData({...passwordData, nouveauPassword: e.target.value})}
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="confirmPassword">Confirmer le mot de passe</Label>
                  <Input 
                    id="confirmPassword" 
                    type="password"
                    value={passwordData.confirmPassword}
                    onChange={(e) => setPasswordData({...passwordData, confirmPassword: e.target.value})}
                  />
                </div>
                <Button onClick={handleChangePassword} disabled={loading || !passwordData.ancienPassword || !passwordData.nouveauPassword}>
                  Modifier le mot de passe
                </Button>
              </CardContent>
            </Card>

            <Card className="border-red-200">
              <CardHeader>
                <CardTitle className="text-red-600 flex items-center gap-2">
                  <AlertTriangle className="w-5 h-5" />
                  Zone de danger
                </CardTitle>
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
              </CardContent>
            </Card>

            {/* 2FA Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  {twoFAStatus.enabled ? (
                    <ShieldCheck className="w-5 h-5 text-emerald-600" />
                  ) : (
                    <Shield className="w-5 h-5" />
                  )}
                  Authentification à deux facteurs (2FA)
                </CardTitle>
                <CardDescription>
                  Ajoutez une couche de sécurité supplémentaire à votre compte.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                {twoFAStatus.enabled ? (
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 bg-emerald-50 rounded-lg border border-emerald-200">
                      <div className="flex items-center gap-3">
                        <ShieldCheck className="w-8 h-8 text-emerald-600" />
                        <div>
                          <p className="font-medium text-emerald-800">2FA activée</p>
                          <p className="text-sm text-emerald-600">
                            Méthode: {twoFAStatus.method === 'totp' ? 'Application authenticator' : 'SMS'}
                          </p>
                        </div>
                      </div>
                      <Button 
                        variant="outline" 
                        onClick={() => setShowDisable2FA(true)}
                        className="text-red-600 hover:text-red-700"
                      >
                        Désactiver
                      </Button>
                    </div>

                    {showDisable2FA && (
                      <div className="p-4 border rounded-lg space-y-4">
                        <p className="text-sm text-slate-600">
                          Entrez votre mot de passe pour désactiver la 2FA.
                        </p>
                        <div className="space-y-2">
                          <Label>Mot de passe</Label>
                          <Input 
                            type="password"
                            value={disable2FAPassword}
                            onChange={(e) => setDisable2FAPassword(e.target.value)}
                            placeholder="Votre mot de passe"
                          />
                        </div>
                        <div className="flex gap-2">
                          <Button 
                            variant="destructive"
                            onClick={handleDisable2FA}
                            disabled={loading || !disable2FAPassword}
                          >
                            Désactiver la 2FA
                          </Button>
                          <Button variant="outline" onClick={() => setShowDisable2FA(false)}>
                            Annuler
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-4">
                    {!show2FASetup ? (
                      <>
                        <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                          <p className="text-sm text-amber-800">
                            <strong>Recommandé:</strong> Activez l'authentification à deux facteurs pour sécuriser votre compte.
                          </p>
                        </div>
                        
                        <div className="space-y-3">
                          <p className="text-sm font-medium">Choisissez une méthode:</p>
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                            <button
                              onClick={() => setTwoFAMethod('totp')}
                              className={`p-4 border rounded-lg text-left transition ${
                                twoFAMethod === 'totp' 
                                  ? 'border-emerald-500 bg-emerald-50' 
                                  : 'hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <Smartphone className="w-6 h-6 text-emerald-600" />
                                <div>
                                  <p className="font-medium">Application Authenticator</p>
                                  <p className="text-xs text-slate-500">Google Authenticator, Authy...</p>
                                </div>
                              </div>
                            </button>
                            <button
                              onClick={() => setTwoFAMethod('sms')}
                              className={`p-4 border rounded-lg text-left transition ${
                                twoFAMethod === 'sms' 
                                  ? 'border-emerald-500 bg-emerald-50' 
                                  : 'hover:border-slate-300'
                              }`}
                            >
                              <div className="flex items-center gap-3">
                                <Key className="w-6 h-6 text-blue-600" />
                                <div>
                                  <p className="font-medium">SMS</p>
                                  <p className="text-xs text-slate-500">Code par SMS</p>
                                </div>
                              </div>
                            </button>
                          </div>
                        </div>
                        
                        <Button onClick={handleInitiate2FA} disabled={loading}>
                          Configurer la 2FA
                        </Button>
                      </>
                    ) : (
                      <div className="space-y-4">
                        {twoFAMethod === 'totp' && twoFASetup.qrCodeUrl && (
                          <div className="space-y-4">
                            <div className="p-4 bg-slate-50 rounded-lg text-center">
                              <p className="text-sm text-slate-600 mb-4">
                                Scannez ce QR code avec votre application authenticator:
                              </p>
                              <div className="bg-white p-4 rounded-lg inline-block">
                                <p className="text-xs text-slate-500 font-mono break-all mb-2">
                                  {twoFASetup.secret}
                                </p>
                                <p className="text-xs text-slate-400">
                                  (Copiez ce code manuellement si le scan ne fonctionne pas)
                                </p>
                              </div>
                            </div>
                            {twoFASetup.recoveryCodes && (
                              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200">
                                <p className="text-sm font-medium text-amber-800 mb-2">
                                  Codes de récupération (gardez-les en lieu sûr):
                                </p>
                                <div className="grid grid-cols-2 gap-2 font-mono text-sm">
                                  {twoFASetup.recoveryCodes.map((code, i) => (
                                    <p key={i} className="text-amber-700">{code}</p>
                                  ))}
                                </div>
                              </div>
                            )}
                          </div>
                        )}
                        
                        {twoFAMethod === 'sms' && twoFASetup.otp && (
                          <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                            <p className="text-sm text-blue-800">
                              Code envoyé par SMS (mode développement): <strong>{twoFASetup.otp}</strong>
                            </p>
                          </div>
                        )}

                        <div className="space-y-2">
                          <Label>Code de vérification</Label>
                          <Input
                            value={twoFACode}
                            onChange={(e) => setTwoFACode(e.target.value.replace(/\D/g, '').slice(0, 6))}
                            placeholder="Entrez le code à 6 chiffres"
                            className="text-center text-2xl tracking-widest"
                          />
                        </div>
                        
                        <div className="flex gap-2">
                          <Button onClick={handleVerify2FA} disabled={loading || twoFACode.length !== 6}>
                            Vérifier et activer
                          </Button>
                          <Button variant="outline" onClick={() => setShow2FASetup(false)}>
                            Annuler
                          </Button>
                        </div>
                      </div>
                    )}
                  </div>
                )}
              </CardContent>
            </Card>

            {/* Mobile Money Configuration */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Wallet className="w-5 h-5" />
                  Paiement Mobile Money
                </CardTitle>
                <CardDescription>
                  Configurez vos comptes Orange Money et MTN Money pour recevoir des paiements.
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                {/* Orange Money */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-orange-500 rounded-lg flex items-center justify-center text-white font-bold">
                        OM
                      </div>
                      <div>
                        <p className="font-medium">Orange Money</p>
                        <p className="text-sm text-slate-500">Paiements en Guinée et Afrique de l'Ouest</p>
                      </div>
                    </div>
                    <Switch 
                      checked={mobileMoneyConfig.orangeMoney.enabled}
                      onCheckedChange={(checked) => 
                        setMobileMoneyConfig({
                          ...mobileMoneyConfig,
                          orangeMoney: { ...mobileMoneyConfig.orangeMoney, enabled: checked }
                        })
                      }
                    />
                  </div>
                  
                  {mobileMoneyConfig.orangeMoney.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pl-12">
                      <div className="space-y-2">
                        <Label>API Key</Label>
                        <Input
                          value={mobileMoneyConfig.orangeMoney.apiKey}
                          onChange={(e) => 
                            setMobileMoneyConfig({
                              ...mobileMoneyConfig,
                              orangeMoney: { ...mobileMoneyConfig.orangeMoney, apiKey: e.target.value }
                            })
                          }
                          placeholder="Votre clé API"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>API Secret</Label>
                        <Input
                          type="password"
                          value={mobileMoneyConfig.orangeMoney.apiSecret}
                          onChange={(e) => 
                            setMobileMoneyConfig({
                              ...mobileMoneyConfig,
                              orangeMoney: { ...mobileMoneyConfig.orangeMoney, apiSecret: e.target.value }
                            })
                          }
                          placeholder="Votre secret API"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Code Marchand</Label>
                        <Input
                          value={mobileMoneyConfig.orangeMoney.merchantCode}
                          onChange={(e) => 
                            setMobileMoneyConfig({
                              ...mobileMoneyConfig,
                              orangeMoney: { ...mobileMoneyConfig.orangeMoney, merchantCode: e.target.value }
                            })
                          }
                          placeholder="Code marchand Orange"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <Separator />

                {/* MTN Money */}
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-yellow-400 rounded-lg flex items-center justify-center text-black font-bold">
                        MTN
                      </div>
                      <div>
                        <p className="font-medium">MTN Money</p>
                        <p className="text-sm text-slate-500">Paiements MTN Mobile Money</p>
                      </div>
                    </div>
                    <Switch 
                      checked={mobileMoneyConfig.mtnMoney.enabled}
                      onCheckedChange={(checked) => 
                        setMobileMoneyConfig({
                          ...mobileMoneyConfig,
                          mtnMoney: { ...mobileMoneyConfig.mtnMoney, enabled: checked }
                        })
                      }
                    />
                  </div>
                  
                  {mobileMoneyConfig.mtnMoney.enabled && (
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pl-12">
                      <div className="space-y-2">
                        <Label>Subscriber Key</Label>
                        <Input
                          value={mobileMoneyConfig.mtnMoney.subscriberKey}
                          onChange={(e) => 
                            setMobileMoneyConfig({
                              ...mobileMoneyConfig,
                              mtnMoney: { ...mobileMoneyConfig.mtnMoney, subscriberKey: e.target.value }
                            })
                          }
                          placeholder="Clé d'abonnement"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Subscription Key</Label>
                        <Input
                          type="password"
                          value={mobileMoneyConfig.mtnMoney.subscriptionKey}
                          onChange={(e) => 
                            setMobileMoneyConfig({
                              ...mobileMoneyConfig,
                              mtnMoney: { ...mobileMoneyConfig.mtnMoney, subscriptionKey: e.target.value }
                            })
                          }
                          placeholder="Clé de souscription"
                        />
                      </div>
                    </div>
                  )}
                </div>

                <Button onClick={handleSaveMobileMoney} disabled={loading} className="w-full">
                  <Save className="w-4 h-4 mr-2" />
                  Enregistrer la configuration Mobile Money
                </Button>
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
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
