// PDF Generator for GuinéaManager Invoices
// Uses reportlab-style generation with pdfkit

import PDFDocument from 'pdfkit';
import { PassThrough } from 'stream';

interface LigneFacture {
  description: string;
  quantite: number;
  prixUnitaire: number;
  tauxTVA: number;
  montantHT: number;
  montantTVA: number;
  montantTTC: number;
}

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
  client: {
    nom: string;
    email?: string;
    telephone?: string;
    adresse?: string;
    ville?: string;
    pays?: string;
  };
  company: {
    nom: string;
    email?: string;
    telephone?: string;
    adresse?: string;
    ville?: string;
    pays?: string;
    ninea?: string;
  };
  lignes: LigneFacture[];
}

// Format amount in GNF
function formatGNF(montant: number): string {
  return new Intl.NumberFormat('fr-GN', {
    style: 'decimal',
    minimumFractionDigits: 0,
    maximumFractionDigits: 0
  }).format(montant) + ' GNF';
}

// Format date
function formatDate(date: Date): string {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric'
  });
}

export async function generateInvoicePDF(facture: FactureData): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      // Create PDF document
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

      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      // Colors
      const primaryColor = '#059669'; // emerald-600
      const textColor = '#1f2937'; // gray-800
      const lightGray = '#6b7280'; // gray-500

      // Header - Company info
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

      // Invoice title (right side)
      doc.fillColor(primaryColor)
         .fontSize(28)
         .font('Helvetica-Bold')
         .text('FACTURE', 350, 50, { align: 'right' });

      doc.fillColor(textColor)
         .fontSize(11)
         .font('Helvetica-Bold')
         .text(facture.numero, 350, 85, { align: 'right' });

      // Invoice details
      doc.fontSize(9)
         .font('Helvetica')
         .fillColor(lightGray);

      doc.text(`Date d'émission: ${formatDate(facture.dateEmission)}`, 350, 105, { align: 'right' });
      doc.text(`Date d'échéance: ${formatDate(facture.dateEcheance)}`, 350, 118, { align: 'right' });

      // Status badge
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

      // Client info box
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

      // Table header
      const tableTop = 280;
      const colWidths = [220, 60, 90, 90];
      const tableLeft = 50;

      // Header background
      doc.fillColor(primaryColor)
         .rect(tableLeft, tableTop, colWidths.reduce((a, b) => a + b, 0), 25)
         .fill();

      // Header text
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

      // Table rows
      let rowY = tableTop + 25;
      doc.font('Helvetica')
         .fontSize(9)
         .fillColor(textColor);

      for (let i = 0; i < facture.lignes.length; i++) {
        const ligne = facture.lignes[i];
        
        // Alternating row background
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

      // Table border
      doc.strokeColor('#e5e7eb')
         .lineWidth(0.5)
         .rect(tableLeft, tableTop, colWidths.reduce((a, b) => a + b, 0), rowY - tableTop);

      // Totals section
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

      // Draw line above total
      doc.strokeColor(primaryColor)
         .lineWidth(1)
         .moveTo(totalsLeft, totalsTop + 36)
         .lineTo(totalsLeft + 200, totalsTop + 36)
         .stroke();

      // Payment info
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

      // Notes
      if (facture.notes) {
        doc.fillColor(lightGray)
           .fontSize(8)
           .text('Notes:', 50, totalsTop + 100);
        doc.text(facture.notes, 50, totalsTop + 115, { width: 500 });
      }

      // Footer
      doc.fillColor(lightGray)
         .fontSize(8)
         .font('Helvetica')
         .text('Merci pour votre confiance !', 50, 750, { align: 'center' });
      doc.text(`Document généré par GuinéaManager ERP - ${new Date().toLocaleDateString('fr-FR')}`, 50, 762, { align: 'center' });

      // Finalize PDF
      doc.end();
    } catch (error) {
      reject(error);
    }
  });
}
