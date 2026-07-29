# Sample test data

## `Sample_Resume.docx` / `Sample_Resume.pdf`

Same fictional candidate (Priya Sharma) in both formats, so you can demo/test
both the PDF and DOCX parsing paths. A backend-leaning fresher profile: Python,
SQL, Django, one internship, a RAG chatbot project, B.Tech Computer Science.

## `Sample_JD_Backend_Developer.txt`

A close match for the sample resume — use this to demo a **high score**. Expect:
- Strong must-have skill coverage (Python, SQL, Django all present)
- Docker listed as a gap (not in the resume) — good example of a real,
  actionable missing-skill callout
- Education requirement satisfied

## `Sample_JD_Data_Scientist.txt`

A poor match for the same resume — use this to demo a **low score** and show
the scoring actually differentiates rather than just being generically
positive. Expect:
- Low skill match (no ML/data-science skills in the resume)
- Education requirement likely unmet (JD wants Master's; resume has B.Tech)
- Feedback should reflect that this is a stretch, not just suggest tweaks

## Suggested demo script

1. Run `Sample_Resume.docx` (or `.pdf`) against `Sample_JD_Backend_Developer.txt`
   first — a strong score makes for a good "here's what it looks like when it
   works" opening.
2. Then run the same resume against `Sample_JD_Data_Scientist.txt` — the score
   should drop substantially. This is the more convincing demo moment for a
   viva, since it shows the system isn't just rubber-stamping every resume
   with a high score.
3. Point out the radar chart's shape differs meaningfully between the two runs
   — the backend JD should show a fuller shape, the data-scientist JD should
   show a visibly smaller one, especially on the Skill Match axis.
4. Open "Show extracted JD requirements and resume profile" in both runs to
   show the structured extraction step is working correctly, not just the
   final score — useful if an examiner asks to see an intermediate step.
