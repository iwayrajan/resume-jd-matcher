# Resume / JD Matcher — ATS Score & Gap Analysis

Upload a resume (PDF or DOCX), paste a job description, and get an ATS-style match
score with a category breakdown, specific missing-skill gaps, and actionable
improvement suggestions — grounded in an actual scoring methodology, not a single
opaque "AI score."

## How it works (and how it differs from the other three products)

This is a third distinct architecture pattern, alongside RAG (`pdf-rag-chat`,
`chat-with-youtube`) and text-to-code (`chat-with-data`): an **extract → score →
generate** pipeline. Nothing is retrieved from an index, and no code is executed —
structured data is extracted from both documents, compared using an explicit
weighted formula, and specific feedback is generated from the comparison.

1. **Parse** — the resume (PDF via `pymupdf4llm`, DOCX via `python-docx`) becomes
   plain text. The job description is pasted directly as text.
2. **Structured extraction** (Groq, JSON mode) — both documents are converted into
   structured data: the JD into must-have/nice-to-have skills, minimum experience,
   and education requirements; the resume into skills, experience years, education,
   and projects.
3. **Scoring** — four signals are combined into one 0-100 score:
   - **Skill match (50%)** — for each required skill, checks for an exact
     substring match *or* a semantically equivalent resume skill (embedding
     cosine similarity above a threshold), so "ML" correctly matches "Machine
     Learning" even without exact wording.
   - **Semantic similarity (20%)** — overall embedding similarity between the
     full resume and full JD text, capturing general domain/phrasing closeness.
   - **Experience match (15%)** — resume's estimated experience years vs. the
     JD's stated minimum, with partial credit below the threshold.
   - **Education match (15%)** — required qualifications checked against the
     resume's listed education, with a semantic fallback for phrasing
     differences (e.g. "B.Tech" vs. "Bachelor of Technology").

   Skill match is weighted heaviest because it's the most **actionable** signal —
   a student can genuinely add a missing skill they already have evidence for;
   semantic similarity is harder to act on directly, so it's weighted lower.
4. **Feedback generation** (Groq) — specific, non-generic suggestions: which
   missing skills are worth adding (only if there's plausible existing evidence,
   not fabrication), how to better highlight existing experience, and brief ATS
   formatting tips.

## Setup

```bash
python3 -m venv venv
source venv/bin/activate        # on Windows: venv\Scripts\activate
pip install -r requirements.txt
```

## Get a free Groq API key

1. Go to https://console.groq.com/keys
2. Sign up with email or Google (no credit card required)
3. Create an API key and copy it

Paste it into the app's sidebar, or set it as `GROQ_API_KEY`.

## Run it

```bash
streamlit run app.py
```

1. Paste your Groq API key in the sidebar
2. Upload a resume (PDF or DOCX) and paste a job description
3. Click **Analyze Match** — see the overall score, a radar chart breakdown,
   missing-skill lists, and specific improvement suggestions
4. Try `test_data/` — one JD that should score high against the sample resume,
   one that should score low, to see the scoring actually differentiate

## Known limitations

- Experience years are *estimated* by the LLM from resume dates, which can be
  imprecise for resumes with gaps, overlapping roles, or unconventional date
  formats — treat the experience-match score as approximate.
- The skill-match semantic threshold (0.62 cosine similarity) is a fixed value
  tuned by spot-checking, not calibrated against a labeled benchmark — it may
  need adjustment if you observe too many false-positive or false-negative
  skill matches in practice.
- This does not detect resume keyword-stuffing (e.g. a skills section listing
  every possible technology) — a resume that lists a skill gets credit for it
  regardless of how substantively that skill is actually demonstrated elsewhere
  in the resume.

## Full delivery toolkit

Mirroring the other three products, this repo also includes everything needed to
package and sell this as a student project:

- `docs/` — architecture and scoring-methodology diagrams (SVG + PNG)
- `report_template/` — generates a full 8-chapter Word report (`generate_report.js`)
- `presentation/` — generates a 14-slide PowerPoint deck (`generate_deck.js`)
- `viva_prep/viva_question_bank.md` — Q&A bank, cheat sheet, and a 2-minute pitch script
- `tracker/` — order tracker spreadsheet (canonical copy, now spans all four products)
- `scripts/generate_all.sh` — regenerates the report + deck and packages a delivery folder
- `student_config.json` — the one file to edit per student; everything above reads from it

To generate a delivery package for a new student:
```bash
# 1. Edit student_config.json with their details
# 2. Run:
bash scripts/generate_all.sh
```
This produces `deliverables/<student_name>/` with the report, deck, and viva bank
ready to hand over (after you've swapped in real screenshots — see
`report_template/README.md`).

## Files

- `app.py` — Streamlit UI (upload, JD input, score display, radar chart, feedback)
- `matcher.py` — core pipeline: parsing, structured extraction, weighted scoring,
  feedback generation
- `requirements.txt` — dependencies
- `test_data/` — sample resume (PDF + DOCX) and two job descriptions (one strong
  match, one weak match) for testing/demoing
