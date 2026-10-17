"""
AINOS Template Extractor Service
Python Flask service for extracting invoice template designs from PDFs
"""
import os
from flask import Flask, request, jsonify
from flask_cors import CORS
from dotenv import load_dotenv
from extractor import extract_template

# Load environment variables
load_dotenv()

app = Flask(__name__)
CORS(app)  # Enable CORS for all routes

# Configuration
MAX_CONTENT_LENGTH = 16 * 1024 * 1024  # 16MB max file size
app.config['MAX_CONTENT_LENGTH'] = MAX_CONTENT_LENGTH


@app.route('/', methods=['GET'])
def health():
    """Health check endpoint"""
    return jsonify({
        'status': 'ok',
        'service': 'AINOS Template Extractor',
        'version': '1.0.0'
    })


@app.route('/api/v1/extract', methods=['POST'])
def extract():
    """
    Extract template design from uploaded PDF
    
    Expected: multipart/form-data with 'file' field containing PDF
    Returns: JSON with extracted template design
    """
    # Check if file was uploaded
    if 'file' not in request.files:
        return jsonify({
            'success': False,
            'error': 'No file uploaded. Please include a PDF file in the "file" field.'
        }), 400
    
    file = request.files['file']
    
    # Check if file is empty
    if file.filename == '':
        return jsonify({
            'success': False,
            'error': 'No file selected.'
        }), 400
    
    # Check file type
    if not file.filename.lower().endswith('.pdf'):
        return jsonify({
            'success': False,
            'error': 'Only PDF files are supported.'
        }), 400
    
    try:
        # Extract template from PDF
        template_data = extract_template(file)
        
        return jsonify(template_data), 200
        
    except Exception as e:
        print(f"Extraction error: {str(e)}")
        return jsonify({
            'success': False,
            'error': f'Failed to extract template: {str(e)}'
        }), 500


@app.route('/api/v1/health', methods=['GET'])
def health_check():
    """Detailed health check"""
    return jsonify({
        'status': 'healthy',
        'service': 'AINOS Template Extractor',
        'version': '1.0.0',
        'endpoints': {
            'POST /api/v1/extract': 'Extract template from PDF',
            'GET /api/v1/health': 'Health check'
        }
    })


@app.errorhandler(413)
def too_large(e):
    """Handle file too large error"""
    return jsonify({
        'success': False,
        'error': 'File too large. Maximum size is 16MB.'
    }), 413


@app.errorhandler(500)
def internal_error(e):
    """Handle internal server error"""
    return jsonify({
        'success': False,
        'error': 'Internal server error. Please try again later.'
    }), 500


if __name__ == '__main__':
    # Get port from environment variable (for Render deployment)
    port = int(os.environ.get('PORT', 5003))
    
    print(f"Starting AINOS Template Extractor on port {port}")
    print(f"Endpoints:")
    print(f"   GET  /              - Health check")
    print(f"   GET  /api/v1/health - Detailed health check")
    print(f"   POST /api/v1/extract - Extract template from PDF")
    print(f"")
    print(f"Ready to accept requests...")
    
    # Use waitress for production (WSGI server)
    try:
        from waitress import serve
        serve(app, host="0.0.0.0", port=port)
    except ImportError:
        # Fallback to Flask dev server
        app.run(host="0.0.0.0", port=port, debug=False)
