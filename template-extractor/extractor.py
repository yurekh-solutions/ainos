"""
PDF Template Extractor - Extracts design and structure from invoice PDFs
"""
import pdfplumber
from PIL import Image
import io
import re
from collections import Counter


def extract_text_and_layout(pdf_file):
    """Extract text, positions, and structure from PDF"""
    pages_data = []
    
    with pdfplumber.open(pdf_file) as pdf:
        for page_num, page in enumerate(pdf.pages):
            page_info = {
                'width': page.width,
                'height': page.height,
                'text': page.extract_text() or '',
                'words': page.extract_words() or [],
                'tables': page.extract_tables() or [],
                'lines': page.lines or [],
                'rects': page.rects or [],
            }
            pages_data.append(page_info)
    
    return pages_data


def detect_colors_from_pdf(pdf_file):
    """Extract dominant colors from PDF pages"""
    colors = []
    
    try:
        with pdfplumber.open(pdf_file) as pdf:
            for page in pdf.pages[:2]:  # Check first 2 pages
                # Get page as image
                img = page.to_image(resolution=150)
                pil_img = img.original
                
                # Sample colors from the image
                pil_img = pil_img.convert('RGB')
                pixels = list(pil_img.getdata())
                
                # Get top 10 most common colors
                color_counts = Counter(pixels)
                top_colors = color_counts.most_common(10)
                
                for color, count in top_colors:
                    colors.append({
                        'rgb': color,
                        'hex': '#{:02x}{:02x}{:02x}'.format(*color),
                        'frequency': count / len(pixels)
                    })
    except Exception as e:
        print(f"Color detection error: {e}")
    
    return colors[:5]  # Return top 5 colors


def analyze_structure(pages_data):
    """Analyze PDF structure to identify sections"""
    structure = {
        'has_header': False,
        'has_footer': False,
        'has_table': False,
        'has_logo_area': False,
        'header_position': 'top',
        'table_position': 'middle',
        'footer_position': 'bottom',
    }
    
    for page in pages_data:
        words = page['words']
        tables = page['tables']
        height = page['height']
        
        # Check for header (text in top 20% of page)
        header_words = [w for w in words if float(w['top']) < height * 0.2]
        if len(header_words) > 3:
            structure['has_header'] = True
        
        # Check for footer (text in bottom 20% of page)
        footer_words = [w for w in words if float(w['top']) > height * 0.8]
        if len(footer_words) > 2:
            structure['has_footer'] = True
        
        # Check for tables
        if len(tables) > 0:
            structure['has_table'] = True
        
        # Check for logo area (large empty space or image placeholder in header)
        if structure['has_header']:
            header_rects = [r for r in page['rects'] if float(r['top']) < height * 0.2]
            if header_rects:
                structure['has_logo_area'] = True
    
    return structure


def extract_template_info(text):
    """Extract template-related information from text"""
    info = {
        'company_name': '',
        'tagline': '',
        'address': '',
        'contact': '',
        'has_invoice_number': False,
        'has_date': False,
        'has_items_table': False,
        'has_total': False,
        'has_terms': False,
        'has_signature': False,
    }
    
    # Detect company name (usually first line, capitalized)
    lines = text.split('\n')
    if lines:
        first_line = lines[0].strip()
        if first_line and len(first_line) > 3:
            info['company_name'] = first_line
    
    # Detect tagline (second line often)
    if len(lines) > 1:
        second_line = lines[1].strip()
        if second_line and len(second_line) > 5 and len(second_line) < 100:
            info['tagline'] = second_line
    
    # Detect address block (multi-line address)
    address_lines = []
    for line in lines[2:10]:
        if re.search(r'(road|street|ave|building|floor|pin|code|mumbai|delhi|bangalore)', line, re.IGNORECASE):
            address_lines.append(line)
        elif len(address_lines) > 0 and len(line) > 10:
            address_lines.append(line)
        elif len(address_lines) > 2:
            break
    info['address'] = ' | '.join(address_lines[:3])
    
    # Detect contact info
    contact_patterns = [
        r'phone[:\s]*[\d\s\-/]+',
        r'email[:\s]*[\w\.\@]+',
        r'website[:\s]*[\w\.\:/]+',
        r'\d{4}[\s\-]?\d{3,4}[\s\-]?\d{3,4}',
    ]
    contacts = []
    for pattern in contact_patterns:
        matches = re.findall(pattern, text, re.IGNORECASE)
        contacts.extend(matches[:2])
    info['contact'] = '; '.join(contacts[:3])
    
    # Detect invoice elements
    info['has_invoice_number'] = bool(re.search(r'invoice\s*(no|number|#)', text, re.IGNORECASE))
    info['has_date'] = bool(re.search(r'\bdate\b', text, re.IGNORECASE))
    info['has_items_table'] = bool(re.search(r'(sr\.?\s*no|item|description|qty|quantity|rate|amount)', text, re.IGNORECASE))
    info['has_total'] = bool(re.search(r'(total|balance|amount\s*received)', text, re.IGNORECASE))
    info['has_terms'] = bool(re.search(r'terms\s*(and|&)\s*conditions', text, re.IGNORECASE))
    info['has_signature'] = bool(re.search(r'(signature|sign|for\s+[A-Z])', text, re.IGNORECASE))
    
    return info


def detect_font_style(text):
    """Detect font style characteristics"""
    style = {
        'primary': 'sans-serif',
        'size': 'medium',
        'weight': 'normal',
    }
    
    # Check for uppercase-heavy text (often indicates bold/strong font)
    uppercase_ratio = sum(1 for c in text if c.isupper()) / max(len(text), 1)
    if uppercase_ratio > 0.3:
        style['weight'] = 'bold'
    
    # Check text length for size estimation
    avg_line_length = sum(len(line) for line in text.split('\n') if line) / max(text.count('\n'), 1)
    if avg_line_length > 80:
        style['size'] = 'small'
    elif avg_line_length < 40:
        style['size'] = 'large'
    
    return style


def detect_color_scheme(colors):
    """Determine color scheme from extracted colors"""
    if not colors:
        return {
            'primary': '#000000',
            'secondary': '#666666',
            'accent': '#000000',
            'background': '#ffffff',
            'scheme': 'monochrome'
        }
    
    # Filter out white/black for scheme detection
    non_neutral = [c for c in colors if not (c['rgb'] == (255, 255, 255) or c['rgb'] == (0, 0, 0))]
    
    if not non_neutral:
        return {
            'primary': '#000000',
            'secondary': '#666666',
            'accent': '#333333',
            'background': '#ffffff',
            'scheme': 'monochrome'
        }
    
    # Use most frequent non-neutral color as primary
    primary = non_neutral[0]['hex']
    secondary = non_neutral[1]['hex'] if len(non_neutral) > 1 else '#666666'
    
    # Determine scheme type
    scheme = 'professional'
    if any(c['rgb'][0] > 200 and c['rgb'][1] < 100 for c in non_neutral[:3]):
        scheme = 'warm'
    elif any(c['rgb'][2] > 200 and c['rgb'][0] < 100 for c in non_neutral[:3]):
        scheme = 'cool'
    elif all(c['rgb'][0] < 50 and c['rgb'][1] < 50 and c['rgb'][2] < 50 for c in non_neutral[:3]):
        scheme = 'monochrome'
    
    return {
        'primary': primary,
        'secondary': secondary,
        'accent': primary,
        'background': '#ffffff',
        'scheme': scheme
    }


def extract_table_columns(tables):
    """Extract table column structure"""
    if not tables:
        return []
    
    # Use first table
    table = tables[0]
    if not table or not table[0]:
        return []
    
    headers = table[0]
    columns = []
    
    for idx, header in enumerate(headers):
        if header:
            columns.append({
                'name': str(header).strip(),
                'key': f'col_{idx}',
                'width': round(100 / len(headers), 1)
            })
    
    return columns


def extract_template(pdf_file):
    """Main extraction function - returns complete template data"""
    # Extract text and layout
    pages_data = extract_text_and_layout(pdf_file)
    
    # Combine all text
    full_text = '\n'.join(page['text'] for page in pages_data)
    
    # Detect colors
    colors = detect_colors_from_pdf(pdf_file)
    
    # Analyze structure
    structure = analyze_structure(pages_data)
    
    # Extract template info
    template_info = extract_template_info(full_text)
    
    # Detect font style
    font_style = detect_font_style(full_text)
    
    # Detect color scheme
    color_scheme = detect_color_scheme(colors)
    
    # Extract table columns
    all_tables = []
    for page in pages_data:
        all_tables.extend(page['tables'])
    table_columns = extract_table_columns(all_tables)
    
    # Build template response
    template = {
        'success': True,
        'template': {
            'companyName': template_info['company_name'],
            'tagline': template_info['tagline'],
            'headerText': f"{template_info['company_name']} {template_info['tagline']}".strip(),
            'addressBlock': template_info['address'],
            'contactInfo': template_info['contact'],
            'colorScheme': color_scheme['scheme'],
            'primaryColor': color_scheme['primary'],
            'secondaryColor': color_scheme['secondary'],
            'accentColor': color_scheme['accent'],
            'backgroundColor': color_scheme['background'],
            'fontFamily': font_style['primary'],
            'fontSize': font_style['size'],
            'fontWeight': font_style['weight'],
            'layout': 'professional',
            'headerLayout': 'stacked' if structure['has_header'] else 'side-by-side',
            'tableColumns': table_columns if table_columns else [
                {'name': 'Sr. No', 'key': 'srNo', 'width': 10},
                {'name': 'Description', 'key': 'description', 'width': 40},
                {'name': 'Qty', 'key': 'qty', 'width': 15},
                {'name': 'Rate', 'key': 'rate', 'width': 15},
                {'name': 'Amount', 'key': 'amount', 'width': 20}
            ],
            'sections': {
                'hasHeader': structure['has_header'],
                'hasFooter': structure['has_footer'],
                'hasTable': structure['has_table'],
                'hasLogoArea': structure['has_logo_area'],
                'hasInvoiceNumber': template_info['has_invoice_number'],
                'hasDate': template_info['has_date'],
                'hasItemsTable': template_info['has_items_table'],
                'hasTotal': template_info['has_total'],
                'hasTerms': template_info['has_terms'],
                'hasSignature': template_info['has_signature'],
            },
            'termsText': 'Standard terms and conditions apply.',
            'signatureText': 'For [Company Name]',
        },
        'metadata': {
            'pages': len(pages_data),
            'totalTables': len(all_tables),
            'extractedColors': len(colors),
        }
    }
    
    return template
