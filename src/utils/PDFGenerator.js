import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import ReactNativeBlobUtil from 'react-native-blob-util';

const numberToWords = num => {
  if (!num) return '';
  const a = [
    '',
    'One ',
    'Two ',
    'Three ',
    'Four ',
    'Five ',
    'Six ',
    'Seven ',
    'Eight ',
    'Nine ',
    'Ten ',
    'Eleven ',
    'Twelve ',
    'Thirteen ',
    'Fourteen ',
    'Fifteen ',
    'Sixteen ',
    'Seventeen ',
    'Eighteen ',
    'Nineteen ',
  ];
  const b = [
    '',
    '',
    'Twenty',
    'Thirty',
    'Forty',
    'Fifty',
    'Sixty',
    'Seventy',
    'Eighty',
    'Ninety',
  ];

  const n = ('000000000' + num)
    .slice(-9)
    .match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
  if (!n) return '';
  let str = '';
  str +=
    n[1] != 0
      ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + 'Crore '
      : '';
  str +=
    n[2] != 0
      ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + 'Lakh '
      : '';
  str +=
    n[3] != 0
      ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + 'Thousand '
      : '';
  str +=
    n[4] != 0
      ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + 'Hundred '
      : '';
  str +=
    n[5] != 0
      ? (str != '' ? 'and ' : '') +
        (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]])
      : '';
  return str + 'Only';
};

export const generatePDF = async (header, items) => {
  console.log('items', items);
  console.log('header', header);
  // DEBUG: shows exact field names from API for first item
  if (items && items.length > 0) {
    console.log('=== ITEM FIELDS (for fixing 0 values) ===');
    Object.entries(items[0]).forEach(([key, val]) => console.log(`  ${key}: ${val}`));
    console.log('==========================================');
  }

  try {
    const pdfDoc = await PDFDocument.create();
    const page = pdfDoc.addPage([595.28, 841.89]); // A4 size
    const { width, height } = page.getSize();
    const font = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const boldFont = await pdfDoc.embedFont(StandardFonts.HelveticaBold);

    let y = height - 50;
    const fontSize = 10;

    const drawText = (
      text,
      x,
      y,
      size = fontSize,
      fontToUse = font,
      color = rgb(0, 0, 0),
    ) => {
      page.drawText(String(text || ''), { x, y, size, font: fontToUse, color });
    };

    const drawLine = (x1, y1, x2, y2, thickness = 1) => {
      page.drawLine({
        start: { x: x1, y: y1 },
        end: { x: x2, y: y2 },
        thickness,
        color: rgb(0, 0, 0),
      });
    };

    const formatRoundedNum = n =>
      Math.round(parseFloat(n) || 0).toLocaleString('en-PK');

    const wrapText = (text, fontToUse, size, maxWidth) => {
      const words = String(text || '')
        .trim()
        .split(/\s+/)
        .filter(Boolean);
      const lines = [];
      let line = '';

      const pushLongWord = word => {
        let chunk = '';
        for (const char of word) {
          const nextChunk = chunk + char;
          if (fontToUse.widthOfTextAtSize(nextChunk, size) <= maxWidth) {
            chunk = nextChunk;
          } else {
            if (chunk) lines.push(chunk);
            chunk = char;
          }
        }
        return chunk;
      };

      words.forEach(word => {
        const candidate = line ? `${line} ${word}` : word;
        if (fontToUse.widthOfTextAtSize(candidate, size) <= maxWidth) {
          line = candidate;
          return;
        }

        if (line) {
          lines.push(line);
          line = '';
        }

        if (fontToUse.widthOfTextAtSize(word, size) <= maxWidth) {
          line = word;
        } else {
          line = pushLongWord(word);
        }
      });

      if (line) lines.push(line);
      return lines.length ? lines : [''];
    };

    // --- Header ---
    drawText(
      'SALES QUOTATION',
      width - 250,
      y,
      20,
      boldFont,
      rgb(0.6, 0.6, 0.6),
    );

    // Wrap location name if too long
    const locationName = header.location_name || '';
    if (locationName.length > 40) {
      const line1 = locationName.substring(0, 40);
      const line2 = locationName.substring(40, 80);
      drawText(line1, 50, y, 10, boldFont);
      y -= 12;
      if (line2) {
        drawText(
          line2 + (locationName.length > 80 ? '...' : ''),
          50,
          y,
          10,
          boldFont,
        );
        y -= 12;
      }
    } else {
      drawText(locationName, 50, y, 10, boldFont);
      y -= 12;
    }

    drawText(header.location_address || '', 50, y, 8);
    y -= 20;

    const dateStr = header.trans_date;
    const quoteNo = header.reference || '';

    const rightColLabel = width - 200;
    const rightColValue = width - 100;

    drawText('Date', rightColLabel, y, 9);
    drawText(dateStr, rightColValue, y, 9);
    y -= 12;
    drawText('Reference No', rightColLabel, y, 9);
    drawText(quoteNo, rightColValue, y, 9);
    y -= 5;

    y -= 20;
    drawLine(50, y, width - 50, y, 1.5);
    y -= 15;

    // --- Customer Section ---
    drawText('Customer', 50, y, 10, boldFont);
    y -= 15;
    drawText(header.name || 'N/A', 50, y, 10, boldFont);
    y -= 12;
    drawText(header.customer_contact_no, 50, y, 10);
    y -= 25;

    // --- Sales Person Box ---
    const boxWidth = width - 100;

    page.drawRectangle({
      x: 50,
      y: y - 12,
      width: boxWidth,
      height: 12,
      color: rgb(0.85, 0.85, 0.85),
    });

    page.drawRectangle({
      x: 50,
      y: y - 25,
      width: boxWidth,
      height: 25,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });

    drawLine(width / 2, y, width / 2, y - 25);
    drawLine(50, y - 12, width - 50, y - 12);

    drawText('Sales Person', 50 + boxWidth / 4 - 25, y - 9, 9, boldFont);
    drawText('Contact No', width / 2 + boxWidth / 4 - 25, y - 9, 9, boldFont);

    drawText(header.salesman || 'N/A', 50 + boxWidth / 4 - 30, y - 22, 9);
    drawText(
      header.salesman_contact || '-',
      width / 2 + boxWidth / 4 - 30,
      y - 22,
      9,
    );

    y -= 40;

    // --- Items Table ---
    const tableTop = y;
    // Column positions: Sr, Item, Packing, Box, Pc, Qty, Uom, Rate, Gross Value, Discounted Rate, Discount, Discounted Value
    // Page width = 595.28, margins 50 left/right => usable = 495.28
    // Widths: 20, 130, 40, 28, 28, 35, 30, 38, 45, 45, 38, 48 = 525... too wide
    // Let's use: 20+120+38+25+25+33+28+36+42+42+36+50 = 495
    const colX =      [50,  70, 190, 228, 253, 278, 311, 339, 375, 417, 459, 495];
    const colWidths = [20, 120,  38,  25,  25,  33,  28,  36,  42,  42,  36,  50];

    // Header row - two lines for long headers
    const headerRowHeight = 22;
    page.drawRectangle({
      x: 50,
      y: y - headerRowHeight,
      width: width - 100,
      height: headerRowHeight,
      color: rgb(0.85, 0.85, 0.85),
    });

    const tableHeaders = [
      { line1: 'SR', line2: '' },
      { line1: 'ITEM', line2: '' },
      { line1: 'PACKING', line2: '' },
      { line1: 'BOX', line2: '' },
      { line1: 'PC', line2: '' },
      { line1: 'QTY', line2: '' },
      { line1: 'UOM', line2: '' },
      { line1: 'RATE', line2: '' },
      { line1: 'GROSS', line2: 'VALUE' },
      { line1: 'DISCOUNTED', line2: 'RATE' },
      { line1: 'DISCOUNT', line2: '' },
      { line1: 'TOTAL', line2: 'VALUE' },
    ];

    tableHeaders.forEach((h, i) => {
      const hasTwo = !!h.line2;
      const topY = hasTwo ? y - 8 : y - 14;
      const w1 = boldFont.widthOfTextAtSize(h.line1, 6);
      const xCenter = colX[i] + colWidths[i] / 2;
      drawText(h.line1, xCenter - w1 / 2, topY, 6, boldFont);
      if (hasTwo) {
        const w2 = boldFont.widthOfTextAtSize(h.line2, 6);
        drawText(h.line2, xCenter - w2 / 2, topY - 8, 6, boldFont);
      }
    });

    page.drawRectangle({
      x: 50,
      y: y - headerRowHeight,
      width: width - 100,
      height: headerRowHeight,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });

    y -= headerRowHeight + 8;

    let totalGrossValue = 0;
    let totalDiscount = 0;
    let totalDiscountedValue = 0;
    const rowHeight = 16;
    const productLineHeight = 10;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];
      const rowY = y;

      // Col 0: SR - center aligned
      const srText = (i + 1).toString();
      const srWidth = font.widthOfTextAtSize(srText, 8);
      drawText(srText, colX[0] + (colWidths[0] - srWidth) / 2, rowY, 8);

      // Col 1: ITEM - left aligned with wrapping
      const descLines = wrapText(
        item.description || '',
        font,
        7,
        colWidths[1] - 4,
      );
      const productStartY = descLines.length > 1 ? rowY + 3 : rowY;
      descLines.forEach((line, lineIndex) => {
        drawText(
          line,
          colX[1] + 2,
          productStartY - lineIndex * productLineHeight,
          7,
        );
      });

      // Col 2: PACKING - sqm per box (sqm / box), center aligned
      const boxCount = parseFloat(item.box || 1);
      const sqmVal = parseFloat(item.sqm || 0);
      const packingVal = boxCount > 0 ? (sqmVal / boxCount).toFixed(2) : sqmVal.toFixed(2);
      const packingText = String(packingVal);
      const packingWidth = font.widthOfTextAtSize(packingText, 8);
      drawText(packingText, colX[2] + (colWidths[2] - packingWidth) / 2, rowY, 8);

      // Col 3: BOX - center aligned
      const boxText = String(item.box || '-');
      const boxTxtWidth = font.widthOfTextAtSize(boxText, 8);
      drawText(boxText, colX[3] + (colWidths[3] - boxTxtWidth) / 2, rowY, 8);

      // Col 4: PC - center aligned
      const pcText = String(item.pec || '-');
      const pcWidth = font.widthOfTextAtSize(pcText, 8);
      drawText(pcText, colX[4] + (colWidths[4] - pcWidth) / 2, rowY, 8);

      // Col 5: QTY - center aligned (sqm = total area)
      const qtyText = String(item.sqm || '-');
      const qtyWidth = font.widthOfTextAtSize(qtyText, 8);
      drawText(qtyText, colX[5] + (colWidths[5] - qtyWidth) / 2, rowY, 8);

      // Col 6: UOM - center aligned
      const uomText = String(item.units || '');
      const uomWidth = font.widthOfTextAtSize(uomText, 8);
      drawText(uomText, colX[6] + (colWidths[6] - uomWidth) / 2, rowY, 8);

      // Col 7: RATE (gross/list rate = unit_price) - right aligned
      const rate = parseFloat(item.unit_price || item.rate || 0);
      const rateStr = Math.round(rate).toLocaleString('en-PK');
      const rateWidth = font.widthOfTextAtSize(rateStr, 8);
      drawText(rateStr, colX[7] + colWidths[7] - rateWidth - 2, rowY, 8);

      // Col 8: GROSS VALUE = net_value + discount_value - right aligned
      const netValue = parseFloat(item.net_value || 0);
      const discountVal = parseFloat(item.discount_value || 0);
      const grossValue = netValue + discountVal;
      const grossStr = formatRoundedNum(grossValue);
      const grossWidth = font.widthOfTextAtSize(grossStr, 8);
      drawText(grossStr, colX[8] + colWidths[8] - grossWidth - 2, rowY, 8);

      // Col 9: DISCOUNTED RATE = item.rate (actual selling rate) - right aligned
      const discountedRate = parseFloat(item.rate || item.sqprice || 0);
      const discRateStr = Math.round(discountedRate).toLocaleString('en-PK');
      const discRateWidth = font.widthOfTextAtSize(discRateStr, 8);
      drawText(discRateStr, colX[9] + colWidths[9] - discRateWidth - 2, rowY, 8);

      // Col 10: DISCOUNT = discount_value - right aligned
      const discAmtStr = formatRoundedNum(discountVal);
      const discAmtWidth = font.widthOfTextAtSize(discAmtStr, 8);
      drawText(discAmtStr, colX[10] + colWidths[10] - discAmtWidth - 2, rowY, 8);

      // Col 11: TOTAL VALUE = net_value - right aligned
      const netStr = formatRoundedNum(netValue);
      const netWidth = font.widthOfTextAtSize(netStr, 8);
      drawText(netStr, colX[11] + colWidths[11] - netWidth - 2, rowY, 8);

      totalGrossValue += grossValue;
      totalDiscount += discountVal;
      totalDiscountedValue += netValue;

      y -= Math.max(rowHeight, descLines.length * productLineHeight);

      if (i < items.length - 1) {
        drawLine(50, y + 10, width - 50, y + 10, 0.5);
      }

      if (item.long_description) {
        drawText(
          item.long_description,
          colX[1] + 2,
          y,
          7,
          font,
          rgb(0.4, 0.4, 0.4),
        );
        y -= 10;
        if (i < items.length - 1) {
          drawLine(50, y + 6, width - 50, y + 6, 0.5);
        }
      }
    }

    y -= 5;
    const tableBottom = y;
    const tableHeight = tableTop - headerRowHeight - tableBottom;

    page.drawRectangle({
      x: 50,
      y: tableBottom,
      width: width - 100,
      height: tableHeight,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });

    const drawLineVert = x => drawLine(x, tableTop - headerRowHeight, x, tableBottom);

    drawLineVert(colX[1]);
    drawLineVert(colX[2]);
    drawLineVert(colX[3]);
    drawLineVert(colX[4]);
    drawLineVert(colX[5]);
    drawLineVert(colX[6]);
    drawLineVert(colX[7]);
    drawLineVert(colX[8]);
    drawLineVert(colX[9]);
    drawLineVert(colX[10]);
    drawLineVert(colX[11]);

    // --- Totals Section (matches image layout) ---
    // Total box spans last 4 columns: Gross Value, Discounted Rate, Discount, Discounted Value
    // col indices: 8(Gross), 9(Disc Rate), 10(Discount), 11(Disc Value)
    const furtherDiscount = parseFloat(header.discount) || 0;
    const finalTotal = totalDiscountedValue - furtherDiscount;

    const totBoxX = colX[8];                          // start of Gross Value col
    const totBoxRight = colX[11] + colWidths[11];     // right edge of table = width-50
    const totBoxWidth = totBoxRight - totBoxX;        // total box width

    // Row heights
    const totRowH = 14;
    y -= 5;

    // ---- TOTAL row ----
    const totRow1Y = y - totRowH;
    page.drawRectangle({
      x: totBoxX,
      y: totRow1Y,
      width: totBoxWidth,
      height: totRowH,
      borderColor: rgb(0, 0, 0),
      borderWidth: 0.5,
    });
    // Internal vertical lines for TOTAL row
    drawLine(colX[9],  y, colX[9],  totRow1Y);
    drawLine(colX[10], y, colX[10], totRow1Y);
    drawLine(colX[11], y, colX[11], totRow1Y);

    // TOTAL label (left of box)
    drawText('TOTAL', totBoxX - 45, totRow1Y + 4, 8, boldFont);

    // Gross Value total — right aligned in col 8
    const gvStr = formatRoundedNum(totalGrossValue);
    const gvW = font.widthOfTextAtSize(gvStr, 8);
    drawText(gvStr, colX[9] - gvW - 2, totRow1Y + 4, 8);

    // Discount total — right aligned in col 10 (DISCOUNT column)
    const discTotStr = `- ${formatRoundedNum(totalDiscount)}`;
    const discTotW = font.widthOfTextAtSize(discTotStr, 8);
    drawText(discTotStr, colX[11] - discTotW - 2, totRow1Y + 4, 8);

    // Discounted Value total — right aligned in col 11
    const dvStr = formatRoundedNum(totalDiscountedValue);
    const dvW = font.widthOfTextAtSize(dvStr, 8);
    drawText(dvStr, totBoxRight - dvW - 2, totRow1Y + 4, 8);

    y = totRow1Y;

    // ---- FURTHER DISCOUNT row ----
    const totRow2Y = y - totRowH;
    page.drawRectangle({
      x: totBoxX,
      y: totRow2Y,
      width: totBoxWidth,
      height: totRowH,
      borderColor: rgb(0, 0, 0),
      borderWidth: 0.5,
    });
    drawLine(colX[11], y, colX[11], totRow2Y);

    const fdLabelStr = 'FURTHER DISCOUNT';
    drawText(fdLabelStr, totBoxX + 4, totRow2Y + 4, 7, boldFont);

    const fdStr = formatRoundedNum(furtherDiscount);
    const fdW = font.widthOfTextAtSize(fdStr, 8);
    drawText(fdStr, totBoxRight - fdW - 2, totRow2Y + 4, 8);

    y = totRow2Y;

    // ---- NET VALUE row ----
    const totRow3Y = y - totRowH;
    page.drawRectangle({
      x: totBoxX,
      y: totRow3Y,
      width: totBoxWidth,
      height: totRowH,
      borderColor: rgb(0, 0, 0),
      borderWidth: 0.5,
    });
    drawLine(colX[11], y, colX[11], totRow3Y);

    drawText('NET VALUE', totBoxX + 4, totRow3Y + 4, 8, boldFont);

    const nvStr = formatRoundedNum(finalTotal);
    const nvW = boldFont.widthOfTextAtSize(nvStr, 9);
    drawText(nvStr, totBoxRight - nvW - 2, totRow3Y + 4, 9, boldFont);

    y = totRow3Y - 10;

    y -= 10;
    drawText(
      `Amount in words: ${numberToWords(Math.round(finalTotal))}`,
      50,
      y,
      8,
    );
    y -= 30;

    // --- Terms and Conditions ---
    drawText('Terms and Conditions:', 50, y, 10, boldFont);
    y -= 15;

    const terms = [
      '1. This quotation is valid for 7 days from the date of issuance.',
      '2. The quoted rates are without offloading and transportation of goods.',
      "3. This quotation doesn't confirm the availability of stocks.",
      '4. The availability of stock will be confirmed and reserved on advance payment.',
      '   i.e minimum 50% of the order value.',
      '5. Customised orders will be confirmed on 100% advance payments.',
    ];

    terms.forEach(term => {
      drawText(term, 55, y, 8);
      y -= 12;
    });

    y -= 50;

    // --- Signatures ---
    const sigY = y;
    const preparedByName = header.real_name || 'N/A';
    drawText(preparedByName, 100, sigY);
    drawLine(80, sigY - 5, 180, sigY - 5);
    drawText('Prepared By', 100, sigY - 15, 8);

    drawLine(width - 180, sigY - 5, width - 80, sigY - 5);
    drawText('Approved By', width - 160, sigY - 15, 8);

    const pdfBase64 = await pdfDoc.saveAsBase64();
    const fileName = `Quotation_${quoteNo}.pdf`;
    const path = `${ReactNativeBlobUtil.fs.dirs.CacheDir}/${fileName}`;

    await ReactNativeBlobUtil.fs.writeFile(path, pdfBase64, 'base64');
    return path;
  } catch (error) {
    console.error('PDF Generation Error:', error);
    throw error;
  }
};
