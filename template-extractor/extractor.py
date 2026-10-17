"""
PDF Template Extractor v2 - Full design extraction from invoice PDFs
Extracts: colors, fonts, layout, terms, signature, stamps, tables, structure
"""
import pdfplumber
from PIL import Image
import io
import re
import math
from collections import Counter


def extract_text_and_layout(pdf_file):
    """Extract text, positions, colors, and structure from PDF"""
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
                'chars': page.chars or [],
            }
            pages_data.append(page_info)

    return pages_data


def get_page_image_colors(pdf_file, max_pages=2):
    """Extract dominant brand colors from PDF page renders"""
    all_colors = []

    try:
        with pdfplumber.open(pdf_file) as pdf:
            for page in pdf.pages[:max_pages]:
                img = page.to_image(resolution=150)
                pil_img = img.original.convert('RGB')
                pixels = list(pil_img.getdata())

                # Filter out pure white and pure black only
                brand_pixels = []
                for p in pixels:
                    r, g, b = p
                    # Skip pure white (background)
                    if r > 245 and g > 245 and b > 245:
                        continue
                    # Skip pure black (text)
                    if r < 15 and g < 15 and b < 15:
                        continue
                    brand_pixels.append(p)

                if brand_pixels:
                    color_counts = Counter(brand_pixels)
                    top = color_counts.most_common(10)
                    for color, count in top:
                        all_colors.append({
                            'rgb': color,
                            'hex': '#{:02x}{:02x}{:02x}'.format(*color),
                            'frequency': count / len(brand_pixels)
                        })
    except Exception as e:
        print(f"Color detection error: {e}")

    return all_colors


def get_char_colors(pages_data):
    """Extract colors from individual character objects in PDF"""
    char_colors = []
    for page in pages_data:
        for char in page.get('chars', []):
            if 'non_stroking_color' in char:
                c = char['non_stroking_color']
                if isinstance(c, (tuple, list)) and len(c) >= 3:
                    r, g, b = int(c[0] * 255), int(c[1] * 255), int(c[2] * 255)
                    # Skip black and white
                    if not (r < 30 and g < 30 and b < 30):
                        if not (r > 230 and g > 230 and b > 230):
                            char_colors.append((r, g, b))
                elif isinstance(c, str):
                    # Hex color string
                    try:
                        c = c.lstrip('#')
                        if len(c) == 6:
                            r, g, b = int(c[0:2], 16), int(c[2:4], 16), int(c[4:6], 16)
                            if not (r < 30 and g < 30 and b < 30):
                                if not (r > 230 and g > 230 and b > 230):
                                    char_colors.append((r, g, b))
                    except:
                        pass
    return Counter(char_colors).most_common(10)


def detect_color_scheme(page_colors, char_colors):
    """Determine actual color scheme from PDF"""
    # Combine both sources, prioritize char colors (more accurate)
    combined = []

    if char_colors:
        for color, count in char_colors[:5]:
            combined.append({
                'rgb': color,
                'hex': '#{:02x}{:02x}{:02x}'.format(*color),
                'frequency': count
            })

    if not combined and page_colors:
        combined = page_colors[:5]

    if not combined:
        return {
            'primary': '#1a1a2e',
            'secondary': '#16213e',
            'accent': '#0f3460',
            'background': '#ffffff',
            'scheme': 'professional',
            'isMonochrome': True
        }

    primary = combined[0]
    secondary = combined[1] if len(combined) > 1 else primary
    accent = combined[2] if len(combined) > 2 else primary

    # Detect scheme type from actual colors
    r, g, b = primary['rgb']
    scheme = 'professional'

    # Check if it's a blue scheme
    if b > r and b > g:
        scheme = 'corporate-blue'
    # Red/warm scheme
    elif r > 150 and g < 100:
        scheme = 'bold-red'
    # Green scheme
    elif g > r and g > b:
        scheme = 'nature-green'
    # Purple scheme
    elif r > 100 and b > 150 and g < r:
        scheme = 'royal-purple'
    # Orange scheme
    elif r > 180 and g > 100 and b < 100:
        scheme = 'warm-orange'
    # Dark/monochrome
    elif r < 80 and g < 80 and b < 80:
        scheme = 'monochrome'

    return {
        'primary': primary['hex'],
        'secondary': secondary['hex'],
        'accent': accent['hex'],
        'background': '#ffffff',
        'scheme': scheme,
        'isMonochrome': scheme == 'monochrome',
        'extractedColors': [c['hex'] for c in combined[:6]]
    }


def detect_font_from_chars(pages_data):
    """Detect actual font names from PDF character objects"""
    font_counter = Counter()

    for page in pages_data:
        for char in page.get('chars', []):
            fontname = char.get('fontname', '')
            if fontname:
                # Normalize font name
                fontname = fontname.split('+')[-1] if '+' in fontname else fontname
                fontname = fontname.split(',')[-1].strip()
                # Remove size/encoding suffixes
                fontname = re.sub(r'[,\-].*$', '', fontname)
                font_counter[fontname] += 1

    if font_counter:
        top_fonts = font_counter.most_common(5)
        primary_font = top_fonts[0][0]

        # Map to web-safe font
        font_map = {
            'Arial': 'Arial, sans-serif',
            'Helvetica': 'Helvetica, Arial, sans-serif',
            'Times': 'Times New Roman, serif',
            'TimesNewRoman': 'Times New Roman, serif',
            'Courier': 'Courier New, monospace',
            'Calibri': 'Calibri, sans-serif',
            'Georgia': 'Georgia, serif',
            'Verdana': 'Verdana, sans-serif',
            'Trebuchet': 'Trebuchet MS, sans-serif',
            'Palatino': 'Palatino Linotype, serif',
            'Garamond': 'Garamond, serif',
            'Roboto': 'Roboto, sans-serif',
            'OpenSans': 'Open Sans, sans-serif',
            'Lato': 'Lato, sans-serif',
            'Montserrat': 'Montserrat, sans-serif',
            'Poppins': 'Poppins, sans-serif',
        }

        # Try to match
        for key, web_font in font_map.items():
            if key.lower() in primary_font.lower():
                return {
                    'primary': web_font,
                    'rawFontName': primary_font,
                    'allFonts': [f[0] for f in top_fonts[:5]]
                }

        # Check if serif or sans-serif from name
        is_serif = any(s in primary_font.lower() for s in ['serif', 'times', 'georgia', 'garamond', 'palatino', 'book'])
        family = 'serif' if is_serif else 'sans-serif'

        return {
            'primary': f'{primary_font}, {family}',
            'rawFontName': primary_font,
            'allFonts': [f[0] for f in top_fonts[:5]]
        }

    return {
        'primary': 'sans-serif',
        'rawFontName': 'unknown',
        'allFonts': []
    }


def detect_font_weight(pages_data):
    """Detect font weight from character stroke widths"""
    weights = []
    for page in pages_data:
        for char in page.get('chars', []):
            width = char.get('width', 0)
            height = char.get('height', 0)
            if height > 0:
                ratio = width / height
                weights.append(ratio)

    if not weights:
        return 'normal'

    avg_ratio = sum(weights) / len(weights)
    # Higher ratio = bolder/wider characters
    if avg_ratio > 0.65:
        return 'bold'
    elif avg_ratio > 0.55:
        return 'semibold'
    return 'normal'


def detect_font_size(pages_data):
    """Detect font sizes used in the PDF"""
    sizes = []
    for page in pages_data:
        for char in page.get('chars', []):
            size = char.get('size', 0)
            if size > 0:
                sizes.append(round(size, 1))

    if not sizes:
        return {'heading': 18, 'body': 11, 'small': 9}

    size_counts = Counter(sizes)
    most_common_sizes = size_counts.most_common(5)

    # Sort by size
    sorted_sizes = sorted([s[0] for s in most_common_sizes])

    return {
        'heading': max(sorted_sizes) if sorted_sizes else 18,
        'subheading': sorted_sizes[-2] if len(sorted_sizes) > 1 else 14,
        'body': sorted_sizes[0] if sorted_sizes else 11,
        'small': min(sorted_sizes) if sorted_sizes else 9,
        'allSizes': sorted(set(sizes))[:10]
    }


def extract_terms_and_signature(text):
    """Extract actual terms & conditions and signature block from PDF text"""
    terms_text = ''
    signature_text = ''

    lines = text.split('\n')

    # Extract terms & conditions
    in_terms = False
    terms_lines = []
    for i, line in enumerate(lines):
        stripped = line.strip()
        if re.search(r'terms\s*(and|&)\s*conditions', stripped, re.IGNORECASE):
            in_terms = True
            continue
        if in_terms:
            # Stop at "For COMPANY" signature line (but NOT at "For" inside a numbered term)
            if re.match(r'^For\s+[A-Z]', stripped):
                break
            # Stop at authorized signatory
            if re.search(r'authorized\s*signatory', stripped, re.IGNORECASE):
                break
            # Stop at bank details or QR code section
            if re.search(r'(bank\s*details|account\s*number|ifsc|qr\s*code|scan\s*to\s*pay)', stripped, re.IGNORECASE):
                break
            # Stop at place and date line
            if re.match(r'^Place[:\s]', stripped, re.IGNORECASE):
                break
            # Collect ALL non-empty lines (including numbered items like "3. PAN Card No")
            if stripped:
                terms_lines.append(stripped)
            # Allow ONE empty line between terms (don't break on single blank)
            # Only break on 2+ consecutive empty lines
            if not stripped and len(terms_lines) > 0:
                # Check if next non-empty line is still a term (numbered)
                remaining = [l.strip() for l in lines[i+1:] if l.strip()]
                if remaining and not re.match(r'^\d+[\.\)]', remaining[0]):
                    break

    if terms_lines:
        terms_text = '\n'.join(terms_lines[:20])

    # Extract signature block - look for "For COMPANY" pattern first (most common in Indian invoices)
    sig_patterns = [
        r'^For\s+[A-Z][a-zA-Z\s&\.]+(?:pvt|ltd|private|limited)?\.?',
        r'(authorized\s*signatory)',
        r'(proprietor|director|partner)',
        r'(signature\s*(of|block)?)',
        r'(sign\s*here)',
        r'(place\s*(and|&)\s*date)',
    ]

    for i, line in enumerate(lines):
        for pattern in sig_patterns:
            if re.search(pattern, line, re.IGNORECASE):
                # Collect signature block (next 3-5 lines)
                sig_lines = [line.strip()]
                for j in range(1, 5):
                    if i + j < len(lines) and lines[i + j].strip():
                        next_line = lines[i + j].strip()
                        # Stop if we hit terms/conditions/bank details
                        if re.search(r'(terms|bank|account|ifsc|gst|pan\s*card)', next_line, re.IGNORECASE):
                            break
                        sig_lines.append(next_line)
                    else:
                        break
                signature_text = '\n'.join(sig_lines)
                break
        if signature_text:
            break

    # Fallback: check last few lines for signature-like content
    if not signature_text:
        last_lines = [l.strip() for l in lines[-10:] if l.strip()]
        for line in last_lines:
            if re.search(r'(for\s+[A-Z]|thank\s*you|yours\s*faithfully|regards)', line, re.IGNORECASE):
                idx = lines.index(line)
                sig_lines = [line]
                for j in range(1, 4):
                    if idx + j < len(lines) and lines[idx + j].strip():
                        sig_lines.append(lines[idx + j].strip())
                signature_text = '\n'.join(sig_lines)
                break

    return terms_text, signature_text


def extract_bank_details(text):
    """Extract bank account details from PDF"""
    bank_info = {}
    lines = text.split('\n')
    full_text = text

    # Bank name
    bank_match = re.search(r'(?:bank\s*(?:name)?|banker)[:\s]*([A-Z][a-zA-Z\s&]+(?:bank|banking)?)', full_text, re.IGNORECASE)
    if bank_match:
        bank_info['bankName'] = bank_match.group(1).strip()

    # Account number
    acc_match = re.search(r'(?:account\s*(?:no|number|#)|a\/c\s*(?:no|number)?)[:\s]*([\d\s\-/]+)', full_text, re.IGNORECASE)
    if acc_match:
        bank_info['accountNumber'] = acc_match.group(1).strip()

    # IFSC code
    ifsc_match = re.search(r'(?:ifsc\s*(?:code)?)[:\s]*([A-Z]{4}0[A-Z0-9]{6})', full_text, re.IGNORECASE)
    if ifsc_match:
        bank_info['ifscCode'] = ifsc_match.group(1).strip()

    # GST number (14-15 chars)
    gst_match = re.search(r'(?:gst\s*(?:in|number)|gstin)[:\s]*([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z0-9]{3,4})', full_text, re.IGNORECASE)
    if gst_match:
        gst_num = gst_match.group(1).strip()
        if len(gst_num) in (14, 15):
            bank_info['gstNumber'] = gst_num

    # PAN
    pan_match = re.search(r'(?:pan\s*(?:number)?|pan)[:\s]*([A-Z]{5}[0-9]{4}[A-Z]{1})', full_text, re.IGNORECASE)
    if pan_match:
        bank_info['panNumber'] = pan_match.group(1).strip()

    # UPI ID
    upi_match = re.search(r'(?:upi\s*(?:id)?)[:\s]*([\w\.\-]+@[\w]+)', full_text, re.IGNORECASE)
    if upi_match:
        bank_info['upiId'] = upi_match.group(1).strip()

    return bank_info


def analyze_structure(pages_data, full_text):
    """Deep structure analysis of PDF layout"""
    structure = {
        'has_header': False,
        'has_footer': False,
        'has_table': False,
        'has_logo_area': False,
        'has_accent_bar': False,
        'has_border': False,
        'has_watermark': False,
        'header_position': 'top',
        'header_style': 'centered',
        'table_position': 'middle',
        'footer_position': 'bottom',
        'layout_type': 'standard',
    }

    for page in pages_data:
        words = page['words']
        tables = page['tables']
        rects = page['rects']
        lines = page['lines']
        height = page['height']
        width = page['width']

        # Header detection (top 20%)
        header_words = [w for w in words if float(w['top']) < height * 0.2]
        if len(header_words) > 2:
            structure['has_header'] = True
            # Check if centered or left-aligned
            header_x_positions = [float(w['x0']) for w in header_words]
            if header_x_positions:
                avg_x = sum(header_x_positions) / len(header_x_positions)
                if abs(avg_x - width / 2) < width * 0.15:
                    structure['header_style'] = 'centered'
                elif avg_x < width * 0.3:
                    structure['header_style'] = 'left'
                else:
                    structure['header_style'] = 'right'

        # Footer detection (bottom 20%)
        footer_words = [w for w in words if float(w['top']) > height * 0.8]
        if len(footer_words) > 1:
            structure['has_footer'] = True

        # Table detection (from pdfplumber or text)
        if tables and len(tables) > 0:
            structure['has_table'] = True
            for table in tables:
                if table:
                    structure['table_position'] = 'middle'
        elif re.search(r'sr\.?\s*(?:no|number)', full_text, re.IGNORECASE):
            # Detect table from text pattern (Sr. No, Description, etc.)
            structure['has_table'] = True
            structure['table_position'] = 'middle'

        # Logo area detection (rectangles in header)
        header_rects = [r for r in rects if float(r['top']) < height * 0.2]
        if header_rects:
            structure['has_logo_area'] = True

        # Accent bar detection (colored rectangles/bars)
        for rect in rects:
            w = float(rect.get('width', 0))
            h = float(rect.get('height', 0))
            # Wide thin bar = accent bar
            if w > width * 0.5 and h < 10:
                structure['has_accent_bar'] = True
            # Full page border
            if w > width * 0.9 and h > height * 0.9:
                structure['has_border'] = True

        # Line analysis for dividers
        for line_obj in lines:
            x0 = float(line_obj.get('x0', 0))
            x1 = float(line_obj.get('x1', 0))
            line_width = abs(x1 - x0)
            if line_width > width * 0.5:
                structure['has_accent_bar'] = True

    # Layout type detection
    if structure['has_accent_bar'] and structure['has_header']:
        structure['layout_type'] = 'modern'
    elif structure['has_border']:
        structure['layout_type'] = 'framed'
    elif structure['header_style'] == 'centered':
        structure['layout_type'] = 'classic'

    return structure


def extract_template_info(text):
    """Extract comprehensive template information from text"""
    info = {
        'company_name': '',
        'tagline': '',
        'address': '',
        'contact': '',
        'email': '',
        'phone': '',
        'website': '',
        'gst': '',
        'pan': '',
    }

    lines = text.split('\n')

    # Company name - first non-empty substantial line
    for line in lines[:5]:
        stripped = line.strip()
        if stripped and len(stripped) > 3 and len(stripped) < 100:
            # Skip lines that look like addresses or contact info
            if not re.search(r'(road|street|floor|pin|phone|email|tel|fax|mob)', stripped, re.IGNORECASE):
                info['company_name'] = stripped
                break

    # Tagline - line after company name, shorter, descriptive
    company_idx = None
    for i, line in enumerate(lines[:5]):
        if line.strip() == info['company_name']:
            company_idx = i
            break

    if company_idx is not None and company_idx + 1 < len(lines):
        next_line = lines[company_idx + 1].strip()
        if next_line and len(next_line) > 5 and len(next_line) < 120:
            if not re.search(r'(road|street|floor|pin|phone|email|tel|fax|mob|\d{4,})', next_line, re.IGNORECASE):
                info['tagline'] = next_line

    # Address block
    address_lines = []
    for line in lines:
        stripped = line.strip()
        if re.search(r'(off[:\s]|branch|road|street|ave|building|floor|pin\s*code|mumbai|delhi|bangalore|chennai|kolkata|pune|hyderabad|andheri|worli|bandra)', stripped, re.IGNORECASE):
            address_lines.append(stripped)
        elif len(address_lines) > 0 and len(stripped) > 10 and not re.search(r'(phone|email|tel|fax|mob|website)', stripped, re.IGNORECASE):
            address_lines.append(stripped)
        elif len(address_lines) > 3:
            break
    info['address'] = ' | '.join(address_lines[:4])

    # Contact info
    phone_match = re.search(r'(?:phone|tel|mob|mobile|call|contact|ph)[:\s]*([\+]?[\d\s\-\(\)]{8,})', text, re.IGNORECASE)
    if phone_match:
        info['phone'] = phone_match.group(1).strip()
    else:
        phone_match = re.search(r'(\d{4}[\s\-]?\d{3,4}[\s\-]?\d{3,4})', text)
        if phone_match:
            info['phone'] = phone_match.group(1).strip()

    email_match = re.search(r'([\w\.\+\-]+@[\w\.\-]+\.[a-z]{2,})', text, re.IGNORECASE)
    if email_match:
        info['email'] = email_match.group(1).strip()

    website_match = re.search(r'(?:website|web|www)[:\s]*(https?:\/\/[\w\.\-]+\.\w+)', text, re.IGNORECASE)
    if website_match:
        info['website'] = website_match.group(1).strip()
    else:
        website_match = re.search(r'(www\.[\w\.\-]+\.\w+)', text, re.IGNORECASE)
        if website_match:
            info['website'] = website_match.group(1).strip()

    # GST number (14-15 chars: 2 digit state + 10 char PAN + 1 entity + 1 default + 1 check)
    gst_match = re.search(r'([0-9]{2}[A-Z]{5}[0-9]{4}[A-Z0-9]{3,4})', text)
    if gst_match:
        gst_num = gst_match.group(1)
        if len(gst_num) in (14, 15):
            info['gst'] = gst_num

    # PAN
    pan_match = re.search(r'([A-Z]{5}[0-9]{4}[A-Z]{1})', text)
    if pan_match:
        info['pan'] = pan_match.group(1).strip()

    # Build contact string
    contact_parts = []
    if info['phone']:
        contact_parts.append(f"Phone: {info['phone']}")
    if info['email']:
        contact_parts.append(f"Email: {info['email']}")
    if info['website']:
        contact_parts.append(f"Web: {info['website']}")
    info['contact'] = ' | '.join(contact_parts)

    return info


def extract_table_columns(tables, text=''):
    """Extract table column structure from PDF tables or text"""
    # First try pdfplumber tables
    if tables:
        for table in tables:
            if not table or not table[0]:
                continue
            headers = table[0]
            columns = []
            for idx, header in enumerate(headers):
                if header and str(header).strip():
                    col_name = str(header).strip()
                    columns.append({
                        'name': col_name,
                        'key': re.sub(r'[^a-zA-Z0-9]', '', col_name.lower()) or f'col_{idx}',
                        'width': round(100 / len([h for h in headers if h and str(h).strip()]), 1)
                    })
            if columns:
                return columns

    # Fallback: parse table from text (for PDFs without proper table borders)
    if text:
        lines = text.split('\n')
        # Look for table header line containing common column names
        table_header_patterns = [
            r'sr\.?\s*(?:no|number)',
            r'(?:item|description)',
            r'(?:qty|quantity)',
            r'rate',
            r'amount',
        ]
        for line in lines:
            stripped = line.strip()
            # Check if this line looks like a table header
            if re.search(r'sr\.?\s*(?:no|number)', stripped, re.IGNORECASE):
                # Split by 2+ spaces (common table separator)
                parts = re.split(r'\s{2,}', stripped)
                if len(parts) >= 3:
                    columns = []
                    for idx, part in enumerate(parts):
                        part = part.strip()
                        if part:
                            columns.append({
                                'name': part,
                                'key': re.sub(r'[^a-zA-Z0-9]', '', part.lower()) or f'col_{idx}',
                                'width': round(100 / len(parts), 1)
                            })
                    if columns:
                        return columns
                # Try splitting by known column names
                col_names = re.findall(
                    r'(Sr\.?\s*(?:No|Number)|Description|Days|No\.|Rate|Per\s*Day|Amount|Qty|Quantity|Item|HSN|SAC|GST|Tax)',
                    stripped, re.IGNORECASE
                )
                if len(col_names) >= 3:
                    columns = []
                    for idx, name in enumerate(col_names):
                        columns.append({
                            'name': name.strip(),
                            'key': re.sub(r'[^a-zA-Z0-9]', '', name.lower()) or f'col_{idx}',
                            'width': round(100 / len(col_names), 1)
                        })
                    if columns:
                        return columns
                break

    return []


def extract_template(pdf_file):
    """Main extraction function - returns complete template data"""
    # Extract text and layout
    pages_data = extract_text_and_layout(pdf_file)

    # Combine all text
    full_text = '\n'.join(page['text'] for page in pages_data)

    # Detect colors from page renders
    page_colors = get_page_image_colors(pdf_file)

    # Detect colors from char objects (more precise)
    char_colors = get_char_colors(pages_data)

    # Detect font from char objects
    font_info = detect_font_from_chars(pages_data)
    font_weight = detect_font_weight(pages_data)
    font_sizes = detect_font_size(pages_data)

    # Build color scheme
    color_scheme = detect_color_scheme(page_colors, char_colors)

    # Analyze structure
    structure = analyze_structure(pages_data, full_text)

    # Extract template info
    template_info = extract_template_info(full_text)

    # Extract table columns
    all_tables = []
    for page in pages_data:
        all_tables.extend(page['tables'])
    table_columns = extract_table_columns(all_tables, full_text)

    # Extract terms and signature (ACTUALLY CALL THE FUNCTION NOW!)
    terms_text, signature_text = extract_terms_and_signature(full_text)

    # Extract bank details
    bank_details = extract_bank_details(full_text)

    # Detect sections from text
    sections = {
        'hasHeader': structure['has_header'],
        'hasFooter': structure['has_footer'],
        'hasTable': structure['has_table'],
        'hasLogoArea': structure['has_logo_area'],
        'hasAccentBar': structure['has_accent_bar'],
        'hasBorder': structure['has_border'],
        'hasInvoiceNumber': bool(re.search(r'invoice\s*(no|number|#|no\.)', full_text, re.IGNORECASE)),
        'hasDate': bool(re.search(r'\bdate\b', full_text, re.IGNORECASE)),
        'hasItemsTable': structure['has_table'],
        'hasTotal': bool(re.search(r'(total|balance|amount\s*(?:received|due)|grand\s*total)', full_text, re.IGNORECASE)),
        'hasTerms': bool(terms_text),
        'hasSignature': bool(signature_text),
        'hasBankDetails': bool(bank_details),
        'hasGST': bool(template_info['gst']),
        'hasPAN': bool(template_info['pan']),
        'hasQRCode': bool(re.search(r'(qr\s*code|scan\s*to\s*pay|upi\s*qr)', full_text, re.IGNORECASE)),
        'hasStamp': bool(re.search(r'(stamp|seal|company\s*seal|round\s*stamp)', full_text, re.IGNORECASE)),
    }

    # Build template response
    template = {
        'success': True,
        'template': {
            'companyName': template_info['company_name'],
            'tagline': template_info['tagline'],
            'headerText': f"{template_info['company_name']} {template_info['tagline']}".strip(),
            'addressBlock': template_info['address'],
            'contactInfo': template_info['contact'],
            'email': template_info['email'],
            'phone': template_info['phone'],
            'website': template_info['website'],
            'gstNumber': template_info['gst'],
            'panNumber': template_info['pan'],
            'colorScheme': color_scheme['scheme'],
            'primaryColor': color_scheme['primary'],
            'secondaryColor': color_scheme['secondary'],
            'accentColor': color_scheme['accent'],
            'backgroundColor': color_scheme['background'],
            'extractedColors': color_scheme.get('extractedColors', []),
            'isMonochrome': color_scheme.get('isMonochrome', False),
            'fontFamily': font_info['primary'],
            'rawFontName': font_info.get('rawFontName', ''),
            'allFonts': font_info.get('allFonts', []),
            'fontSize': font_sizes,
            'fontWeight': font_weight,
            'layout': structure['layout_type'],
            'headerLayout': structure['header_style'],
            'hasAccentBar': structure['has_accent_bar'],
            'hasBorder': structure['has_border'],
            'tableColumns': table_columns if table_columns else [
                {'name': 'Sr. No', 'key': 'srNo', 'width': 10},
                {'name': 'Description', 'key': 'description', 'width': 40},
                {'name': 'Qty', 'key': 'qty', 'width': 15},
                {'name': 'Rate', 'key': 'rate', 'width': 15},
                {'name': 'Amount', 'key': 'amount', 'width': 20}
            ],
            'sections': sections,
            'termsText': terms_text if terms_text else '',
            'signatureText': signature_text if signature_text else '',
            'bankDetails': bank_details,
        },
        'metadata': {
            'pages': len(pages_data),
            'totalTables': len(all_tables),
            'extractedColors': len(page_colors) + len(char_colors),
            'detectedFonts': len(font_info.get('allFonts', [])),
        }
    }

    return template
