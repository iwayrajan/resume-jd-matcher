# Report template — reuse for each student

Generates `Resume_JD_Matcher_Report.docx` — all 8 standard chapters, both
diagrams embedded, a requirements table, and a testing table.

## To generate a report for a new student

**Recommended:** use `../scripts/generate_all.sh` to regenerate report + deck
together into `../deliverables/`.

To run just this one manually:
1. Edit `../student_config.json`.
2. Run: `node generate_report.js`

## Before handing it to the student

- **Update the Table of Contents** in Word: right-click it → "Update Field" →
  "Update entire table".
- **Replace Chapter 7 placeholder text** with real screenshots: input screen,
  a strong-match score display, a weak-match score display, missing-skills
  lists, and the generated feedback.
- **Check citation style** in Chapter 2 against the student's department
  requirements (IEEE/APA), since the current references are generic.

## Customization notes

- Diagrams come from `assets/architecture_diagram.png` and
  `assets/scoring_methodology_diagram.png` — regenerate from the SVGs in
  `../docs/` if the pipeline or weighting changes.
- To vary a submission from a classmate's: swap the example job-role domain
  discussed in Chapter 1/7 (e.g. "matching against a marketing role" instead
  of the generic backend/data-science examples), or implement one Chapter 8
  future-scope item for real — calibrating the similarity threshold against a
  small hand-labeled skill-pair benchmark is a self-contained, demonstrable
  pick that also gives a good viva answer to "how did you pick 0.62?".
