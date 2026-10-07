// Test document upload API
const fetch = require('node-fetch');
const FormData = require('form-data');
const fs = require('fs');
const path = require('path');

async function testDocumentUpload() {
  const companyId = '745518b7-aaf5-4976-a908-e16feb344a91';
  
  // Create a test PDF file (simulated)
  const testFilePath = path.join(__dirname, 'test_document.pdf');
  fs.writeFileSync(testFilePath, 'Test PDF content for document upload testing');
  
  const formData = new FormData();
  formData.append('file', fs.createReadStream(testFilePath));
  formData.append('docType', 'PAN Card');
  formData.append('companyId', companyId);
  
  try {
    console.log('Testing document upload API...');
    const response = await fetch('http://localhost:3000/api/upload-document', {
      method: 'POST',
      body: formData,
      headers: formData.getHeaders(),
    });
    
    const data = await response.json();
    
    if (response.ok) {
      console.log('✅ Upload successful!');
      console.log('File URL:', data.fileUrl);
      console.log('Filename:', data.filename);
      console.log('Doc Type:', data.docType);
    } else {
      console.log('❌ Upload failed:', data.error);
    }
  } catch (error) {
    console.error('Error:', error.message);
  } finally {
    // Cleanup
    if (fs.existsSync(testFilePath)) {
      fs.unlinkSync(testFilePath);
    }
  }
}

testDocumentUpload();
