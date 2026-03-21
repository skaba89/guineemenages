// Générateur de PDF pour factures - GuinéaManager

import PDFDocument from 'pdfkit';
import { Readable } from 'stream';
import { Facture, Client, Company, LigneFacture, Currency } from '@prisma/client';

interface FactureWithRelations extends Facture {
  client: Client;
  company: Company;
  lignes: (LigneFacture & {
    produit?: { nom: string; reference: string | null } | null;
  })[];
}

// Couleurs du thème
const COLORS = {
  primary: '#1e40af',
  secondary: '#3b82f6',
  text: '#1f2937',
  muted: '#6b7280',
  border: '#e5e7eb',
  background: '#f9fafb',
  success: '#10b981',
  warning: '#f59e0b',
  danger: '#ef4444',
};

// Formater un montant selon la devise
const formatMontant = (centimes: number, currency: Currency = 'GNF'): string => {
  const montant = centimes / 100;
  const formatter = new Intl.NumberFormat('fr-GN', {
    style: 'currency',
    currency: currency,
    maximumFractionDigits: currency === 'GNF' ? 0 : 2,
  });
  return formatter.format(montant);
};

// Formater une date
const formatDate = (date: Date | string): string => {
  return new Date(date).toLocaleDateString('fr-GN', {
    day: '2-digit',
    month: 'long',
    year: 'numeric',
  });
};

// Convertir un buffer en stream
const bufferToStream = (buffer: Buffer): Readable => {
  const stream = new Readable();
  stream.push(buffer);
  stream.push(null);
  return stream;
};

// Générer le PDF de facture
export const generateInvoicePdf = async (facture: FactureWithRelations): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      // Créer le document PDF
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Facture ${facture.numero}`,
          Author: facture.company.name,
          Subject: `Facture ${facture.numero} du ${formatDate(facture.date)}`,
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // En-tête avec logo et infos entreprise
      doc.fillColor(COLORS.primary).fontSize(24).font('Helvetica-Bold').text(facture.company.name, 50, 50);
      
      // Infos entreprise
      doc.fillColor(COLORS.muted).fontSize(9).font('Helvetica');
      let companyY = 80;
      if (facture.company.adresse) {
        doc.text(facture.company.adresse, 50, companyY);
        companyY += 12;
      }
      if (facture.company.rccm) {
        doc.text(`RCCM: ${facture.company.rccm}`, 50, companyY);
        companyY += 12;
      }
      if (facture.company.nif) {
        doc.text(`NIF: ${facture.company.nif}`, 50, companyY);
        companyY += 12;
      }

      // Titre FACTURE
      doc.fillColor(COLORS.primary).fontSize(32).font('Helvetica-Bold').text('FACTURE', 400, 50, { align: 'right' });
      
      // Numéro et date
      doc.fillColor(COLORS.text).fontSize(12).font('Helvetica-Bold').text(facture.numero, 400, 90, { align: 'right' });
      doc.fillColor(COLORS.muted).fontSize(10).font('Helvetica').text(`Date: ${formatDate(facture.date)}`, 400, 105, { align: 'right' });
      
      if (facture.echeance) {
        doc.text(`Échéance: ${formatDate(facture.echeance)}`, 400, 120, { align: 'right' });
      }

      // Statut
      const statutColors: Record<string, string> = {
        BROUILLON: COLORS.muted,
        ENVOYEE: COLORS.warning,
        PAYEE: COLORS.success,
        ANNULEE: COLORS.danger,
        PARTIELLEMENT_PAYEE: COLORS.warning,
      };
      doc.fillColor(statutColors[facture.statut] || COLORS.muted).fontSize(10).font('Helvetica-Bold');
      doc.text(facture.statut.replace('_', ' '), 400, facture.echeance ? 140 : 125, { align: 'right' });

      // Ligne de séparation
      doc.moveTo(50, 180).lineTo(545, 180).strokeColor(COLORS.border).stroke();

      // Informations client
      doc.fillColor(COLORS.primary).fontSize(10).font('Helvetica-Bold').text('FACTURER À:', 50, 200);
      doc.fillColor(COLORS.text).fontSize(12).font('Helvetica-Bold').text(facture.client.nom, 50, 220);
      doc.fillColor(COLORS.muted).fontSize(10).font('Helvetica');
      
      let clientY = 240;
      if (facture.client.telephone) {
        doc.text(`Tél: ${facture.client.telephone}`, 50, clientY);
        clientY += 15;
      }
      if (facture.client.email) {
        doc.text(facture.client.email, 50, clientY);
        clientY += 15;
      }
      if (facture.client.adresse) {
        doc.text(facture.client.adresse, 50, clientY);
      }

      // Tableau des articles
      const tableTop = 320;
      const rowHeight = 25;
      const colWidths = [250, 60, 85, 100]; // Désignation, Qté, Prix unit., Total

      // En-tête du tableau
      doc.fillColor(COLORS.background);
      doc.rect(50, tableTop, 495, rowHeight).fill();
      doc.fillColor(COLORS.text).fontSize(9).font('Helvetica-Bold');
      doc.text('DÉSIGNATION', 55, tableTop + 8);
      doc.text('QTÉ', 305, tableTop + 8, { width: 60, align: 'center' });
      doc.text('PRIX UNIT.', 365, tableTop + 8, { width: 85, align: 'right' });
      doc.text('TOTAL', 450, tableTop + 8, { width: 90, align: 'right' });

      // Lignes du tableau
      let y = tableTop + rowHeight;
      doc.font('Helvetica').fontSize(9).fillColor(COLORS.text);

      for (const ligne of facture.lignes) {
        // Vérifier si on a besoin d'une nouvelle page
        if (y > 700) {
          doc.addPage();
          y = 50;
        }

        // Désignation
        let designation = ligne.designation;
        if (ligne.produit?.reference) {
          designation = `[${ligne.produit.reference}] ${designation}`;
        }
        doc.text(designation, 55, y + 5, { width: 250 });

        // Quantité
        doc.text(ligne.quantite.toString(), 305, y + 5, { width: 60, align: 'center' });

        // Prix unitaire
        doc.text(formatMontant(ligne.prixUnitaire, facture.company.currency), 365, y + 5, { width: 85, align: 'right' });

        // Total ligne
        doc.text(formatMontant(ligne.total, facture.company.currency), 450, y + 5, { width: 90, align: 'right' });

        // Ligne de séparation
        doc.moveTo(50, y + rowHeight).lineTo(545, y + rowHeight).strokeColor(COLORS.border).stroke();

        y += rowHeight;
      }

      // Totaux
      y += 20;

      // Total HT
      doc.fillColor(COLORS.text).fontSize(10).font('Helvetica').text('Total HT', 350, y);
      doc.text(formatMontant(facture.totalHt, facture.company.currency), 450, y, { width: 90, align: 'right' });
      y += 20;

      // TVA
      if (facture.tva > 0) {
        doc.text('TVA', 350, y);
        doc.text(formatMontant(facture.tva, facture.company.currency), 450, y, { width: 90, align: 'right' });
        y += 20;
      }

      // Total TTC
      doc.fillColor(COLORS.primary).fontSize(12).font('Helvetica-Bold');
      doc.text('Total TTC', 350, y);
      doc.text(formatMontant(facture.totalTtc, facture.company.currency), 450, y, { width: 90, align: 'right' });

      // Montant payé si applicable
      if (facture.montantPaye > 0 && facture.montantPaye < facture.totalTtc) {
        y += 25;
        doc.fillColor(COLORS.warning).fontSize(10);
        doc.text('Montant payé', 350, y);
        doc.text(formatMontant(facture.montantPaye, facture.company.currency), 450, y, { width: 90, align: 'right' });
        y += 18;
        doc.fillColor(COLORS.danger).font('Helvetica-Bold');
        doc.text('Reste à payer', 350, y);
        doc.text(formatMontant(facture.totalTtc - facture.montantPaye, facture.company.currency), 450, y, { width: 90, align: 'right' });
      }

      // Pied de page
      const footerY = 750;
      doc.moveTo(50, footerY).lineTo(545, footerY).strokeColor(COLORS.border).stroke();
      
      doc.fillColor(COLORS.muted).fontSize(8).font('Helvetica');
      doc.text(`Merci pour votre confiance. ${facture.conditions || 'Paiement à réception de facture.'}`, 50, footerY + 15);
      doc.text(`Document généré par GuinéaManager - ${new Date().toLocaleDateString('fr-GN')}`, 50, footerY + 30);

      // Finaliser le document
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

// Générer un bulletin de paie PDF
export const generateBulletinPaiePdf = async (
  bulletin: {
    employe: { nom: string; prenom: string; poste?: string | null; cnss?: string | null };
    mois: number;
    annee: number;
    salaireBrut: number;
    cnssEmploye: number;
    cnssPatronal: number;
    ipr: number;
    indemnites: number;
    primes: number;
    autresDeductions: number;
    salaireNet: number;
    statut: string;
  },
  company: { name: string; adresse?: string | null; nif?: string | null }
): Promise<Buffer> => {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Bulletin de paie ${bulletin.mois}/${bulletin.annee}`,
          Author: company.name,
        },
      });

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // En-tête
      doc.fillColor(COLORS.primary).fontSize(20).font('Helvetica-Bold').text(company.name, 50, 50);
      doc.fillColor(COLORS.primary).fontSize(16).text('BULLETIN DE PAIE', 50, 80);
      
      // Période
      const moisNoms = ['Janvier', 'Février', 'Mars', 'Avril', 'Mai', 'Juin', 'Juillet', 'Août', 'Septembre', 'Octobre', 'Novembre', 'Décembre'];
      doc.fillColor(COLORS.muted).fontSize(12).font('Helvetica').text(`Période: ${moisNoms[bulletin.mois - 1]} ${bulletin.annee}`, 50, 110);

      // Infos employé
      doc.fillColor(COLORS.primary).fontSize(10).font('Helvetica-Bold').text('EMPLOYÉ', 50, 150);
      doc.fillColor(COLORS.text).fontSize(10).font('Helvetica-Bold').text(`${bulletin.employe.prenom} ${bulletin.employe.nom}`, 50, 170);
      doc.fillColor(COLORS.muted).font('Helvetica');
      let y = 190;
      if (bulletin.employe.poste) {
        doc.text(`Poste: ${bulletin.employe.poste}`, 50, y);
        y += 15;
      }
      if (bulletin.employe.cnss) {
        doc.text(`CNSS: ${bulletin.employe.cnss}`, 50, y);
      }

      // Tableau des éléments
      const tableTop = 250;
      doc.fillColor(COLORS.background);
      doc.rect(50, tableTop, 495, 25).fill();
      doc.fillColor(COLORS.text).fontSize(9).font('Helvetica-Bold');
      doc.text('DÉSIGNATION', 55, tableTop + 8);
      doc.text('BASE', 300, tableTop + 8, { width: 80, align: 'right' });
      doc.text('TAUX', 380, tableTop + 8, { width: 50, align: 'center' });
      doc.text('MONTANT', 430, tableTop + 8, { width: 100, align: 'right' });

      y = tableTop + 30;

      // Gains
      doc.fillColor(COLORS.primary).fontSize(9).font('Helvetica-Bold').text('GAINS', 55, y);
      y += 20;

      doc.fillColor(COLORS.text).font('Helvetica').text('Salaire de base', 55, y);
      doc.text(formatMontant(bulletin.salaireBrut - bulletin.indemnites - bulletin.primes), 300, y, { width: 80, align: 'right' });
      doc.text(formatMontant(bulletin.salaireBrut - bulletin.indemnites - bulletin.primes), 430, y, { width: 100, align: 'right' });
      y += 18;

      if (bulletin.indemnites > 0) {
        doc.text('Indemnités', 55, y);
        doc.text(formatMontant(bulletin.indemnites), 300, y, { width: 80, align: 'right' });
        doc.text(formatMontant(bulletin.indemnites), 430, y, { width: 100, align: 'right' });
        y += 18;
      }

      if (bulletin.primes > 0) {
        doc.text('Primes', 55, y);
        doc.text(formatMontant(bulletin.primes), 300, y, { width: 80, align: 'right' });
        doc.text(formatMontant(bulletin.primes), 430, y, { width: 100, align: 'right' });
        y += 18;
      }

      doc.fillColor(COLORS.primary).font('Helvetica-Bold').text('Total Brut', 55, y);
      doc.text(formatMontant(bulletin.salaireBrut), 430, y, { width: 100, align: 'right' });
      y += 30;

      // Retenues
      doc.fillColor(COLORS.danger).font('Helvetica-Bold').text('RETENUES SALARIALES', 55, y);
      y += 20;

      doc.fillColor(COLORS.text).font('Helvetica').text('CNSS Travailleur', 55, y);
      doc.text(formatMontant(bulletin.salaireBrut), 300, y, { width: 80, align: 'right' });
      doc.text('5%', 380, y, { width: 50, align: 'center' });
      doc.text(`-${formatMontant(bulletin.cnssEmploye)}`, 430, y, { width: 100, align: 'right' });
      y += 18;

      doc.text('IPR (Impôt sur le revenu)', 55, y);
      doc.text(formatMontant(bulletin.salaireBrut - bulletin.cnssEmploye), 300, y, { width: 80, align: 'right' });
      doc.text('-', 380, y, { width: 50, align: 'center' });
      doc.text(`-${formatMontant(bulletin.ipr)}`, 430, y, { width: 100, align: 'right' });
      y += 18;

      if (bulletin.autresDeductions > 0) {
        doc.text('Autres retenues', 55, y);
        doc.text(`-${formatMontant(bulletin.autresDeductions)}`, 430, y, { width: 100, align: 'right' });
        y += 18;
      }

      // Net à payer
      y += 20;
      doc.fillColor(COLORS.primary).fontSize(12).font('Helvetica-Bold').text('NET À PAYER', 300, y);
      doc.fillColor(COLORS.primary).fontSize(14).text(formatMontant(bulletin.salaireNet), 430, y, { width: 100, align: 'right' });

      // Cotisations patronales
      y += 40;
      doc.fillColor(COLORS.muted).fontSize(9).font('Helvetica-Bold').text('COTISATIONS PATRONALES', 55, y);
      y += 18;
      doc.font('Helvetica').text('CNSS Patronal (18%)', 55, y);
      doc.text(formatMontant(bulletin.cnssPatronal), 430, y, { width: 100, align: 'right' });

      // Pied de page
      doc.fillColor(COLORS.muted).fontSize(8).text(`Document généré par GuinéaManager - ${new Date().toLocaleDateString('fr-GN')}`, 50, 750, { align: 'center' });

      doc.end();
    } catch (error) {
      reject(error);
    }
  });
};

export default {
  generateInvoicePdf,
  generateBulletinPaiePdf,
  formatMontant,
  formatDate,
};
