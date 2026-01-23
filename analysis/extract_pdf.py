import pdfplumber

# Extract text from Nerušil et al. (2021) PDF
pdf = pdfplumber.open('s41598-021-95275-1.pdf')

# Extract first 8 pages (should cover abstract, intro, methods, and results)
text = ""
for i in range(min(8, len(pdf.pages))):
    page_text = pdf.pages[i].extract_text()
    text += f"\n{'='*80}\nPAGE {i+1}\n{'='*80}\n{page_text}\n"

pdf.close()

# Save to file
with open('nerusil_2021_extracted.txt', 'w', encoding='utf-8') as f:
    f.write(text)

print(f"Extracted {len(pdf.pages)} pages. Saved to nerusil_2021_extracted.txt")
print("\nFirst 3000 characters:")
print(text[:3000])
