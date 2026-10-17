# AINOS Template Extractor Service

Python Flask service for extracting invoice template designs from PDFs.

## Features

- 📄 PDF upload and parsing
- 🎨 Color scheme detection
- 📐 Layout structure analysis
-  Font style detection
- 📊 Table column extraction
- ✅ Returns structured template JSON

## Installation

```bash
cd template-extractor
pip install -r requirements.txt
```

## Local Development

```bash
python app.py
```

Service runs on `http://localhost:5002`

## API Endpoints

### Health Check
```
GET /
GET /api/v1/health
```

### Extract Template
```
POST /api/v1/extract
Content-Type: multipart/form-data

Body:
  - file: PDF file (max 16MB)

Response:
{
  "success": true,
  "template": {
    "companyName": "...",
    "tagline": "...",
    "colorScheme": "professional",
    "primaryColor": "#...",
    "fontFamily": "sans-serif",
    "tableColumns": [...],
    "sections": {...}
  }
}
```

## Deployment (Render)

1. Create new Web Service on Render
2. Connect repository
3. Set build command: `pip install -r requirements.txt`
4. Set start command: `python app.py`
5. Add environment variable: `PORT=10000`

## Integration with AINOS

Set environment variable in AINOS:
```
TEMPLATE_EXTRACTOR_URL=https://ainos-template-extractor.onrender.com
```

AINOS will call this service when users upload invoice templates.

## Dependencies

- Flask 3.0.0
- pdfplumber 0.10.3 (PDF parsing)
- Pillow 10.1.0 (Image/color analysis)
- uvicorn 0.24.0 (Production server)

## License

Private - AINOS Project
