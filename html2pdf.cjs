const puppeteer = require('puppeteer');
const path = require('path');

(async () => {
  const browser = await puppeteer.launch({
    headless: 'new',
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
  });

  const files = [
    { html: 'scripts/AINOS_DB_FLOWCHART.html', pdf: 'AINOS_DB_FLOWCHART.pdf' },
  ];

  for (const f of files) {
    const page = await browser.newPage();
    const htmlPath = path.join(__dirname, f.html);
    const pdfPath = path.join(__dirname, f.pdf);

    await page.goto('file:///' + htmlPath.replace(/\\/g, '/'), {
      waitUntil: 'networkidle0',
      timeout: 30000,
    });

    await page.pdf({
      path: pdfPath,
      format: 'A4',
      printBackground: true,
      margin: { top: '10mm', bottom: '10mm', left: '8mm', right: '8mm' },
      displayHeaderFooter: false,
    });

    console.log('✅ ' + f.pdf + ' generated');
    await page.close();
  }

  await browser.close();
  console.log('\n🎉 Both PDFs ready!');
})();
