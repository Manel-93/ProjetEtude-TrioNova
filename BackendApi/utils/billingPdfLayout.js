/**
 * Mise en page PDF factures / avoirs — charte AltheaSystems (ocean + ink).
 */

export const PDF_THEME = {
  ink: '#003d5c',
  ocean: '#00a8b5',
  oceanDark: '#008a94',
  oceanLight: '#d4f4f7',
  slate: '#64748b',
  slateLight: '#f1f5f9',
  border: '#e2e8f0',
  white: '#ffffff',
  text: '#0f172a',
  textMuted: '#64748b',
  success: '#10b981',
  margin: 48
};

const COMPANY = {
  name: 'AltheaSystems',
  tagline: 'Équipements médicaux & e-commerce',
  email: 'altheasystems@outlook.fr',
  website: 'www.altheasystems.fr'
};

function contentWidth(doc) {
  return doc.page.width - PDF_THEME.margin * 2;
}

function formatMoney(value, currency = 'EUR') {
  const n = Number(value);
  const sym = currency === 'EUR' ? '€' : currency;
  return `${n.toFixed(2)} ${sym}`;
}

function formatDateFr(date) {
  return new Date(date).toLocaleDateString('fr-FR', {
    day: '2-digit',
    month: 'long',
    year: 'numeric'
  });
}

function drawRoundedRect(doc, x, y, w, h, r, fill, stroke) {
  doc.roundedRect(x, y, w, h, r);
  if (fill && stroke) {
    doc.fillColor(fill).strokeColor(stroke).lineWidth(0.75).fillAndStroke();
  } else if (fill) {
    doc.fillColor(fill).fill();
  } else if (stroke) {
    doc.strokeColor(stroke).lineWidth(0.75).stroke();
  }
}

/** Bandeau d'en-tête avec titre document */
export function drawDocumentHeader(doc, { docTitle, docNumber }) {
  const m = PDF_THEME.margin;
  const w = doc.page.width;
  const bandH = 88;

  doc.save();
  doc.rect(0, 0, w, bandH).fill(PDF_THEME.ocean);

  doc.fillColor(PDF_THEME.white).font('Helvetica-Bold').fontSize(11);
  doc.text(COMPANY.name.toUpperCase(), m, 22);

  doc.font('Helvetica').fontSize(9).fillColor(PDF_THEME.oceanLight);
  doc.text(COMPANY.tagline, m, 38);

  doc.font('Helvetica-Bold').fontSize(26);
  doc.text(docTitle, m, 52, { align: 'right', width: w - m * 2 });

  doc.font('Helvetica').fontSize(10).fillColor(PDF_THEME.white);
  doc.text(docNumber, m, 72, { align: 'right', width: w - m * 2 });
  doc.restore();

  return bandH + 12;
}

/** Blocs émetteur + client */
export function drawParties(doc, startY, { user, billingAddress }) {
  const m = PDF_THEME.margin;
  const colW = (contentWidth(doc) - 16) / 2;
  const boxH = 108;

  drawRoundedRect(doc, m, startY, colW, boxH, 6, PDF_THEME.slateLight, PDF_THEME.border);

  doc.fillColor(PDF_THEME.ocean).font('Helvetica-Bold').fontSize(8);
  doc.text('ÉMETTEUR', m + 14, startY + 12);
  doc.fillColor(PDF_THEME.text).font('Helvetica-Bold').fontSize(11);
  doc.text(COMPANY.name, m + 14, startY + 26);
  doc.font('Helvetica').fontSize(9).fillColor(PDF_THEME.textMuted);
  doc.text(COMPANY.email, m + 14, startY + 42, { width: colW - 28 });
  doc.text(COMPANY.website, m + 14, startY + 56);

  const clientX = m + colW + 16;
  drawRoundedRect(doc, clientX, startY, colW, boxH, 6, PDF_THEME.white, PDF_THEME.border);

  doc.fillColor(PDF_THEME.ocean).font('Helvetica-Bold').fontSize(8);
  doc.text('FACTURÉ À', clientX + 14, startY + 12);

  let cy = startY + 26;
  doc.fillColor(PDF_THEME.text).font('Helvetica-Bold').fontSize(10);
  if (user) {
    const name = [user.first_name, user.last_name].filter(Boolean).join(' ').trim();
    doc.text(name || user.email, clientX + 14, cy, { width: colW - 28 });
    cy += 14;
    doc.font('Helvetica').fontSize(9).fillColor(PDF_THEME.textMuted);
    doc.text(user.email, clientX + 14, cy, { width: colW - 28 });
    cy += 14;
  } else {
    doc.text('Client invité', clientX + 14, cy);
    cy += 14;
    doc.font('Helvetica').fontSize(9).fillColor(PDF_THEME.textMuted);
  }

  if (billingAddress) {
    doc.font('Helvetica').fontSize(9).fillColor(PDF_THEME.textMuted);
    const lines = [
      billingAddress.company,
      billingAddress.addressLine1,
      billingAddress.addressLine2,
      [billingAddress.postalCode, billingAddress.city].filter(Boolean).join(' '),
      billingAddress.country
    ].filter(Boolean);
    for (const line of lines) {
      doc.text(line, clientX + 14, cy, { width: colW - 28 });
      cy += 12;
    }
  }

  return startY + boxH + 20;
}

/** Ligne méta (date, commande) */
export function drawMetaRow(doc, startY, { issuedAt, orderNumber }) {
  const m = PDF_THEME.margin;
  const pillH = 28;
  const gap = 12;

  doc.fillColor(PDF_THEME.textMuted).font('Helvetica').fontSize(9);
  doc.text(`Date d'émission : ${formatDateFr(issuedAt)}`, m, startY + 6);
  doc.text(`Commande : ${orderNumber}`, m + 220, startY + 6);

  return startY + pillH + 8;
}

const TABLE_COLS = {
  product: { x: 48, w: 210 },
  qty: { x: 268, w: 36 },
  unit: { x: 310, w: 72 },
  vat: { x: 388, w: 48 },
  total: { x: 442, w: 105 }
};

function drawTableHeader(doc, y) {
  const m = PDF_THEME.margin;
  const w = contentWidth(doc);
  const rowH = 28;

  doc.save();
  drawRoundedRect(doc, m, y, w, rowH, 4, PDF_THEME.ink, null);
  doc.fillColor(PDF_THEME.white).font('Helvetica-Bold').fontSize(8);
  doc.text('PRODUIT', TABLE_COLS.product.x, y + 9, { width: TABLE_COLS.product.w });
  doc.text('QTÉ', TABLE_COLS.qty.x, y + 9, { width: TABLE_COLS.qty.w, align: 'center' });
  doc.text('P.U. HT', TABLE_COLS.unit.x, y + 9, { width: TABLE_COLS.unit.w, align: 'right' });
  doc.text('TVA', TABLE_COLS.vat.x, y + 9, { width: TABLE_COLS.vat.w, align: 'right' });
  doc.text('TOTAL TTC', TABLE_COLS.total.x, y + 9, { width: TABLE_COLS.total.w, align: 'right' });
  doc.restore();

  return y + rowH + 4;
}

/** Tableau des lignes — retourne Y final */
export function drawLineItemsTable(doc, startY, items) {
  let y = drawTableHeader(doc, startY);
  const m = PDF_THEME.margin;
  const w = contentWidth(doc);
  const rowH = 26;
  let rowIndex = 0;

  for (const item of items) {
    if (y > doc.page.height - 160) {
      doc.addPage({ margin: PDF_THEME.margin });
      y = drawTableHeader(doc, PDF_THEME.margin);
    }

    if (rowIndex % 2 === 0) {
      drawRoundedRect(doc, m, y, w, rowH, 2, PDF_THEME.slateLight, null);
    }

    doc.fillColor(PDF_THEME.text).font('Helvetica').fontSize(9);
    doc.text(String(item.productName || '—'), TABLE_COLS.product.x, y + 8, {
      width: TABLE_COLS.product.w,
      ellipsis: true
    });
    doc.text(String(item.quantity), TABLE_COLS.qty.x, y + 8, {
      width: TABLE_COLS.qty.w,
      align: 'center'
    });
    doc.text(formatMoney(item.unitPriceHt), TABLE_COLS.unit.x, y + 8, {
      width: TABLE_COLS.unit.w,
      align: 'right'
    });
    doc.text(`${Number(item.tva).toFixed(0)} %`, TABLE_COLS.vat.x, y + 8, {
      width: TABLE_COLS.vat.w,
      align: 'right'
    });
    doc.font('Helvetica-Bold');
    doc.text(formatMoney(item.total), TABLE_COLS.total.x, y + 8, {
      width: TABLE_COLS.total.w,
      align: 'right'
    });
    doc.font('Helvetica');

    y += rowH + 2;
    rowIndex += 1;
  }

  return y + 12;
}

/** Encadré totaux */
export function drawTotalsBox(doc, startY, { subtotal, tva, total, currency, vatRate }) {
  const m = PDF_THEME.margin;
  const boxW = 220;
  const boxX = doc.page.width - m - boxW;
  const lineH = 22;
  const boxH = lineH * 4 + 24;

  drawRoundedRect(doc, boxX, startY, boxW, boxH, 8, PDF_THEME.white, PDF_THEME.ocean);

  let ty = startY + 14;
  const labelX = boxX + 16;
  const valueW = 90;

  const row = (label, value, bold = false) => {
    doc.font(bold ? 'Helvetica-Bold' : 'Helvetica')
      .fontSize(bold ? 11 : 9)
      .fillColor(bold ? PDF_THEME.ink : PDF_THEME.textMuted);
    doc.text(label, labelX, ty, { width: boxW - valueW - 24 });
    doc.fillColor(bold ? PDF_THEME.ocean : PDF_THEME.text);
    doc.text(value, boxX + boxW - valueW - 16, ty, { width: valueW, align: 'right' });
    ty += lineH;
  };

  row('Sous-total HT', formatMoney(subtotal, currency));
  row(`TVA (${vatRate} %)`, formatMoney(tva, currency));

  doc.moveTo(boxX + 12, ty).lineTo(boxX + boxW - 12, ty).strokeColor(PDF_THEME.border).lineWidth(0.5).stroke();
  ty += 8;

  row('Total TTC', formatMoney(total, currency), true);

  return startY + boxH + 24;
}

export function drawPageFooter(doc, message = 'Merci pour votre confiance — AltheaSystems') {
  const m = PDF_THEME.margin;
  const w = contentWidth(doc);
  const footerY = doc.page.height - PDF_THEME.margin - 20;

  doc.moveTo(m, footerY).lineTo(m + w, footerY).strokeColor(PDF_THEME.border).lineWidth(0.75).stroke();
  doc.fillColor(PDF_THEME.textMuted).font('Helvetica').fontSize(8);
  doc.text(message, m, footerY + 10, { width: w, align: 'center' });
  doc.text(
    `${COMPANY.name} · ${COMPANY.email}`,
    m,
    footerY + 22,
    { width: w, align: 'center' }
  );
}

/** Rendu complet facture sur un PDFDocument déjà créé */
export function renderInvoiceDocument(doc, { invoice, order, items, user }) {
  const vatRate = items[0]?.tva != null ? Number(items[0].tva) : 20;
  let y = drawDocumentHeader(doc, {
    docTitle: 'FACTURE',
    docNumber: `N° ${invoice.invoiceNumber}`
  });
  y = drawParties(doc, y, { user, billingAddress: order.billingAddress });
  y = drawMetaRow(doc, y, {
    issuedAt: invoice.createdAt,
    orderNumber: order.orderNumber
  });
  y = drawLineItemsTable(doc, y, items);
  y = drawTotalsBox(doc, y, {
    subtotal: invoice.subtotal,
    tva: invoice.tva,
    total: invoice.total,
    currency: invoice.currency || 'EUR',
    vatRate
  });
  drawPageFooter(doc);
}

/** Rendu avoir */
export function renderCreditNoteDocument(doc, { creditNote, invoice, order, user }) {
  let y = drawDocumentHeader(doc, {
    docTitle: 'AVOIR',
    docNumber: `N° ${creditNote.creditNoteNumber}`
  });
  y = drawParties(doc, y, { user, billingAddress: order?.billingAddress });
  y = drawMetaRow(doc, y, {
    issuedAt: creditNote.createdAt,
    orderNumber: order?.orderNumber || '—'
  });

  const m = PDF_THEME.margin;
  const w = contentWidth(doc);

  drawRoundedRect(doc, m, y, w, 72, 6, PDF_THEME.slateLight, PDF_THEME.border);
  doc.fillColor(PDF_THEME.textMuted).font('Helvetica').fontSize(9);
  doc.text(`Facture d'origine : ${invoice.invoiceNumber}`, m + 16, y + 14);
  doc.text('Motif', m + 16, y + 32);
  doc.fillColor(PDF_THEME.text).font('Helvetica').fontSize(10);
  doc.text(creditNote.reason || 'Non spécifié', m + 16, y + 46, { width: w - 32 });

  y += 88;

  const boxW = 240;
  const boxX = doc.page.width - m - boxW;
  drawRoundedRect(doc, boxX, y, boxW, 56, 8, PDF_THEME.oceanLight, PDF_THEME.ocean);
  doc.fillColor(PDF_THEME.ink).font('Helvetica-Bold').fontSize(9);
  doc.text('MONTANT REMBOURSÉ', boxX + 16, y + 12);
  doc.fontSize(18).fillColor(PDF_THEME.ocean);
  doc.text(
    formatMoney(creditNote.amount, creditNote.currency),
    boxX + 16,
    y + 28,
    { width: boxW - 32, align: 'right' }
  );

  drawPageFooter(doc, 'Avoir émis conformément à votre commande — AltheaSystems');
}
