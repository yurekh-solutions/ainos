// Convert DOC-20261015-WA0009 invoice to PDF
const { jsPDF } = require('jspdf');

const doc = new jsPDF();
const W = doc.internal.pageSize.getWidth();
const M = 15;
const contentW = W - 2 * M;

let y = 15;

// Header
doc.setFontSize(16);
doc.setFont('helvetica', 'bold');
doc.setTextColor(30, 30, 30);
doc.text('SKY. VISION & MULTIMEDIA', M, y);
y += 7;

doc.setFontSize(10);
doc.setFont('helvetica', 'normal');
doc.setTextColor(80, 80, 80);
doc.text('COMPLETE AUDIO & VIDEO SOLUTION', M, y);
y += 10;

// Office address
doc.setFontSize(8);
doc.setTextColor(100, 100, 100);
doc.text('Off: Sky Vision & Multimedia: Vithal Kung Bldg. No. 2, Office No. 10, 1st Floor, V.P. Road', M, y);
y += 5;
doc.text('Behind Sona Dairy, Andheri West. Pin Code: 400058', M, y);
y += 5;
doc.text('Branch Office: Shali Bhadra Nagar Bldg. No. 2, A/304, Near Swami Narayan Mandir, B.P. Cross', M, y);
y += 5;
doc.text('Cross Road 5, Bhayandar East (Dist: Thane) Pincode: 401105', M, y);
y += 5;
doc.text('Phone: 8655 973 366 / 9920 158 955', M, y);
y += 5;
doc.text('Email: sky.vision7518@yahoo.in  |  Website: www.skyav.in', M, y);
y += 10;

// Separator
doc.setDrawColor(200, 200, 200);
doc.setLineWidth(0.5);
doc.line(M, y, W - M, y);
y += 8;

// Consignee
doc.setFontSize(9);
doc.setFont('helvetica', 'bold');
doc.setTextColor(30, 30, 30);
doc.text('Consignee:', M, y);
y += 6;

doc.setFont('helvetica', 'normal');
doc.setFontSize(10);
doc.text('Sanhita Creations', M, y);
y += 5;
doc.setFontSize(8);
doc.setTextColor(100, 100, 100);
doc.text('E/603 Timber Green Park Co-Hsg Society, Ketakipada Road,', M, y);
y += 5;
doc.text('Before Dahisar Tollnaka, Dahisar East, Mumbai 400068.', M, y);
y += 5;
doc.text('PAN No: AOQPP2819A', M, y);
y += 5;
doc.text('GST No: 27AOQPP2819A1Z', M, y);
y += 10;

// Invoice details
doc.setFontSize(9);
doc.setFont('helvetica', 'bold');
doc.setTextColor(30, 30, 30);
doc.text('Invoice No: 156', M, y);
doc.text('Date: 21.8.2026', W - M - 50, y);
y += 10;

// Table header
doc.setFillColor(240, 240, 240);
doc.rect(M, y - 4, contentW, 8, 'F');
doc.setFontSize(8);
doc.setFont('helvetica', 'bold');
doc.setTextColor(30, 30, 30);
doc.text('Sr. No.', M + 2, y + 1);
doc.text('Description', M + 15, y + 1);
doc.text('Days/No.', M + 100, y + 1);
doc.text('Rate Per Day', M + 120, y + 1);
doc.text('Amount', M + 150, y + 1);
y += 10;

// Items
doc.setFont('helvetica', 'normal');
doc.setFontSize(9);
doc.setTextColor(50, 50, 50);

// Item 1
doc.text('1', M + 2, y);
doc.text('576 sqft LED Screen on Hire', M + 15, y);
doc.text('1', M + 105, y);
doc.text('70,000/-', M + 120, y);
doc.text('70,000/-', M + 150, y);
y += 8;

// Item 2
doc.text('2', M + 2, y);
doc.text('50 Inches TV on Hire', M + 15, y);
doc.text('1', M + 105, y);
doc.text('5,000/-', M + 120, y);
doc.text('5,000/-', M + 150, y);
y += 12;

// Separator
doc.setDrawColor(200, 200, 200);
doc.line(M, y, W - M, y);
y += 8;

// Totals
doc.setFontSize(10);
doc.setFont('helvetica', 'bold');
doc.setTextColor(30, 30, 30);
doc.text('Total: 75,000/-', W - M - 50, y);
y += 8;
doc.text('Amount Received: 30,000/-', W - M - 60, y);
y += 8;
doc.text('Balance Amount: 40,000/-', W - M - 60, y);
y += 15;

// Terms
doc.setFontSize(8);
doc.setFont('helvetica', 'normal');
doc.setTextColor(100, 100, 100);
doc.text('Terms & Conditions:', M, y);
y += 5;
doc.text('1. Payment will be accepted by cheque or cash.', M, y);
y += 5;
doc.text('2. We are not responsible for any technical problem.', M, y);
y += 5;
doc.text('3. PAN Card No: AFXPJ4807L', M, y);
y += 15;

// Signature
doc.setFontSize(9);
doc.setFont('helvetica', 'bold');
doc.setTextColor(30, 30, 30);
doc.text('For SKY. VISION & MULTIMEDIA', W - M - 60, y);
y += 20;
doc.text('(Suresh Jaiswal)', W - M - 50, y);

// Save
const path = require('path');
const outPath = path.join(__dirname, 'SKY_VISION_Invoice_156.pdf');
doc.save(outPath);
console.log('PDF created:', outPath);
