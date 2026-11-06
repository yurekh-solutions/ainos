#!/usr/bin/env python3
"""
AINOS Business Card Scanner — 100% local / offline.

Flow: pick one or many card images (file picker) -> OpenCV preprocessing ->
Tesseract OCR (runs on your own machine, NO internet / NO API) -> heuristic
field extraction -> append to business_cards.xlsx -> auto-open the sheet.

Columns (exact format):
  Name | Designation | Company | Phone | Email | Website | Address | Source | Scanned At

Requirements (see requirements.txt):
  pip install -r requirements.txt
You also need the Tesseract OCR binary installed on your machine:
  Windows : https://github.com/UB-Mannheim/tesseract/wiki  (installer)
  macOS   : brew install tesseract
  Linux   : sudo apt install tesseract-ocr
Run:  python scan_cards.py     (or double-click scan_cards.bat on Windows)
"""

from __future__ import annotations

import os
import re
import sys
import shutil
import datetime as _dt

# ── Optional dependency handling (friendly errors, not tracebacks) ───────────
def _die(msg: str) -> None:
    print("\n[!] " + msg + "\n", file=sys.stderr)
    sys.exit(1)

try:
    import pytesseract
    from PIL import Image
except ImportError:
    _die("Missing Python packages. Run:  pip install -r requirements.txt")

try:
    import cv2
    import numpy as np
    _HAVE_CV2 = True
except ImportError:
    _HAVE_CV2 = False  # fall back to Pillow-only preprocessing

try:
    from openpyxl import Workbook, load_workbook
    from openpyxl.styles import Font, PatternFill, Alignment
    from openpyxl.utils import get_column_letter
except ImportError:
    _die("openpyxl not installed. Run:  pip install -r requirements.txt")

# ── Config ───────────────────────────────────────────────────────────────────
COLUMNS = ["Name", "Designation", "Company", "Phone", "Email", "Website",
           "Address", "Source", "Scanned At"]
COL_WIDTHS = [22, 22, 26, 20, 30, 28, 42, 26, 20]
EXCEL_NAME = "business_cards.xlsx"
IMAGE_TYPES = {"png", "jpg", "jpeg", "bmp", "tif", "tiff", "webp"}

EMAIL_RE = re.compile(r"[A-Za-z0-9._%+\-]+@[A-Za-z0-9.\-]+\.[A-Za-z]{2,}")
URL_RE = re.compile(
    r"(?:https?://)?(?:www\.)?[A-Za-z0-9\-]+\.[A-Za-z]{2,}(?:\.[A-Za-z]{2,})?(?:/[^\s]*)?",
    re.IGNORECASE,
)
# Indian mobile (opt. +91), plus generic long numbers.
PHONE_RE = re.compile(r"(?:\+?91[\s\-]?)?[6-9]\d{9}\b|\+\d{1,3}[\s\-]?\d[\d\s\-]{6,}\d")
PIN_RE = re.compile(r"\b\d{6}\b")
TITLE_RE = re.compile(
    r"\b(manager|directors?|ceo|cto|cfo|coo|founder|co-?founder|engineer|developer|"
    r"designer|analyst|head|president|chairman|executive|consultant|officer|lead|"
    r"specialist|associate|partner|architect|accountant|ca\b|advocate|director)\b",
    re.IGNORECASE,
)
COMPANY_RE = re.compile(
    r"\b(pvt|private|ltd|limited|llp|inc|incorporated|corp|corporation|technologies|"
    r"technology|solutions|systems|services|software|group|enterprises?|industries|"
    r"company|consultants?|foundation|labs?|works|ventures|holdings?)\b",
    re.IGNORECASE,
)
ADDR_RE = re.compile(
    r"\b(road|street|st\b|lane|nagar|sector|floor|block|near|behind|opposite|"
    r"industrial|estate|city|district|dist\b|pin|pincode|kolkata|mumbai|delhi|"
    r"bengaluru|bangalore|hyderabad|chennai|pune|ahmedabad|gurgaon|ghaziabad|noida)\b",
    re.IGNORECASE,
)


# ── Tesseract binary discovery (Windows installers don't add to PATH) ────────
def configure_tesseract() -> None:
    if shutil.which("tesseract"):
        return
    candidates = [
        r"C:\Program Files\Tesseract-OCR\tesseract.exe",
        r"C:\Program Files (x86)\Tesseract-OCR\tesseract.exe",
        os.path.expandvars(r"%LOCALAPPDATA%\Programs\Tesseract-OCR\tesseract.exe"),
        "/opt/homebrew/bin/tesseract",
        "/usr/bin/tesseract",
        "/usr/local/bin/tesseract",
    ]
    for c in candidates:
        if c and os.path.isfile(c):
            pytesseract.pytesseract.tesseract_cmd = c
            return
    _die("Tesseract binary not found. Install it (see the note at the top of this "
         "file) or add it to your PATH, then run again.")


# ── Image preprocessing ──────────────────────────────────────────────────────
def preprocess(path: str):
    """Return a cleaned PIL image for OCR. Uses OpenCV when available."""
    if _HAVE_CV2:
        img = cv2.imread(path, cv2.IMREAD_COLOR)
        if img is None:
            return Image.open(path).convert("L")
        gray = cv2.cvtColor(img, cv2.COLOR_BGR2GRAY)
        # upscale small captures so digits read cleanly
        h, w = gray.shape
        if max(h, w) < 1400:
            scale = 1600 / max(h, w)
            gray = cv2.resize(gray, None, fx=scale, fy=scale, interpolation=cv2.INTER_CUBIC)
        gray = cv2.fastNlMeansDenoising(gray, None, 10, 7, 21)
        gray = cv2.convertScaleAbs(gray, alpha=1.25, beta=5)  # contrast
        _, thresh = cv2.threshold(gray, 0, 255, cv2.THRESH_BINARY + cv2.THRESH_OTSU)
        return Image.fromarray(thresh)
    # Pillow-only fallback
    im = Image.open(path)
    w, h = im.size
    if max(w, h) < 1400:
        scale = 1600 / max(w, h)
        im = im.resize((int(w * scale), int(h * scale)), Image.LANCZOS)
    return im.convert("L").point(lambda p: 0 if p < 128 else 255)


def ocr_lines(path: str) -> list[str]:
    configure_tesseract()
    clean = preprocess(path)
    text = pytesseract.image_to_string(clean, config="--psm 6")
    lines = [ln.strip() for ln in text.splitlines()]
    return [ln for ln in lines if ln]


# ── Field extraction (heuristic) ─────────────────────────────────────────────
def _uniq_join(vals: list[str]) -> str:
    seen: list[str] = []
    for v in vals:
        v = v.strip()
        if v and v not in seen:
            seen.append(v)
    return " / ".join(seen)


def _looks_like_name(line: str) -> bool:
    if not line or any(ch.isdigit() for ch in line) or "@" in line:
        return False
    if COMPANY_RE.search(line) or TITLE_RE.search(line) or ADDR_RE.search(line):
        return False
    words = line.split()
    if not (1 < len(words) <= 4):
        return False
    return all(re.match(r"[A-Za-z][A-Za-z.\-']+$|^[A-Z]\.?$", w) for w in words)


def extract_fields(lines: list[str]) -> dict:
    blob = "\n".join(lines)

    emails = _uniq_join(EMAIL_RE.findall(blob))
    # websites: strip emails first so their domains aren't matched as URLs
    no_email = EMAIL_RE.sub(" ", blob)
    urls = [u for u in URL_RE.findall(no_email) if "." in u and not u.startswith("@")]
    websites = _uniq_join([u for u in urls if re.search(r"\.[A-Za-z]{2,}", u)])
    phones = _uniq_join([re.sub(r"\s+", " ", p).strip() for p in PHONE_RE.findall(no_email)])

    designation = ""
    company = ""
    address = ""
    name = ""
    used = set()

    for i, ln in enumerate(lines):
        low = ln.lower()
        if not designation and TITLE_RE.search(low):
            designation = ln
            used.add(i)
        elif not company and COMPANY_RE.search(low):
            company = ln
            used.add(i)

    # address: a line with a 6-digit pin or street keywords (excluding phone-only lines)
    for i, ln in enumerate(lines):
        if i in used:
            continue
        if (PIN_RE.search(ln) or ADDR_RE.search(ln)) and not EMAIL_RE.search(ln):
            address = ln
            used.add(i)
            break

    # name: first plausible personal-name line, top-down
    for i, ln in enumerate(lines):
        if i in used or PHONE_RE.fullmatch(ln):
            continue
        if _looks_like_name(ln):
            name = ln
            used.add(i)
            break

    # if no company suffix found, take a short prominent line that isn't used
    if not company:
        for i, ln in enumerate(lines):
            if i in used:
                continue
            words = ln.split()
            if 1 <= len(words) <= 4 and not any(ch.isdigit() for ch in ln) and not EMAIL_RE.search(ln):
                company = ln
                used.add(i)
                break

    return {
        "Name": name,
        "Designation": designation,
        "Company": company,
        "Phone": phones,
        "Email": emails,
        "Website": websites,
        "Address": address,
    }


# ── Excel ────────────────────────────────────────────────────────────────────
def excel_path() -> str:
    return os.path.join(os.path.dirname(os.path.abspath(__file__)), EXCEL_NAME)


def append_to_excel(rows: list[dict]) -> str:
    path = excel_path()
    if os.path.exists(path):
        wb = load_workbook(path)
        ws = wb.active
    else:
        wb = Workbook()
        ws = wb.active
        ws.title = "Business Cards"
        ws.append(COLUMNS)
        head_fill = PatternFill("solid", fgColor="4C1D95")
        for c in range(1, len(COLUMNS) + 1):
            cell = ws.cell(row=1, column=c)
            cell.font = Font(bold=True, color="FFFFFF")
            cell.fill = head_fill
            cell.alignment = Alignment(vertical="center")
            ws.column_dimensions[get_column_letter(c)].width = COL_WIDTHS[c - 1]
        ws.freeze_panes = "A2"

    stamp = _dt.datetime.now().strftime("%Y-%m-%d %H:%M")
    for r in rows:
        ws.append([r.get(k, "") for k in COLUMNS[:7]] + [r.get("Source", ""), stamp])

    wb.save(path)
    return path


def open_in_os(path: str) -> None:
    try:
        if sys.platform.startswith("win"):
            os.startfile(path)  # type: ignore[attr-defined]
        elif sys.platform == "darwin":
            import subprocess
            subprocess.Popen(["open", path])
        else:
            import subprocess
            subprocess.Popen(["xdg-open", path])
    except Exception as e:  # never fail the run because the viewer didn't open
        print(f"[i] Could not auto-open the file ({e}). It is saved at: {path}")


# ── File picker ──────────────────────────────────────────────────────────────
def pick_images() -> list[str]:
    # If paths are passed on the command line, use them directly.
    args = [a for a in sys.argv[1:] if os.path.isfile(a)]
    if args:
        return args
    try:
        import tkinter as tk
        from tkinter import filedialog
    except ImportError:
        _die("tkinter is not available. Pass image paths as arguments instead: "
             "python scan_cards.py card1.jpg card2.png")
    root = tk.Tk()
    root.withdraw()
    root.attributes("-topmost", True)
    files = filedialog.askopenfilenames(
        title="Select business card images",
        filetypes=[("Images", "*.png *.jpg *.jpeg *.bmp *.tif *.tiff *.webp"), ("All files", "*.*")],
    )
    root.destroy()
    return [f for f in files if f.lower().rsplit(".", 1)[-1] in IMAGE_TYPES]


# ── Main ─────────────────────────────────────────────────────────────────────
def main() -> None:
    files = pick_images()
    if not files:
        print("No files selected. Nothing to do.")
        return

    print(f"Scanning {len(files)} card(s) locally (Tesseract, offline)…\n")
    rows: list[dict] = []
    for idx, f in enumerate(files, 1):
        try:
            lines = ocr_lines(f)
            fields = extract_fields(lines)
        except Exception as e:
            print(f"[{idx}] {os.path.basename(f)} — ERROR: {e}")
            fields = {k: "" for k in COLUMNS[:7]}
        fields["Source"] = os.path.basename(f)
        rows.append(fields)
        shown = fields["Name"] or fields["Company"] or "(no text found)"
        print(f"[{idx}] {os.path.basename(f):<28} -> {shown}")

    path = append_to_excel(rows)
    print(f"\nSaved {len(rows)} row(s) -> {path}")
    open_in_os(path)
    print("\nTip: open the sheet to review/edit — OCR can misread stylised logos.")


if __name__ == "__main__":
    main()
