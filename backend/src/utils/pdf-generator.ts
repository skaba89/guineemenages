/**
 * @fileoverview Générateur de PDF pour les factures GuinéaManager
 * 
 * Ce module génère des factures au format PDF professionnelles, conformes
 * aux standards guinéens et adaptées aux PME locales.
 * 
 * @module pdf-generator
 * @author GuinéaManager Team
 * @version 1.0.0
 * 
 * @description
 * Utilise la bibliothèque PDFKit pour générer des documents PDF de haute qualité.
 * Les factures incluent :
 * - En-tête avec logo et informations de l'entreprise
 * - Détails du client
 * - Tableau des lignes de facture
 * - Récapitulatif des montants (HT, TVA, TTC)
 * - Pied de page professionnel
 * 
 * @requires pdfkit
 * 
 * @example
 * import { generateInvoicePDF } from './pdf-generator';
 * 
 * const pdfBuffer = await generateInvoicePDF(factureData);
 * res.setHeader('Content-Type', 'application/pdf');
 * res.send(pdfBuffer);
 */

import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';

// ============================================================================
// INTERFACES TYPESCRIPT
// ============================================================================

/**
 * @typedef {Object} LigneFacture
 * @property {string} description - Description du produit ou service
 * @property {number} quantite - Quantité facturée
 * @property {number} prixUnitaire - Prix unitaire en centimes
 * @property {number} tauxTVA - Taux de TVA en pourcentage (ex: 18)
 * @property {number} montantHT - Montant hors taxes en centimes
 * @property {number} montantTVA - Montant de la TVA en centimes
 * @property {number} montantTTC - Montant toutes taxes comprises en centimes
 */
interface LigneFacture {
  description: string;
  quantite: number;
  prixUnitaire: number;
  tauxTVA: number;
  montantHT: number;
  montantTVA: number;
  montantTTC: number;
}

/**
 * @typedef {Object} ClientInfo
 * @property {string} nom - Nom du client (personne ou entreprise)
 * @property {string} [email] - Adresse email du client
 * @property {string} [telephone] - Numéro de téléphone
 * @property {string} [adresse] - Adresse postale
 * @property {string} [ville] - Ville
 * @property {string} [pays] - Pays (défaut: Guinée)
 */
interface ClientInfo {
  nom: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  ville?: string;
  pays?: string;
}

/**
 * @typedef {Object} CompanyInfo
 * @property {string} nom - Nom de l'entreprise émettrice
 * @property {string} [email] - Email de contact
 * @property {string} [telephone] - Numéro de téléphone
 * @property {string} [adresse] - Adresse postale
 * @property {string} [ville] - Ville
 * @property {string} [pays] - Pays
 * @property {string} [ninea] - Numéro d'identification nationale (NINEA)
 */
interface CompanyInfo {
  nom: string;
  email?: string;
  telephone?: string;
  adresse?: string;
  ville?: string;
  pays?: string;
  ninea?: string;
}

/**
 * @typedef {Object} FactureData
 * @property {string} numero - Numéro unique de la facture (ex: FAC-2024-0001)
 * @property {Date} dateEmission - Date d'émission de la facture
 * @property {Date} dateEcheance - Date d'échéance du paiement
 * @property {string} statut - Statut de la facture (BROUILLON, ENVOYEE, PAYEE, etc.)
 * @property {string} [modePaiement] - Mode de paiement convenu
 * @property {string} [notes] - Notes additionnelles
 * @property {number} montantHT - Total hors taxes en centimes
 * @property {number} montantTVA - Total TVA en centimes
 * @property {number} montantTTC - Total TTC en centimes
 * @property {ClientInfo} client - Informations du client
 * @property {CompanyInfo} company - Informations de l'entreprise
 * @property {LigneFacture[]} lignes - Lignes de facture
 */
interface FactureData {
  numero: string;
  dateEmission: Date;
  dateEcheance: Date;
  statut: string;
  modePaiement?: string;
  notes?: string;
  montantHT: number;
  montantTVA: number;
  montantTTC: number;
  client: ClientInfo;
  company: CompanyInfo;
  lignes: LigneFacture[];
}

// ============================================================================
// FONCTIONS UTILITAIRES
// ============================================================================

/**
 * Formate un montant en centimes en chaîne GNF lisible.
 * 
 * Utilise le formatage locale français-guinée avec séparateur de milliers.
 * 
 * @function formatGNF
 * @private
 * @param {number} montant - Montant en centimes à formater
 * @returns {string} Montant formaté (ex: "1 500 000 GNF")
 * 
 * @example
 * formatGNF(1_500_000_00); // "1 500 000 GNF"
 */
function formatGNF(montant: number): string {
  return new Intl.NumberFormat('fr-GN', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(montant) + ' GNF';
}

/**
 * Formate une date en format français (JJ/MM/AAAA).
 * 
 * @function formatDate
 * @private
 * @param {Date} date - Date à formater
 * @returns {string} Date formatée (ex: "15/01/2024")
 * 
 * @example
 * formatDate(new Date('2024-01-15')); // "15/01/2024"
 */
function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

// ============================================================================
// FONCTION PRINCIPALE
// ============================================================================

/**
 * Génère un fichier PDF professionnel pour une facture.
 * 
 * Cette fonction crée un document PDF A4 complet avec :
 * - Un en-tête professionnel avec les informations de l'entreprise
 * - Un bloc client avec toutes les coordonnées
 * - Un tableau des lignes de facture avec calculs détaillés
 * - Un récapitulatif des montants (HT, TVA, TTC)
 * - Un badge de statut coloré
 * - Les informations de paiement
 * - Un pied de page avec mention légale
 * 
 * @function generateInvoicePDF
 * @async
 * @param {FactureData} facture - Données complètes de la facture
 * @returns {Promise<Buffer>} Buffer contenant le PDF généré
 * @throws {Error} En cas d'erreur lors de la génération du PDF
 * 
 * @example
 * // Génération basique
 * const pdfBuffer = await generateInvoicePDF({
 *   numero: 'FAC-2024-0001',
 *   dateEmission: new Date(),
 *   dateEcheance: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
 *   statut: 'ENVOYEE',
 *   montantHT: 1_271_186_00,
 *   montantTVA: 228_814_00,
 *   montantTTC: 1_500_000_00,
 *   client: { nom: 'Entreprise ABC' },
 *   company: { nom: 'Ma Société SARL' },
 *   lignes: [
 *     {
 *       description: 'Service de consultation',
 *       quantite: 2,
 *       prixUnitaire: 500_000_00,
 *       tauxTVA: 18,
 *       montantHT: 1_000_000_00,
 *       montantTVA: 180_000_00,
 *       montantTTC: 1_180_000_00
 *     }
 *   ]
 * });
 * 
 * // Envoi en réponse HTTP
 * res.setHeader('Content-Type', 'application/pdf');
 * res.setHeader('Content-Disposition', 'attachment; filename="facture-FAC-2024-0001.pdf"');
 * res.send(pdfBuffer);
 * 
 * @example
 * // Sauvegarde dans un fichier
 * import fs from 'fs/promises';
 * 
 * const pdfBuffer = await generateInvoicePDF(factureData);
 * await fs.writeFile(`facture-${facture.numero}.pdf`, pdfBuffer);
 */
export async function generateInvoicePDF(facture: FactureData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // Création du document PDF au format A4
      const doc = new PDFDocument({
        size: 'A4',
        margin: 50,
        info: {
          Title: `Facture ${facture.numero}`,
          Author: 'GuinéaManager',
          Subject: `Facture ${facture.numero} - ${facture.client.nom}`,
          Creator: 'GuinéaManager ERP'
        }
      });

      // Collecte des chunks pour former le buffer final
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // ====================================================================
      // COULEURS DU THÈME
      // ====================================================================
      const primaryColor = '#059669'; // emerald-600 (vert Guinée)
      const textColor = '#1f2937';    // gray-800
      const lightGray = '#6b7280';    // gray-500

      // ====================================================================
      // EN-TÊTE - INFORMATIONS ENTREPRISE
      // ====================================================================
      doc.fillColor(primaryColor)
         .fontSize(20)
         .font('Helvetica-Bold')
         .text(facture.company.nom, 50, 50);

      doc.fillColor(lightGray)
         .fontSize(9)
         .font('Helvetica');
      
      let y = 75;
      if (facture.company.adresse) {
        doc.text(facture.company.adresse, 50, y);
        y += 12;
      }
      if (facture.company.ville && facture.company.pays) {
        doc.text(`${facture.company.ville}, ${facture.company.pays}`, 50, y);
        y += 12;
      }
      if (facture.company.telephone) {
        doc.text(`Tél: ${facture.company.telephone}`, 50, y);
        y += 12;
      }
      if (facture.company.email) {
        doc.text(`Email: ${facture.company.email}`, 50, y);
        y += 12;
      }
      if (facture.company.ninea) {
        doc.text(`NINEA: ${facture.company.ninea}`, 50, y);
      }

      // ====================================================================
      // TITRE FACTURE (côté droit)
      // ====================================================================
      doc.fillColor(primaryColor)
         .fontSize(28)
         .font('Helvetica-Bold')
         .text('FACTURE', 350, 50, { align: 'right' });

      doc.fillColor(textColor)
         .fontSize(11)
         .font('Helvetica-Bold')
         .text(facture.numero, 350, 85, { align: 'right' });

      // Dates d'émission et d'échéance
      doc.fontSize(9)
         .font('Helvetica')
         .fillColor(lightGray);

      doc.text(`Date d'émission: ${formatDate(facture.dateEmission)}`, 350, 105, { align: 'right' });
      doc.text(`Date d'échéance: ${formatDate(facture.dateEcheance)}`, 350, 118, { align: 'right' });

      // ====================================================================
      // BADGE DE STATUT
      // ====================================================================
      const statusColors: Record<string, string> = {
        'BROUILLON': '#6b7280',
        'ENVOYEE': '#3b82f6',
        'PAYEE': '#059669',
        'EN_RETARD': '#ef4444',
        'ANNULEE': '#9ca3af'
      };
      const statusLabels: Record<string, string> = {
        'BROUILLON': 'Brouillon',
        'ENVOYEE': 'Envoyée',
        'PAYEE': 'Payée',
        'EN_RETARD': 'En retard',
        'ANNULEE': 'Annulée'
      };

      const statusColor = statusColors[facture.statut] || '#6b7280';
      const statusLabel = statusLabels[facture.statut] || facture.statut;
      doc.rect(440, 135, 100, 20)
         .fill(statusColor);
      doc.fillColor('#ffffff')
         .fontSize(9)
         .font('Helvetica-Bold')
         .text(statusLabel, 440, 141, { width: 100, align: 'center' });

      // ====================================================================
      // BLOC CLIENT
      // ====================================================================
      doc.fillColor('#f3f4f6')
         .rect(50, 170, 200, 90)
         .fill();

      doc.fillColor(textColor)
         .fontSize(10)
         .font('Helvetica-Bold')
         .text('FACTURER À:', 60, 180);

      doc.font('Helvetica')
         .fontSize(10)
         .text(facture.client.nom, 60, 198);

      let clientY = 212;
      if (facture.client.adresse) {
        doc.fontSize(9)
           .fillColor(lightGray)
           .text(facture.client.adresse, 60, clientY);
        clientY += 12;
      }
      if (facture.client.ville && facture.client.pays) {
        doc.text(`${facture.client.ville}, ${facture.client.pays}`, 60, clientY);
        clientY += 12;
      }
      if (facture.client.telephone) {
        doc.text(facture.client.telephone, 60, clientY);
        clientY += 12;
      }
      if (facture.client.email) {
        doc.text(facture.client.email, 60, clientY);
      }

      // ====================================================================
      // TABLEAU DES LIGNES
      // ====================================================================
      const tableTop = 280;
      const colWidths = [220, 60, 90, 90];
      const tableLeft = 50;

      // En-tête du tableau
      doc.fillColor(primaryColor)
         .rect(tableLeft, tableTop, colWidths.reduce((a, b) => a + b, 0), 25)
         .fill();

      doc.fillColor('#ffffff')
         .fontSize(9)
         .font('Helvetica-Bold');

      let colX = tableLeft + 10;
      doc.text('Description', colX, tableTop + 8);
      colX += colWidths[0];
      doc.text('Qté', colX, tableTop + 8, { width: colWidths[1], align: 'center' });
      colX += colWidths[1];
      doc.text('Prix Unit.', colX, tableTop + 8, { width: colWidths[2], align: 'right' });
      colX += colWidths[2];
      doc.text('Montant HT', colX, tableTop + 8, { width: colWidths[3], align: 'right' });

      // Lignes du tableau
      let rowY = tableTop + 25;
      doc.font('Helvetica')
         .fontSize(9)
         .fillColor(textColor);

      for (let i = 0; i < facture.lignes.length; i++) {
        const ligne = facture.lignes[i];
        
        // Fond alterné pour les lignes paires
        if (i % 2 === 1) {
          doc.fillColor('#f9fafb')
             .rect(tableLeft, rowY, colWidths.reduce((a, b) => a + b, 0), 22)
             .fill();
          doc.fillColor(textColor);
        }

        colX = tableLeft + 10;
        doc.text(ligne.description.substring(0, 40), colX, rowY + 6);
        colX += colWidths[0];
        doc.text(ligne.quantite.toString(), colX, rowY + 6, { width: colWidths[1], align: 'center' });
        colX += colWidths[1];
        doc.text(formatGNF(ligne.prixUnitaire), colX, rowY + 6, { width: colWidths[2], align: 'right' });
        colX += colWidths[2];
        doc.text(formatGNF(ligne.montantHT), colX, rowY + 6, { width: colWidths[3], align: 'right' });

        rowY += 22;
      }

      // Bordure du tableau
      doc.strokeColor('#e5e7eb')
         .lineWidth(0.5)
         .rect(tableLeft, tableTop, colWidths.reduce((a, b) => a + b, 0), rowY - tableTop);

      // ====================================================================
      // RÉCAPITULATIF DES MONTANTS
      // ====================================================================
      const totalsTop = rowY + 20;
      const totalsLeft = 350;

      doc.fillColor(textColor)
         .fontSize(9)
         .font('Helvetica');

      doc.text('Sous-total HT:', totalsLeft, totalsTop, { width: 100, align: 'left' });
      doc.text(formatGNF(facture.montantHT), totalsLeft + 100, totalsTop, { width: 100, align: 'right' });

      doc.text('TVA (18%):', totalsLeft, totalsTop + 18, { width: 100, align: 'left' });
      doc.text(formatGNF(facture.montantTVA), totalsLeft + 100, totalsTop + 18, { width: 100, align: 'right' });

      doc.fontSize(11)
         .font('Helvetica-Bold')
         .fillColor(primaryColor);
      doc.text('Total TTC:', totalsLeft, totalsTop + 40, { width: 100, align: 'left' });
      doc.text(formatGNF(facture.montantTTC), totalsLeft + 100, totalsTop + 40, { width: 100, align: 'right' });

      // Ligne au-dessus du total
      doc.strokeColor(primaryColor)
         .lineWidth(1)
         .moveTo(totalsLeft, totalsTop + 36)
         .lineTo(totalsLeft + 200, totalsTop + 36)
         .stroke();

      // ====================================================================
      // INFORMATIONS DE PAIEMENT
      // ====================================================================
      if (facture.modePaiement) {
        const paymentLabels: Record<string, string> = {
          'ESPECES': 'Espèces',
          'VIREMENT': 'Virement bancaire',
          'ORANGE_MONEY': 'Orange Money',
          'MTN_MONEY': 'MTN Mobile Money',
          'CHEQUE': 'Chèque',
          'CARTE': 'Carte bancaire'
        };
        doc.fillColor(lightGray)
           .fontSize(8)
           .font('Helvetica')
           .text(`Mode de paiement: ${paymentLabels[facture.modePaiement] || facture.modePaiement}`, 50, totalsTop + 80);
      }

      // ====================================================================
      // NOTES
      // ====================================================================
      if (facture.notes) {
        doc.fillColor(lightGray)
           .fontSize(8)
           .text('Notes:', 50, totalsTop + 100);
        doc.text(facture.notes, 50, totalsTop + 115, { width: 500 });
      }

      // ====================================================================
      // PIED DE PAGE
      // ====================================================================
      doc.fillColor(lightGray)
         .fontSize(8)
         .font('Helvetica')
         .text('Merci pour votre confiance !', 50, 750, { align: 'center' });
      doc.text(`Document généré par GuinéaManager ERP - ${new Date().toLocaleDateString('fr-FR')}`, 50, 762, { align: 'center' });

      // Finalisation du PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
