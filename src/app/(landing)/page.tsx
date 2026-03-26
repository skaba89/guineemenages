'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  Check, X, ArrowRight, Play, Star, Shield, Zap, Globe, Users, 
  CreditCard, BarChart3, FileText, Settings, Smartphone, Mail,
  ChevronDown, Menu, Phone, MapPin, Facebook, Twitter, Linkedin, Instagram
} from 'lucide-react';

export default function LandingPage() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [annualBilling, setAnnualBilling] = useState(true);

  const features = [
    {
      icon: FileText,
      title: 'Facturation Automatisée',
      description: 'Créez et envoyez des factures professionnelles en quelques clics. Relances automatiques pour les impayés.',
    },
    {
      icon: Users,
      title: 'Gestion des Employés',
      description: 'Fiches employés complètes, contrats, congés et historique de carrière.',
    },
    {
      icon: CreditCard,
      title: 'Paie Multi-Pays',
      description: 'Calcul automatique des cotisations sociales et impôts selon la législation de 7 pays africains.',
    },
    {
      icon: BarChart3,
      title: 'Tableaux de Bord',
      description: 'KPIs en temps réel, graphiques interactifs et rapports personnalisables.',
    },
    {
      icon: Shield,
      title: 'Sécurité Avancée',
      description: 'Authentification 2FA, chiffrement des données et sauvegardes automatiques.',
    },
    {
      icon: Globe,
      title: 'Multi-Devises',
      description: 'Gestion en GNF, XOF, EUR, USD avec taux de change automatiques.',
    },
    {
      icon: Smartphone,
      title: 'Application Mobile',
      description: 'PWA installable sur mobile, mode hors-ligne pour travailler partout.',
    },
    {
      icon: Zap,
      title: 'Intégrations',
      description: 'API ouverte, webhooks, import/export Excel et intégrations Mobile Money.',
    },
  ];

  const plans = [
    {
      name: 'PETITE',
      description: 'Idéal pour démarrer votre activité',
      price: { monthly: 0, annual: 0 },
      currency: 'GNF',
      popular: false,
      features: [
        { text: '5 employés', included: true },
        { text: '2 utilisateurs', included: true },
        { text: '50 clients', included: true },
        { text: '30 factures/mois', included: true },
        { text: 'Facturation & Produits', included: true },
        { text: 'Support email', included: true },
        { text: 'Gestion paie', included: false },
        { text: 'Rapports avancés', included: false },
        { text: 'API access', included: false },
      ],
    },
    {
      name: 'MOYENNE',
      description: 'Pour les PME en croissance',
      price: { monthly: 50000, annual: 500000 },
      currency: 'GNF',
      popular: true,
      features: [
        { text: '25 employés', included: true },
        { text: '5 utilisateurs', included: true },
        { text: '200 clients', included: true },
        { text: '200 factures/mois', included: true },
        { text: 'Tous modules PETITE', included: true },
        { text: 'Gestion paie complète', included: true },
        { text: 'Rapports avancés', included: true },
        { text: 'Support chat', included: true },
        { text: 'API access', included: true },
      ],
    },
    {
      name: 'GRANDE',
      description: 'Pour les entreprises établies',
      price: { monthly: 150000, annual: 1500000 },
      currency: 'GNF',
      popular: false,
      features: [
        { text: '100 employés', included: true },
        { text: '15 utilisateurs', included: true },
        { text: '1000 clients', included: true },
        { text: 'Factures illimitées', included: true },
        { text: 'Tous modules MOYENNE', included: true },
        { text: 'Multi-sociétés', included: true },
        { text: 'Multi-devises', included: true },
        { text: 'Support téléphone', included: true },
        { text: 'Personnalisation', included: true },
      ],
    },
    {
      name: 'ENTERPRISE',
      description: 'Solution sur mesure',
      price: { monthly: 500000, annual: 5000000 },
      currency: 'GNF',
      popular: false,
      features: [
        { text: 'Employés illimités', included: true },
        { text: 'Utilisateurs illimités', included: true },
        { text: 'Clients illimités', included: true },
        { text: 'Tout illimité', included: true },
        { text: 'Toutes fonctionnalités', included: true },
        { text: 'Support dédié', included: true },
        { text: 'Formation incluse', included: true },
        { text: 'SLA garanti', included: true },
        { text: 'Hébergement dédié', included: true },
      ],
    },
  ];

  const testimonials = [
    {
      name: 'Amadou Diallo',
      role: 'Directeur, TechnoGuinée SARL',
      location: 'Conakry, Guinée',
      content: 'GuinéaManager a transformé notre gestion. Nous économisons plus de 20 heures par mois sur la paie et la facturation.',
      avatar: 'AD',
    },
    {
      name: 'Fatou Ndiaye',
      role: 'Comptable, Solutions Plus',
      location: 'Dakar, Sénégal',
      content: 'La prise en charge du plan comptable OHADA et des cotisations sénégalaises est un vrai plus. Excellent support client!',
      avatar: 'FN',
    },
    {
      name: 'Ibrahim Ouédraogo',
      role: 'PDG, AgriBurkina',
      location: 'Ouagadougou, Burkina',
      content: 'Enfin un ERP adapté à nos réalités! Les calculs automatiques de la CNSS burkinabè nous font gagner un temps précieux.',
      avatar: 'IO',
    },
  ];

  const countries = [
    { name: 'Guinée', flag: '🇬🇳', currency: 'GNF' },
    { name: 'Sénégal', flag: '🇸🇳', currency: 'XOF' },
    { name: 'Mali', flag: '🇲🇱', currency: 'XOF' },
    { name: 'Côte d\'Ivoire', flag: '🇨🇮', currency: 'XOF' },
    { name: 'Burkina Faso', flag: '🇧🇫', currency: 'XOF' },
    { name: 'Bénin', flag: '🇧🇯', currency: 'XOF' },
    { name: 'Niger', flag: '🇳🇪', currency: 'XOF' },
  ];

  const formatPrice = (price: number) => {
    if (price === 0) return 'Gratuit';
    return new Intl.NumberFormat('fr-GN').format(price) + ' GNF';
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-slate-50 to-white">
      {/* Header */}
      <header className="sticky top-0 z-50 bg-white/80 backdrop-blur-md border-b">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-2">
              <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                G
              </div>
              <span className="text-xl font-bold text-gray-900">GuinéaManager</span>
            </div>
            
            {/* Desktop Navigation */}
            <nav className="hidden md:flex items-center gap-8">
              <a href="#features" className="text-gray-600 hover:text-gray-900 transition">Fonctionnalités</a>
              <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition">Tarifs</a>
              <a href="#countries" className="text-gray-600 hover:text-gray-900 transition">Pays</a>
              <a href="#testimonials" className="text-gray-600 hover:text-gray-900 transition">Témoignages</a>
              <a href="#contact" className="text-gray-600 hover:text-gray-900 transition">Contact</a>
            </nav>

            <div className="hidden md:flex items-center gap-4">
              <Link href="/login">
                <Button variant="ghost">Connexion</Button>
              </Link>
              <Link href="/register">
                <Button className="bg-green-600 hover:bg-green-700">
                  Essai Gratuit
                </Button>
              </Link>
            </div>

            {/* Mobile menu button */}
            <button 
              className="md:hidden p-2"
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            >
              <Menu className="w-6 h-6" />
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        {mobileMenuOpen && (
          <div className="md:hidden bg-white border-b px-4 py-4 space-y-4">
            <a href="#features" className="block text-gray-600">Fonctionnalités</a>
            <a href="#pricing" className="block text-gray-600">Tarifs</a>
            <a href="#countries" className="block text-gray-600">Pays</a>
            <a href="#testimonials" className="block text-gray-600">Témoignages</a>
            <div className="flex gap-4 pt-4 border-t">
              <Link href="/login" className="flex-1">
                <Button variant="outline" className="w-full">Connexion</Button>
              </Link>
              <Link href="/register" className="flex-1">
                <Button className="w-full bg-green-600">Essai Gratuit</Button>
              </Link>
            </div>
          </div>
        )}
      </header>

      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50" />
        <div className="absolute inset-0 bg-[url('/images/pattern.svg')] opacity-5" />
        
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 lg:py-32">
          <div className="text-center max-w-4xl mx-auto">
            <Badge className="mb-6 bg-green-100 text-green-800 hover:bg-green-100">
              🚀 Nouveau: Paiement Mobile Money intégré
            </Badge>
            
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-gray-900 mb-6 leading-tight">
              L'ERP des{' '}
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-green-600 to-emerald-500">
                PME Africaines
              </span>
            </h1>
            
            <p className="text-xl text-gray-600 mb-8 max-w-2xl mx-auto">
              Gérez votre entreprise avec un outil adapté aux réalités africaines. 
              Facturation, paie multi-pays, et bien plus - tout en un seul endroit.
            </p>

            <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
              <Link href="/register">
                <Button size="lg" className="bg-green-600 hover:bg-green-700 text-lg px-8 py-6">
                  Démarrer Gratuitement
                  <ArrowRight className="ml-2 w-5 h-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-8 py-6">
                <Play className="mr-2 w-5 h-5" />
                Voir la Démo
              </Button>
            </div>

            <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>Essai gratuit 30 jours</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>Sans carte bancaire</span>
              </div>
              <div className="flex items-center gap-2">
                <Check className="w-5 h-5 text-green-500" />
                <span>Support inclus</span>
              </div>
            </div>
          </div>

          {/* Hero Image/Screenshot */}
          <div className="mt-16 relative">
            <div className="absolute inset-0 bg-gradient-to-t from-white via-transparent to-transparent z-10" />
            <div className="bg-white rounded-2xl shadow-2xl border overflow-hidden">
              <div className="bg-gray-100 px-4 py-3 flex items-center gap-2">
                <div className="w-3 h-3 rounded-full bg-red-400" />
                <div className="w-3 h-3 rounded-full bg-yellow-400" />
                <div className="w-3 h-3 rounded-full bg-green-400" />
              </div>
              <div className="p-8 bg-gradient-to-br from-slate-50 to-slate-100 min-h-[400px] flex items-center justify-center">
                <div className="text-center text-gray-400">
                  <BarChart3 className="w-24 h-24 mx-auto mb-4 opacity-50" />
                  <p className="text-lg">Dashboard Preview</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trusted By */}
      <section className="py-12 bg-white border-y">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <p className="text-center text-gray-500 mb-8">Ils nous font confiance</p>
          <div className="flex flex-wrap justify-center items-center gap-12 opacity-60">
            {['Entreprise A', 'Entreprise B', 'Entreprise C', 'Entreprise D', 'Entreprise E'].map((name, i) => (
              <div key={i} className="text-xl font-bold text-gray-400">{name}</div>
            ))}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4">Fonctionnalités</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Tout ce dont vous avez besoin
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Des outils puissants adaptés aux réalités des entreprises africaines
            </p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <Card key={index} className="border-0 shadow-lg hover:shadow-xl transition-shadow">
                <CardHeader>
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4">
                    <feature.icon className="w-6 h-6 text-green-600" />
                  </div>
                  <CardTitle className="text-lg">{feature.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <CardDescription className="text-gray-600">
                    {feature.description}
                  </CardDescription>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* How It Works */}
      <section className="py-20 bg-gradient-to-b from-green-50 to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4">Comment ça marche</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Démarrez en 3 étapes
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { step: '1', title: 'Créez votre compte', description: 'Inscription gratuite en 2 minutes. Choisissez votre pays et configurez votre société.' },
              { step: '2', title: 'Importez vos données', description: 'Importez vos clients, produits et employés depuis Excel ou saisissez-les manuellement.' },
              { step: '3', title: 'Gérez votre entreprise', description: 'Facturez, payez vos employés et suivez vos performances en temps réel.' },
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-green-600 rounded-full flex items-center justify-center text-white text-2xl font-bold mx-auto mb-6">
                  {item.step}
                </div>
                <h3 className="text-xl font-semibold mb-2">{item.title}</h3>
                <p className="text-gray-600">{item.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Countries Section */}
      <section id="countries" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4">Multi-Pays</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              7 pays d'Afrique de l'Ouest
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto">
              Calculs fiscaux et sociaux conformes à la législation de chaque pays
            </p>
          </div>

          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-7 gap-4">
            {countries.map((country, index) => (
              <Card key={index} className="text-center py-6 hover:shadow-lg transition-shadow cursor-pointer">
                <div className="text-4xl mb-2">{country.flag}</div>
                <h3 className="font-semibold text-gray-900">{country.name}</h3>
                <p className="text-sm text-gray-500">{country.currency}</p>
              </Card>
            ))}
          </div>

          <div className="mt-12 bg-gradient-to-r from-green-600 to-emerald-500 rounded-2xl p-8 text-white">
            <div className="grid md:grid-cols-3 gap-8 text-center">
              <div>
                <div className="text-4xl font-bold mb-2">CNSS</div>
                <p className="opacity-90">Calculs automatiques selon chaque pays</p>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">IPR/IR</div>
                <p className="opacity-90">Barèmes progressifs à jour</p>
              </div>
              <div>
                <div className="text-4xl font-bold mb-2">OHADA</div>
                <p className="opacity-90">Plan comptable conforme</p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4">Tarifs</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Des prix adaptés à votre croissance
            </h2>
            <p className="text-xl text-gray-600 max-w-2xl mx-auto mb-8">
              Commencez gratuitement, évoluez à votre rythme
            </p>

            <div className="flex items-center justify-center gap-4">
              <span className={`text-sm ${!annualBilling ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                Mensuel
              </span>
              <button
                onClick={() => setAnnualBilling(!annualBilling)}
                className={`relative w-14 h-6 rounded-full transition-colors ${annualBilling ? 'bg-green-600' : 'bg-gray-300'}`}
              >
                <div className={`absolute w-5 h-5 bg-white rounded-full top-0.5 transition-transform ${annualBilling ? 'translate-x-8' : 'translate-x-0.5'}`} />
              </button>
              <span className={`text-sm ${annualBilling ? 'text-gray-900 font-medium' : 'text-gray-500'}`}>
                Annuel <span className="text-green-600">(2 mois offerts)</span>
              </span>
            </div>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {plans.map((plan, index) => (
              <Card 
                key={index} 
                className={`relative ${plan.popular ? 'border-green-500 border-2 shadow-xl' : 'border'}`}
              >
                {plan.popular && (
                  <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                    <Badge className="bg-green-600 text-white">Plus populaire</Badge>
                  </div>
                )}
                <CardHeader className="text-center pb-2">
                  <CardTitle className="text-xl">{plan.name}</CardTitle>
                  <CardDescription>{plan.description}</CardDescription>
                </CardHeader>
                <CardContent className="text-center">
                  <div className="mb-6">
                    <span className="text-4xl font-bold text-gray-900">
                      {formatPrice(annualBilling ? plan.price.annual / 12 : plan.price.monthly)}
                    </span>
                    {plan.price.monthly > 0 && (
                      <span className="text-gray-500">/mois</span>
                    )}
                  </div>
                  <ul className="space-y-3 text-sm">
                    {plan.features.map((feature, fIndex) => (
                      <li key={fIndex} className="flex items-center gap-2">
                        {feature.included ? (
                          <Check className="w-5 h-5 text-green-500 shrink-0" />
                        ) : (
                          <X className="w-5 h-5 text-gray-300 shrink-0" />
                        )}
                        <span className={feature.included ? 'text-gray-700' : 'text-gray-400'}>
                          {feature.text}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
                <CardFooter>
                  <Link href="/register" className="w-full">
                    <Button 
                      className={`w-full ${plan.popular ? 'bg-green-600 hover:bg-green-700' : ''}`}
                      variant={plan.popular ? 'default' : 'outline'}
                    >
                      {plan.price.monthly === 0 ? 'Démarrer gratuitement' : 'Choisir ce plan'}
                    </Button>
                  </Link>
                </CardFooter>
              </Card>
            ))}
          </div>

          <p className="text-center text-gray-500 mt-8">
            Tous les prix sont HT. Paiement disponible via Orange Money, MTN Money et carte bancaire.
          </p>
        </div>
      </section>

      {/* Testimonials */}
      <section id="testimonials" className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4">Témoignages</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Ce que disent nos clients
            </h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="border-0 shadow-lg">
                <CardContent className="pt-8">
                  <div className="flex items-center gap-1 mb-4">
                    {[1, 2, 3, 4, 5].map((star) => (
                      <Star key={star} className="w-5 h-5 fill-yellow-400 text-yellow-400" />
                    ))}
                  </div>
                  <p className="text-gray-600 mb-6 italic">"{testimonial.content}"</p>
                  <div className="flex items-center gap-4">
                    <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center text-green-600 font-bold">
                      {testimonial.avatar}
                    </div>
                    <div>
                      <div className="font-semibold text-gray-900">{testimonial.name}</div>
                      <div className="text-sm text-gray-500">{testimonial.role}</div>
                      <div className="text-xs text-gray-400">{testimonial.location}</div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <Badge className="mb-4">FAQ</Badge>
            <h2 className="text-3xl sm:text-4xl font-bold text-gray-900 mb-4">
              Questions fréquentes
            </h2>
          </div>

          <div className="space-y-4">
            {[
              { q: 'Comment fonctionne l\'essai gratuit?', a: 'L\'essai gratuit de 30 jours vous donne accès à toutes les fonctionnalités du plan MOYENNE. Aucune carte bancaire n\'est requise pour s\'inscrire.' },
              { q: 'Puis-je changer de plan à tout moment?', a: 'Oui, vous pouvez upgrader ou downgrader votre plan à tout moment. Les changements sont appliqués immédiatement et la facturation est ajustée au prorata.' },
              { q: 'Comment fonctionne la paie multi-pays?', a: 'Sélectionnez votre pays lors de l\'inscription. Les calculs de CNSS, IPR/IR et autres cotisations sont automatiquement adaptés à la législation locale.' },
              { q: 'Mes données sont-elles sécurisées?', a: 'Absolument. Vos données sont chiffrées, hébergées sur des serveurs sécurisés et sauvegardées quotidiennement. Nous respectons les standards de sécurité les plus élevés.' },
              { q: 'Proposez-vous une formation?', a: 'Oui, nous proposons des sessions de formation gratuites pour les plans MOYENNE et supérieurs. Une documentation complète et des tutoriels vidéo sont également disponibles.' },
            ].map((faq, index) => (
              <Card key={index}>
                <CardHeader className="cursor-pointer">
                  <div className="flex items-center justify-between">
                    <CardTitle className="text-lg">{faq.q}</CardTitle>
                    <ChevronDown className="w-5 h-5 text-gray-400" />
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-600">{faq.a}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="bg-gradient-to-r from-green-600 to-emerald-500 rounded-3xl p-12 text-center text-white">
            <h2 className="text-3xl sm:text-4xl font-bold mb-4">
              Prêt à transformer votre gestion?
            </h2>
            <p className="text-xl opacity-90 mb-8">
              Rejoignez plus de 500 entreprises qui font confiance à GuinéaManager
            </p>
            <Link href="/register">
              <Button size="lg" className="bg-white text-green-600 hover:bg-gray-100 text-lg px-8 py-6">
                Démarrer Maintenant
                <ArrowRight className="ml-2 w-5 h-5" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <section id="contact" className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-2 gap-12">
            <div>
              <Badge className="mb-4">Contact</Badge>
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Parlons de votre projet
              </h2>
              <p className="text-gray-600 mb-8">
                Notre équipe est disponible pour répondre à vos questions et vous accompagner dans votre transition vers GuinéaManager.
              </p>

              <div className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Mail className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="font-semibold">Email</div>
                    <a href="mailto:contact@guineamanager.com" className="text-green-600 hover:underline">
                      contact@guineamanager.com
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <Phone className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="font-semibold">Téléphone</div>
                    <a href="tel:+224624000000" className="text-green-600 hover:underline">
                      +224 624 00 00 00
                    </a>
                  </div>
                </div>
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                    <MapPin className="w-6 h-6 text-green-600" />
                  </div>
                  <div>
                    <div className="font-semibold">Adresse</div>
                    <div className="text-gray-600">Conakry, Guinée</div>
                  </div>
                </div>
              </div>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Envoyez-nous un message</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <input 
                    type="text" 
                    placeholder="Nom" 
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <input 
                    type="email" 
                    placeholder="Email" 
                    className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                </div>
                <input 
                  type="text" 
                  placeholder="Sujet" 
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <textarea 
                  placeholder="Votre message" 
                  rows={4}
                  className="w-full px-4 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-green-500"
                />
                <Button className="w-full bg-green-600 hover:bg-green-700">
                  Envoyer le message
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-900 text-gray-400 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid md:grid-cols-4 gap-12 mb-12">
            <div>
              <div className="flex items-center gap-2 mb-4">
                <div className="w-10 h-10 bg-gradient-to-br from-green-600 to-emerald-500 rounded-lg flex items-center justify-center text-white font-bold text-xl">
                  G
                </div>
                <span className="text-xl font-bold text-white">GuinéaManager</span>
              </div>
              <p className="text-sm">
                L'ERP SaaS conçu pour les PME d'Afrique de l'Ouest. Gestion simple, prix accessible.
              </p>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Produit</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#features" className="hover:text-white transition">Fonctionnalités</a></li>
                <li><a href="#pricing" className="hover:text-white transition">Tarifs</a></li>
                <li><a href="#" className="hover:text-white transition">API</a></li>
                <li><a href="#" className="hover:text-white transition">Intégrations</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Entreprise</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">À propos</a></li>
                <li><a href="#" className="hover:text-white transition">Blog</a></li>
                <li><a href="#" className="hover:text-white transition">Carrières</a></li>
                <li><a href="#contact" className="hover:text-white transition">Contact</a></li>
              </ul>
            </div>

            <div>
              <h4 className="font-semibold text-white mb-4">Légal</h4>
              <ul className="space-y-2 text-sm">
                <li><a href="#" className="hover:text-white transition">Conditions d'utilisation</a></li>
                <li><a href="#" className="hover:text-white transition">Politique de confidentialité</a></li>
                <li><a href="#" className="hover:text-white transition">Mentions légales</a></li>
                <li><a href="#" className="hover:text-white transition">RGPD</a></li>
              </ul>
            </div>
          </div>

          <div className="border-t border-gray-800 pt-8 flex flex-col md:flex-row justify-between items-center gap-4">
            <p className="text-sm">© 2024 GuinéaManager. Tous droits réservés.</p>
            <div className="flex items-center gap-4">
              <a href="#" className="hover:text-white transition"><Facebook className="w-5 h-5" /></a>
              <a href="#" className="hover:text-white transition"><Twitter className="w-5 h-5" /></a>
              <a href="#" className="hover:text-white transition"><Linkedin className="w-5 h-5" /></a>
              <a href="#" className="hover:text-white transition"><Instagram className="w-5 h-5" /></a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
