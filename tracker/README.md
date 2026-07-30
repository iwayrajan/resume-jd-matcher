# Personal order tracker

`Student_Order_Tracker.xlsx` — tracks orders across all four products:
`PDF RAG Chat`, `Chat with YouTube`, `Chat with Data`, and `Resume/JD Matcher`.

**This is now the canonical copy.** Each time a new product's toolkit gets built,
the tracker gets copied forward and extended here rather than maintained
separately per repo — archive/delete the older copies in `pdf-rag-chat/tracker/`,
`chat-with-youtube/tracker/`, and `chat-with-data/tracker/` so there's only one
file you're actually updating.

## Sheets

**Orders Tracker** — one row per order. Yellow cells are for you to fill in;
gray cells (Balance Due, Payment Status) calculate automatically. Add a fifth
product later by editing the `dv_product` list in `build_tracker.py`.

**Delivery Checklist** — the same steps every order needs, regardless of
product. `student_config.json` and `scripts/generate_all.sh` are per-product —
run them from whichever product's repo the order is for.

## Regenerating

```bash
pip install openpyxl --break-system-packages   # if not already installed
python3 build_tracker.py
```
Opening the file in Excel or LibreOffice recalculates formulas automatically.
This overwrites `Student_Order_Tracker.xlsx` — copy your existing data out first
if you've already been using it.
