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

    // --- Header ---
    drawText(
      'SALES QUOTATION',
      width - 250,
      y,
      20,
      boldFont,
      rgb(0.6, 0.6, 0.6),
    );

    drawText(header.location_name, 50, y, 10, boldFont);
    y -= 12;
    drawText(header.location_address || '', 50, y, 8);
    y -= 20;

    const dateStr = header.trans_date || new Date().toLocaleDateString('en-GB');
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
    drawText(header.phone || header.customer_contact_no || '', 50, y, 10);
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
    const colX = [50, 75, 280, 310, 340, 375, 410, 450, 490];
    const colWidths = [25, 205, 30, 30, 35, 35, 40, 40, 55];

    page.drawRectangle({
      x: 50,
      y: y - 15,
      width: width - 100,
      height: 15,
      color: rgb(0.85, 0.85, 0.85),
    });

    const headers = [
      'Sr.',
      'Product',
      'Box',
      'Pc',
      'Qty',
      'Uom',
      'Disc%',
      'Disc Val',
      'Amount',
    ];
    headers.forEach((h, i) => {
      let xPos = colX[i];
      if (i > 1) xPos += 2;
      if (i === 8) xPos += 10;
      drawText(h, xPos, y - 11, 8, boldFont);
    });

    page.drawRectangle({
      x: 50,
      y: y - 15,
      width: width - 100,
      height: 15,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });

    y -= 25;

    let totalAmount = 0;

    for (let i = 0; i < items.length; i++) {
      const item = items[i];

      drawText((i + 1).toString(), colX[0] + 2, y, 8);

      let desc = item.description || '';
      if (desc.length > 35) desc = desc.substring(0, 32) + '...';
      drawText(desc, colX[1], y, 8);

      drawText(item.box || '-', colX[2] + 5, y, 8);
      drawText(item.pec || item.pc || '-', colX[3] + 5, y, 8);
      drawText(item.quantity || item.qty || '-', colX[4] + 5, y, 8);
      drawText(item.uom || 'sqm', colX[5] + 5, y, 8);

      // Disc% (percentage) - formatted to 2 decimal places
      const discPercent = parseFloat(item.discount_percent * 100 || 0);
      drawText(discPercent.toFixed(2), colX[6] + 5, y, 8);

      // Calculate Disc Value (actual discount amount)
      // const qty = parseFloat(item.quantity || item.qty || 0);
      // const unitPrice = parseFloat(item.unit_price || item.rate || 0);
      // const discValue = (qty * unitPrice * discPercent) / 100;
      // const discValueStr = discValue.toLocaleString('en-PK', {
      //   minimumFractionDigits: 2,
      //   maximumFractionDigits: 2,
      // });
      drawText(Math.floor(item.discount_value) || '-', colX[7] + 2, y, 8);

      const netValue = parseFloat(item.net_value || 0);
      const amountStr = netValue.toLocaleString('en-PK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

      const amountWidth = font.widthOfTextAtSize(amountStr, 8);
      drawText(amountStr, colX[8] + colWidths[8] - amountWidth - 5, y, 8);

      if (item.long_description) {
        y -= 10;
        drawText(
          item.long_description,
          colX[1],
          y,
          7,
          font,
          rgb(0.4, 0.4, 0.4),
        );
      }

      y -= 12;
      totalAmount += netValue;
    }

    y -= 5;
    const tableBottom = y;
    const tableHeight = tableTop - 15 - tableBottom;

    page.drawRectangle({
      x: 50,
      y: tableBottom,
      width: width - 100,
      height: tableHeight,
      borderColor: rgb(0, 0, 0),
      borderWidth: 1,
    });

    const drawLineVert = x => drawLine(x, tableTop - 15, x, tableBottom);

    drawLineVert(colX[1] - 2);
    drawLineVert(colX[2] - 2);
    drawLineVert(colX[3] - 2);
    drawLineVert(colX[4] - 2);
    drawLineVert(colX[5] - 2);
    drawLineVert(colX[6] - 2);
    drawLineVert(colX[7] - 2);
    drawLineVert(colX[8] - 2);

    // --- Totals Section ---
    y -= 20;

    const discount = parseFloat(header.discount || 0);
    const finalTotal = totalAmount - discount;
    const formatNum = n =>
      n.toLocaleString('en-PK', {
        minimumFractionDigits: 2,
        maximumFractionDigits: 2,
      });

    const labelX = 400;
    const valueX = 490;

    drawText('Discount', labelX, y, 8, boldFont);
    let valWidth = font.widthOfTextAtSize(formatNum(discount), 8);
    drawText(formatNum(discount), valueX + colWidths[8] - valWidth - 5, y, 8);
    y -= 12;

    drawText('QUOTATION TOTAL', labelX - 20, y, 9, boldFont);
    valWidth = boldFont.widthOfTextAtSize(formatNum(finalTotal), 9);
    drawText(
      formatNum(finalTotal),
      valueX + colWidths[8] - valWidth - 5,
      y,
      9,
      boldFont,
    );

    y -= 20;

    drawText(`Amount in words: ${numberToWords(finalTotal)}`, 50, y, 8);
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

    y -= 15;

    // --- Signatures ---
    const sigY = y;
    drawText('FAIZAN', 100, sigY);
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
