# Viva Question Bank — Resume/JD Matcher (Extract-Score-Generate)

## How to use this

Read through once, then use the **cheat sheet** for last-minute review.
Practice the **2-minute pitch** out loud at least twice.

---

## Section 1: Conceptual

**Q: What problem does this project solve?**
A: It lets a candidate see how well their resume matches a specific job
description before applying — an ATS-style match score with a breakdown of
*why* that score is what it is, plus specific missing skills and concrete
feedback, rather than only generic resume-writing advice.

**Q: Is this RAG or text-to-code, like your other projects?**
A: No — it's a third, distinct pattern: extract, score, generate. Nothing is
retrieved from an index (there's no RAG-style search), and no code is
generated or executed (unlike a text-to-code system). Instead, structured
data is extracted from both documents, compared using an explicit formula,
and feedback is generated from that comparison.

**Q: What is an ATS (Applicant Tracking System)?**
A: Software many employers use to automatically screen resumes — often by
matching keywords and structured fields against a job description — before a
human recruiter reviews them. This project estimates how a resume is likely
to fare against that kind of filtering, and gives feedback aimed at improving
it.

**Q: Why extract structured data instead of just asking an LLM "does this
resume match this job, yes/no/score"?**
A: A single end-to-end model judgement is opaque — if it gives a low score,
there's no way to know why, or what specifically to fix. By extracting named
fields (skills, experience, education) from both documents first, the scoring
computation becomes a transparent formula over well-defined values, so a low
score can always be traced to a specific component, and missing skills can be
listed by name rather than only implied.

**Q: What's the difference between exact matching and semantic matching for
skills?**
A: Exact matching checks if one phrase is literally contained in another
(case-insensitively) — it would fail to recognise that "ML" and "Machine
Learning" refer to the same skill. Semantic matching instead compares the
embeddings (numerical meaning-vectors) of both phrases and considers them
equivalent if their similarity exceeds a threshold, catching cases where the
wording differs but the underlying skill is the same.

---

## Section 2: Architecture & design

**Q: Walk me through what happens when I run an analysis.**
A: The resume is parsed to plain text (PDF via pymupdf4llm, DOCX via
python-docx). That text, and the pasted job description, are each sent to
Groq with a JSON-mode prompt, extracting a structured job-requirements object
and a structured resume-profile object respectively. Those two structured
objects are then compared: skill match checks each required skill against the
resume's skills (exact match first, semantic match as fallback), semantic
similarity compares the overall document embeddings, experience match
compares years, and education match compares qualifications. These four
scores are combined with fixed weights into one overall score. Finally, a
third Groq call generates specific feedback using the score breakdown and the
list of missing skills.

**Q: Why these specific weights (50/20/15/15)?**
A: Skill match is weighted heaviest because it's the most directly actionable
signal for a candidate — if a required skill is genuinely missing, a
candidate can add it (if they truly have that experience) and see the score
move accordingly. Semantic similarity, experience, and education are real
signals too, but are harder for a candidate to act on directly in the same
immediate way, so they're weighted lower rather than equally.

**Q: How does the system decide between calling something an exact match
versus needing the semantic fallback?**
A: It always tries the exact, case-insensitive substring check first — it's
cheaper computationally (no embedding call needed) and unambiguous when it
succeeds. Only when that fails does it compute embeddings for the required
skill and the candidate's skills, and check if any similarity exceeds the
threshold (0.62).

**Q: What does the radar chart show, and why a radar chart specifically?**
A: It plots the four component scores (skill match, semantic similarity,
experience match, education match) as a shape — a radar/spider chart makes it
visually obvious at a glance which dimensions are strong and which are weak,
compared to reading four separate numbers, and the shape itself changes
recognisably between a strong match and a weak match.

---

## Section 3: Technical deep-dive

**Q: How is experience "estimated" from a resume?**
A: The structured-extraction prompt asks the language model to estimate total
experience years directly from the work-history dates as written in the
resume, defaulting to 0 for a resume that reads as a fresher/student profile
with no professional experience listed. This is inherently approximate —
resumes with unconventional date formats, overlapping roles, or gaps can make
this less precise, which is a documented limitation.

**Q: What happens to the experience score if the candidate has less
experience than required?**
A: They still get partial credit proportional to how close they are (actual
years divided by required years), rather than the score dropping to zero the
moment they fall short of the exact number — this avoids unfairly penalising
someone who's close to qualifying.

**Q: How does the education-match fallback work?**
A: If none of the required education strings appear as a substring in the
resume's listed education, the system falls back to a semantic comparison,
embedding both the required qualifications and the resume's listed education
and checking similarity — this catches cases like "B.Tech" vs. "Bachelor of
Technology" that a substring check alone would miss.

**Q: Why constrain the extraction step to JSON specifically?**
A: Groq's JSON mode significantly increases the reliability of getting
syntactically valid, schema-conforming output rather than free-form prose
that would need to be re-parsed, which keeps everything downstream —
scoring, missing-skill detection, feedback generation — operating on
well-defined fields instead of unpredictable text.

**Q: What are the limitations of this system?**
A: Experience-year estimation depends on how clearly the resume states dates;
the 0.62 similarity threshold was tuned by spot-checking rather than
calibrated against a labeled benchmark; the system doesn't detect
keyword-stuffing (a skill gets credit just for being listed, regardless of
how substantively it's demonstrated elsewhere); and it only handles one
resume against one job description per analysis, not batch screening.

---

## Section 4: Testing & evaluation

**Q: How did you test this system?**
A: Against representative scenarios: parsing both PDF and DOCX resumes,
exact skill matching, semantic skill matching (the "ML"/"Machine Learning"
case), missing-skill detection, partial-credit experience scoring, a
strong-match end-to-end scenario and a deliberately weak-match scenario using
the same resume against two different job descriptions, full pipeline wiring
with mocked API responses, and an unsupported-file-type error case.

**Q: Why did you specifically test a strong-match and a weak-match scenario
with the same resume?**
A: To confirm the score genuinely differentiates rather than trending
uniformly positive regardless of input — a scoring tool that gives every
resume a similar, generically decent score isn't credible or useful. Using
the same resume against two very different job descriptions isolates the
job-description side as the variable, making it a clean test of whether the
scoring logic is actually sensitive to fit.

**Q: How would you formally validate the accuracy of this system?**
A: Build a labeled benchmark of resume-JD pairs with human-assigned match
judgements or actual interview/hiring outcomes, then measure how well the
system's scores correlate with those labels — this would also make it
possible to properly calibrate the similarity threshold and the component
weights, rather than relying on spot-checked defaults.

---

## Section 5: Tricky / comparative questions examiners like to ask

**Q: Couldn't you just ask the LLM to output a score directly, in one call,
instead of this whole extract-and-score pipeline?**
A: You could, and it would be simpler to build, but it would be far less
explainable and less consistent — a single model call producing a bare number
gives no way to know which specific requirement it weighted, whether it even
considered a specific skill, or why two similar resumes might get different
scores. Decomposing the score into named components makes the system
auditable and lets it list specific missing skills, which is the actual
decision-support value for a candidate.

**Q: What if the candidate lies about a skill on their resume?**
A: The system has no way to verify claims made in a resume — it operates on
what's written, the same limitation any resume-screening process (human or
automated) has. It's explicitly scoped as assessing match to a stated
resume, not verifying truthfulness.

**Q: How would this compare to a real company's actual ATS?**
A: Real ATS systems vary widely and are usually proprietary, often using
additional signals this project doesn't have access to (e.g. internal
historical hiring data, company-specific keyword weightings). This system is
an estimate built on a documented, generalizable methodology — it's meant to
give directionally useful, explainable feedback, not to exactly replicate any
specific company's actual filtering algorithm.

**Q: Why not train your own classifier on labeled resume-JD match data
instead of a hand-designed weighted formula?**
A: That would require a labeled dataset of resume-JD pairs with known match
outcomes, which isn't readily available for a project at this scale. A
hand-designed, documented formula is fully explainable from the start and
doesn't require training data — trading some potential accuracy gain for
transparency and buildability within the project's scope, with proper
calibration flagged as future work.

---

## Cheat sheet — one-pager

| Component | Tool used | One-line justification |
|---|---|---|
| Resume parsing (PDF) | pymupdf4llm | Same library used elsewhere in this product line |
| Resume parsing (DOCX) | python-docx | Standard, reliable DOCX text extraction |
| Structured extraction | Groq API, JSON mode | Reliable schema-conforming output, not free-form text |
| Skill matching | Exact substring + embedding fallback | Catches both literal and differently-phrased equivalent skills |
| Semantic similarity | sentence-transformers (MiniLM) | CPU-friendly, no GPU needed |
| Scoring | Fixed weighted formula (50/20/15/15) | Explainable, auditable — not one opaque model call |
| Feedback | Groq API | Grounded in the specific score breakdown and missing skills |
| Interface | Streamlit + Plotly radar chart | Visual breakdown, not just a bare number |

---

## 2-minute pitch script

> "My project lets someone upload their resume and paste a job description,
> and get back an ATS-style match score — but the important part isn't just
> the number, it's that the score is fully explainable.
>
> Instead of asking a language model to just output a score directly, I first
> extract structured data from both documents — the job's required skills,
> experience, and education from the job description; the candidate's
> skills, experience, and education from the resume. That gives me two
> comparable structured objects instead of two blobs of text.
>
> Then I score the match using four named components with fixed weights:
> skill match, which checks both exact wording and semantic equivalence — so
> 'ML' correctly matches 'Machine Learning' even though the words don't
> overlap — semantic similarity between the overall documents, an experience
> comparison with partial credit if you're close but not quite there, and an
> education comparison with the same kind of semantic fallback.
>
> Skill match gets the most weight, deliberately, because it's the most
> actionable thing a candidate can do something about.
>
> Because every component is named and reported separately, I can also list
> exactly which required skills are missing — not just say the match is
> weak. And a final language model call turns that into specific feedback:
> which skills are actually worth adding, how to better highlight experience
> that's already there, and some general formatting tips.
>
> I specifically tested this with the same resume against a strong-fit job
> and a clearly mismatched one, to make sure the score actually drops
> meaningfully rather than just always looking generically positive — which
> is really the whole point of building it this way instead of one opaque
> model call."

---

## Tips for the actual viva

- Have the four weights (50/20/15/15) memorized and ready to justify in one
  sentence each — this is the single most quotable design decision in the
  project and the one examiners will most want to hear you explain in your
  own words.
- Expect a "why not just ask the LLM for a score directly" question — your
  answer is about explainability and auditability, not accuracy.
- If asked about the 0.62 threshold specifically, be honest that it's
  spot-checked, not formally calibrated — and point to the future-scope item
  about benchmarking it, which shows you understand the limitation rather
  than papering over it.
- Have the strong-match vs. weak-match test ready to describe — it's your
  best answer to "how do you know this isn't just always positive."
