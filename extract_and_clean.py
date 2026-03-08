"""Extract text from Daggerheart SRD PDF and clean encoding artifacts."""

import re
from PyPDF2 import PdfReader

PDF_PATH = "Daggerheart-SRD.pdf"
OUTPUT_PATH = "cleaned_text.txt"

# Mapping of PDF encoding artifacts to actual characters
REPLACEMENTS = {
    "/period.tab": ".",
    "/comma.tab": ",",
    "/hyphen.tab": "-",
    "/colon.tab": ":",
    "/semicolon.tab": ";",
    "/parenleft.tab": "(",
    "/parenright.tab": ")",
    "/quotedbl.tab": '"',
    "/quoteright.tab": "'",
    "/quoteleft.tab": "'",
    "/endash.tab": "–",
    "/emdash.tab": "—",
    "/bullet.tab": "•",
    "/ampersand.tab": "&",
    "/slash.tab": "/",
    "/plus.tab": "+",
    "/equal.tab": "=",
    "/exclam.tab": "!",
    "/question.tab": "?",
    # .uc variants (uppercase context)
    "/parenright.uc": ")",
    "/parenleft.uc": "(",
    "/endash.uc": "–",
    "/period.uc": ".",
    "/comma.uc": ",",
    "/hyphen.uc": "-",
}

# Number word to digit mapping
NUMBER_WORDS = {
    "zero": "0",
    "one": "1",
    "two": "2",
    "three": "3",
    "four": "4",
    "five": "5",
    "six": "6",
    "seven": "7",
    "eight": "8",
    "nine": "9",
}


def clean_numbers(text: str) -> str:
    """Replace /word.tnum patterns with digits, handling concatenated forms like /one.tnumd6."""
    # Handle patterns like /one.tnumd6 -> 1d6, /two.tnumd12 -> 2d12
    for word, digit in NUMBER_WORDS.items():
        text = re.sub(rf"/{word}\.tnumd", f"{digit}d", text)
        text = re.sub(rf"/{word}\.tnums", f"{digit}s", text)
        text = re.sub(rf"/{word}\.tnum", digit, text)
    return text


def clean_text(text: str) -> str:
    """Apply all cleaning transformations."""
    # Apply simple replacements (longest first to avoid partial matches)
    for pattern, replacement in sorted(REPLACEMENTS.items(), key=lambda x: -len(x[0])):
        text = text.replace(pattern, replacement)

    # Clean number encodings
    text = clean_numbers(text)

    # Fix hyphenated compound words that got split: "-Handed", "-Frame", etc.
    # The hyphen replacement already handles /hyphen.tab -> -

    # Clean stray /word.suffix patterns that weren't caught (e.g. /downloads.The)
    text = re.sub(r"/(\w+)\.(\w+)", lambda m: f"{m.group(1)}.{m.group(2)}" if m.group(0) not in REPLACEMENTS else m.group(0), text)

    # Collapse multiple spaces
    text = re.sub(r"  +", " ", text)

    # Clean up page markers for readability
    sep = "=" * 60
    text = re.sub(r"--- PAGE (\d+) ---", lambda m: f"\n{sep}\nPAGE {m.group(1)}\n{sep}", text)

    return text


def extract_and_clean():
    reader = PdfReader(PDF_PATH)
    print(f"Total pages: {len(reader.pages)}")

    pages = []
    for i, page in enumerate(reader.pages):
        raw = page.extract_text() or ""
        pages.append(f"--- PAGE {i + 1} ---\n{raw}")

    combined = "\n\n".join(pages)
    cleaned = clean_text(combined)

    with open(OUTPUT_PATH, "w") as f:
        f.write(cleaned)

    print(f"Wrote {len(cleaned)} chars to {OUTPUT_PATH}")

    # Show sample to verify quality
    print("\n--- SAMPLE (first 2000 chars) ---")
    print(cleaned[:2000])

    # Check for remaining artifacts
    remaining = re.findall(r"/\w+\.\w+", cleaned)
    if remaining:
        from collections import Counter
        print("\n--- REMAINING ARTIFACTS ---")
        for p, c in Counter(remaining).most_common(20):
            print(f"  {p}: {c}")


if __name__ == "__main__":
    extract_and_clean()
