/**
 * @fileoverview Module d'export Excel pour GuinéaManager ERP
 * 
 * Ce module fournit des fonctions pour générer des fichiers Excel
 * à partir des données de l'ERP (clients, factures, employés, etc.)
 * 
 * @module excel-export
 * @author GuinéaManager Team
 * @version 1.0.0
 */

import ExcelJS from 'exceljs';

// ============================================================================
// TYPES
// ============================================================================

interface ExportClient {
  nom: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  ville?: string;
  type: string;
  totalAchats: number;
  createdAt: Date;
}

interface ExportFacture {
  numero: string;
  client: string;
  dateEmission: Date;
  dateEcheance: Date;
  montantHT: number;
  montantTVA: number;
  montantTTC: number;
  statut: string;
}

interface ExportEmploye {
  matricule: string;
  nom: string;
  prenom: string;
  email?: string;
  telephone?: string;
  poste: string;
  departement?: string;
  salaireBase: number;
  typeContrat: string;
  actif: boolean;
}

interface ExportDepense {
  description: string;
  montant: number;
  categorie: string;
  date: Date;
  modePaiement: string;
}

interface ExportBulletinPaie {
  employe: string;
  mois: number;
  annee: number;
  salaireBase: number;
  brutTotal: number;
  cnssEmploye: number;
  ipr: number;
  netAPayer: number;
  statut: string;
}

// ============================================================================
// FORMATAGE
// ============================================================================

/**
 * Formate un montant en GNF
 */
function formatGNF(montant: number): string {
  return new Intl.NumberFormat('fr-GN', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(montant) + ' GNF';
}

/**
 * Formate une date
 */
function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('fr-FR');
}

/**
 * Traduit le statut en français
 */
function traduireStatutFacture(statut: string): string {
  const traductions: Record<string, string> = {
    'BROUILLON': 'Brouillon',
    'ENVOYEE': 'Envoyée',
    'PAYEE': 'Payée',
    'EN_RETARD': 'En retard',
    'ANNULEE': 'Annulée'
  };
  return traductions[statut] || statut;
}

/**
 * Traduit le type de client
 */
function traduireTypeClient(type: string): string {
  return type === 'ENTREPRISE' ? 'Entreprise' : 'Particulier';
}

// ============================================================================
// FONCTIONS D'EXPORT
// ============================================================================

/**
 * Génère un fichier Excel des clients
 * 
 * @param clients - Liste des clients à exporter
 * @returns Buffer du fichier Excel
 */
export async function exportClientsToExcel(clients: ExportClient[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'GuinéaManager';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Clients', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  // En-têtes
  sheet.columns = [
    { header: 'Nom', key: 'nom', width: 25 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Téléphone', key: 'telephone', width: 18 },
    { header: 'Adresse', key: 'adresse', width: 30 },
    { header: 'Ville', key: 'ville', width: 15 },
    { header: 'Type', key: 'type', width: 12 },
    { header: 'Total Achats', key: 'totalAchats', width: 18 },
    { header: 'Date création', key: 'createdAt', width: 15 }
  ];

  // Style des en-têtes
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF059669' }
  };
  sheet.getRow(1).alignment = { horizontal: 'center' };

  // Données
  clients.forEach(client => {
    sheet.addRow({
      nom: client.nom,
      email: client.email || '-',
      telephone: client.telephone || '-',
      adresse: client.adresse || '-',
      ville: client.ville || '-',
      type: traduireTypeClient(client.type),
      totalAchats: formatGNF(client.totalAchats),
      createdAt: formatDate(client.createdAt)
    });
  });

  // Bordures
  sheet.eachRow((row, rowNum) => {
    row.eachCell(cell => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });

  return workbook.xlsx.writeBuffer() as Promise<Buffer>;
}

/**
 * Génère un fichier Excel des factures
 * 
 * @param factures - Liste des factures à exporter
 * @returns Buffer du fichier Excel
 */
export async function exportFacturesToExcel(factures: ExportFacture[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'GuinéaManager';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Factures', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  // En-têtes
  sheet.columns = [
    { header: 'N° Facture', key: 'numero', width: 15 },
    { header: 'Client', key: 'client', width: 25 },
    { header: 'Date émission', key: 'dateEmission', width: 15 },
    { header: 'Date échéance', key: 'dateEcheance', width: 15 },
    { header: 'Montant HT', key: 'montantHT', width: 18 },
    { header: 'TVA (18%)', key: 'montantTVA', width: 15 },
    { header: 'Montant TTC', key: 'montantTTC', width: 18 },
    { header: 'Statut', key: 'statut', width: 12 }
  ];

  // Style des en-têtes
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF059669' }
  };
  sheet.getRow(1).alignment = { horizontal: 'center' };

  // Données
  factures.forEach(facture => {
    sheet.addRow({
      numero: facture.numero,
      client: facture.client,
      dateEmission: formatDate(facture.dateEmission),
      dateEcheance: formatDate(facture.dateEcheance),
      montantHT: formatGNF(facture.montantHT),
      montantTVA: formatGNF(facture.montantTVA),
      montantTTC: formatGNF(facture.montantTTC),
      statut: traduireStatutFacture(facture.statut)
    });
  });

  // Bordures
  sheet.eachRow((row, rowNum) => {
    row.eachCell(cell => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });

  return workbook.xlsx.writeBuffer() as Promise<Buffer>;
}

/**
 * Génère un fichier Excel des employés
 * 
 * @param employes - Liste des employés à exporter
 * @returns Buffer du fichier Excel
 */
export async function exportEmployesToExcel(employes: ExportEmploye[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'GuinéaManager';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Employés', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  // En-têtes
  sheet.columns = [
    { header: 'Matricule', key: 'matricule', width: 12 },
    { header: 'Nom', key: 'nom', width: 20 },
    { header: 'Prénom', key: 'prenom', width: 20 },
    { header: 'Email', key: 'email', width: 30 },
    { header: 'Téléphone', key: 'telephone', width: 18 },
    { header: 'Poste', key: 'poste', width: 20 },
    { header: 'Département', key: 'departement', width: 15 },
    { header: 'Salaire Base', key: 'salaireBase', width: 18 },
    { header: 'Contrat', key: 'typeContrat', width: 12 },
    { header: 'Statut', key: 'actif', width: 10 }
  ];

  // Style des en-têtes
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF059669' }
  };
  sheet.getRow(1).alignment = { horizontal: 'center' };

  // Données
  employes.forEach(emp => {
    sheet.addRow({
      matricule: emp.matricule,
      nom: emp.nom,
      prenom: emp.prenom,
      email: emp.email || '-',
      telephone: emp.telephone || '-',
      poste: emp.poste,
      departement: emp.departement || '-',
      salaireBase: formatGNF(emp.salaireBase),
      typeContrat: emp.typeContrat,
      actif: emp.actif ? 'Actif' : 'Inactif'
    });
  });

  // Bordures
  sheet.eachRow((row, rowNum) => {
    row.eachCell(cell => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });

  return workbook.xlsx.writeBuffer() as Promise<Buffer>;
}

/**
 * Génère un fichier Excel des bulletins de paie
 * 
 * @param bulletins - Liste des bulletins à exporter
 * @returns Buffer du fichier Excel
 */
export async function exportBulletinsPaieToExcel(bulletins: ExportBulletinPaie[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'GuinéaManager';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Bulletins de Paie', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  // En-têtes
  sheet.columns = [
    { header: 'Employé', key: 'employe', width: 25 },
    { header: 'Mois', key: 'mois', width: 10 },
    { header: 'Année', key: 'annee', width: 10 },
    { header: 'Salaire Base', key: 'salaireBase', width: 18 },
    { header: 'Brut Total', key: 'brutTotal', width: 18 },
    { header: 'CNSS Employé', key: 'cnssEmploye', width: 15 },
    { header: 'IPR', key: 'ipr', width: 15 },
    { header: 'Net à payer', key: 'netAPayer', width: 18 },
    { header: 'Statut', key: 'statut', width: 12 }
  ];

  // Style des en-têtes
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF059669' }
  };
  sheet.getRow(1).alignment = { horizontal: 'center' };

  // Noms des mois
  const moisNoms = ['', 'Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 
                    'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];

  // Données
  bulletins.forEach(b => {
    sheet.addRow({
      employe: b.employe,
      mois: moisNoms[b.mois],
      annee: b.annee,
      salaireBase: formatGNF(b.salaireBase),
      brutTotal: formatGNF(b.brutTotal),
      cnssEmploye: formatGNF(b.cnssEmploye),
      ipr: formatGNF(b.ipr),
      netAPayer: formatGNF(b.netAPayer),
      statut: b.statut === 'PAYE' ? 'Payé' : b.statut === 'VALIDE' ? 'Validé' : 'Brouillon'
    });
  });

  // Bordures
  sheet.eachRow((row, rowNum) => {
    row.eachCell(cell => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });

  return workbook.xlsx.writeBuffer() as Promise<Buffer>;
}

/**
 * Génère un fichier Excel des dépenses
 * 
 * @param depenses - Liste des dépenses à exporter
 * @returns Buffer du fichier Excel
 */
export async function exportDepensesToExcel(depenses: ExportDepense[]): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'GuinéaManager';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Dépenses', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  // En-têtes
  sheet.columns = [
    { header: 'Description', key: 'description', width: 35 },
    { header: 'Montant', key: 'montant', width: 18 },
    { header: 'Catégorie', key: 'categorie', width: 15 },
    { header: 'Date', key: 'date', width: 15 },
    { header: 'Mode paiement', key: 'modePaiement', width: 15 }
  ];

  // Style des en-têtes
  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FF059669' }
  };
  sheet.getRow(1).alignment = { horizontal: 'center' };

  // Traduction modes de paiement
  const modesPaiement: Record<string, string> = {
    'ESPECES': 'Espèces',
    'VIREMENT': 'Virement',
    'ORANGE_MONEY': 'Orange Money',
    'MTN_MONEY': 'MTN Money',
    'CHEQUE': 'Chèque',
    'CARTE': 'Carte'
  };

  // Données
  let total = 0;
  depenses.forEach(d => {
    total += d.montant;
    sheet.addRow({
      description: d.description,
      montant: formatGNF(d.montant),
      categorie: d.categorie,
      date: formatDate(d.date),
      modePaiement: modesPaiement[d.modePaiement] || d.modePaiement
    });
  });

  // Ligne de total
  const totalRow = sheet.addRow({
    description: 'TOTAL',
    montant: formatGNF(total),
    categorie: '',
    date: '',
    modePaiement: ''
  });
  totalRow.font = { bold: true };
  totalRow.getCell(1).fill = {
    type: 'pattern',
    pattern: 'solid',
    fgColor: { argb: 'FFF3F4F6' }
  };

  // Bordures
  sheet.eachRow((row, rowNum) => {
    row.eachCell(cell => {
      cell.border = {
        top: { style: 'thin' },
        left: { style: 'thin' },
        bottom: { style: 'thin' },
        right: { style: 'thin' }
      };
    });
  });

  return workbook.xlsx.writeBuffer() as Promise<Buffer>;
}
