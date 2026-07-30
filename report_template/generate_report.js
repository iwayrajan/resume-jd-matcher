/*
 * Reusable college project report generator for the Resume/JD Matcher project.
 *
 * HOW TO REUSE FOR EACH STUDENT:
 *   1. Edit ../student_config.json with the student's details.
 *   2. Run: node generate_report.js  (or use scripts/generate_all.sh from repo root)
 *   3. Output: Resume_JD_Matcher_Report.docx in this folder.
 */

const {
  Document, Packer, Paragraph, TextRun, HeadingLevel, AlignmentType,
  Table, TableRow, TableCell, WidthType, ShadingType,
  ImageRun, PageBreak, TableOfContents, Header, Footer, PageNumber,
  LevelFormat,
} = require("docx");
const fs = require("fs");

const CONFIG = require("../student_config.json");

function heading(text, level) { return new Paragraph({ text, heading: level, spacing: { before: 300, after: 150 } }); }
function body(text) {
  return new Paragraph({ children: [new TextRun({ text, size: 24 })], spacing: { after: 200, line: 360 }, alignment: AlignmentType.JUSTIFIED });
}
function bullet(text) {
  return new Paragraph({ children: [new TextRun({ text, size: 24 })], numbering: { reference: "bullet-list", level: 0 }, spacing: { after: 100 } });
}
function pageBreak() { return new Paragraph({ children: [new PageBreak()] }); }
function centerTitle(text, size = 32, bold = true) {
  return new Paragraph({ children: [new TextRun({ text, bold, size })], alignment: AlignmentType.CENTER, spacing: { after: 200 } });
}
function tableCell(text, { header = false, width = 2000 } = {}) {
  return new TableCell({
    width: { size: width, type: WidthType.DXA },
    shading: header ? { type: ShadingType.CLEAR, fill: "D9D9D9" } : undefined,
    children: [new Paragraph({ children: [new TextRun({ text, bold: header, size: 20 })] })],
  });
}
function buildTable(rows, colWidths) {
  return new Table({
    width: { size: 9000, type: WidthType.DXA },
    columnWidths: colWidths,
    rows: rows.map((row, i) => new TableRow({ children: row.map((cell, j) => tableCell(cell, { header: i === 0, width: colWidths[j] })) })),
  });
}

const titlePageChildren = [
  new Paragraph({ text: "", spacing: { after: 600 } }),
  centerTitle(CONFIG.PROJECT_TITLE, 32, true),
  new Paragraph({ text: "", spacing: { after: 300 } }),
  centerTitle(`A ${CONFIG.PROJECT_TYPE} Report`, 24, false),
  new Paragraph({ text: "", spacing: { after: 400 } }),
  centerTitle("Submitted in partial fulfilment of the requirements for the award of", 22, false),
  centerTitle(`the degree in ${CONFIG.DEPARTMENT}`, 22, false),
  new Paragraph({ text: "", spacing: { after: 600 } }),
  centerTitle("By", 22, false),
  centerTitle(CONFIG.STUDENT_NAME, 26, true),
  centerTitle(`Roll No: ${CONFIG.ROLL_NUMBER}`, 20, false),
  new Paragraph({ text: "", spacing: { after: 600 } }),
  centerTitle("Under the guidance of", 20, false),
  centerTitle(CONFIG.GUIDE_NAME, 24, true),
  new Paragraph({ text: "", spacing: { after: 600 } }),
  centerTitle(CONFIG.COLLEGE_NAME, 26, true),
  centerTitle(CONFIG.UNIVERSITY_NAME, 22, false),
  centerTitle(CONFIG.SUBMISSION_MONTH_YEAR, 20, false),
  pageBreak(),
];

const certificateChildren = [
  heading("Certificate", HeadingLevel.HEADING_1),
  body(`This is to certify that the ${CONFIG.PROJECT_TYPE.toLowerCase()} report entitled "${CONFIG.PROJECT_TITLE}" is a bonafide record of work carried out by ${CONFIG.STUDENT_NAME} (Roll No: ${CONFIG.ROLL_NUMBER}), submitted in partial fulfilment of the requirements for the award of degree in ${CONFIG.DEPARTMENT} at ${CONFIG.COLLEGE_NAME}, during the academic year ${CONFIG.ACADEMIC_YEAR}.`),
  new Paragraph({ text: "", spacing: { after: 800 } }),
  new Paragraph({ children: [new TextRun({ text: `Guide: ${CONFIG.GUIDE_NAME}`, size: 24 })], spacing: { after: 200 } }),
  new Paragraph({ children: [new TextRun({ text: `Head of Department: ${CONFIG.HOD_NAME}`, size: 24 })], spacing: { after: 200 } }),
  pageBreak(),
];

const abstractChildren = [
  heading("Acknowledgement", HeadingLevel.HEADING_1),
  body(`I would like to express my sincere gratitude to ${CONFIG.GUIDE_NAME} for continuous guidance and support throughout this project. I also thank ${CONFIG.HOD_NAME} and the faculty of ${CONFIG.DEPARTMENT}, ${CONFIG.COLLEGE_NAME}, for providing the resources and environment necessary to complete this work.`),
  new Paragraph({ text: "", spacing: { after: 400 } }),
  heading("Abstract", HeadingLevel.HEADING_1),
  body("Job seekers frequently struggle to assess how well a resume matches a specific job description, and to identify concretely what to improve before applying, particularly in the context of Applicant Tracking Systems (ATS) that many employers use to filter applications before a human reviews them. This project implements a system that accepts a resume (as a PDF or DOCX file) and a job description (as text), and produces an ATS-style match score along with a breakdown of that score and specific, actionable feedback."),
  body("The system does not rely on a single opaque score produced end-to-end by a language model. Instead, structured information is first extracted separately from both documents using a large language model constrained to return valid JSON: the job description is parsed into must-have skills, nice-to-have skills, a minimum experience requirement, and education requirements; the resume is parsed into the candidate's skills, estimated total experience, education, and projects. An explicit, documented weighted formula then combines four measurable signals into a single overall score: skill match (using both exact and semantic matching, so that equivalent skills phrased differently, such as \"ML\" and \"Machine Learning\", are correctly recognised as a match), overall semantic similarity between the two documents, an experience-years comparison, and an education-requirements comparison."),
  body("Because the score is built from named, inspectable components rather than a single model call, the system can also report exactly which required skills are missing, which is both the primary decision-support feature for the job seeker and a transparency feature that lets a user audit why a particular score was produced. A final language model call generates specific, actionable feedback: which missing skills are genuinely worth adding, how to better present already-present relevant experience, and general ATS-formatting guidance."),
  body("The resulting application is implemented in Python using Streamlit for the interface, sentence-transformer embeddings for semantic comparison, and Groq's hosted language model API for structured extraction and feedback generation, and demonstrates a practical, explainable approach to applying large language models to a comparison and scoring task rather than a purely generative one."),
  pageBreak(),
];

const tocChildren = [
  heading("Table of Contents", HeadingLevel.HEADING_1),
  new TableOfContents("Table of Contents", { hyperlink: true, headingStyleRange: "1-3" }),
  pageBreak(),
];

const chapter1 = [
  heading("Chapter 1: Introduction", HeadingLevel.HEADING_1),

  heading("1.1 Problem Statement", HeadingLevel.HEADING_2),
  body("Many organisations use Applicant Tracking Systems to automatically filter resumes against a job description before a human recruiter reviews them, commonly by matching keywords and structured fields. Job seekers, particularly students and early-career candidates, often have limited visibility into how their resume is likely to score against such a system for a specific job, and limited concrete guidance on what to change to improve that outcome beyond generic resume-writing advice. There is a need for a tool that gives a candidate a specific, explainable match assessment against a specific job description, rather than only generic formatting tips."),

  heading("1.2 Objectives", HeadingLevel.HEADING_2),
  bullet("To accept a resume in PDF or DOCX format and a job description as text, and extract structured information from both using a large language model."),
  bullet("To compute an overall match score from multiple explicit, individually inspectable components rather than a single opaque model judgement."),
  bullet("To detect skill matches semantically, not only by exact keyword matching, so that differently-phrased equivalent skills are correctly recognised."),
  bullet("To identify and report specific missing must-have and nice-to-have skills."),
  bullet("To generate specific, actionable feedback for improving the resume's match to the given job description."),
  bullet("To present the score and its breakdown visually, in a way that is understandable without technical background."),
  new Paragraph({ text: "", spacing: { after: 200 } }),

  heading("1.3 Scope", HeadingLevel.HEADING_2),
  body("The system accepts a single resume and a single job description per analysis, and is intended for personal and academic use in assessing and improving a resume's fit to a specific role. It does not currently integrate with any live job board or ATS platform, does not evaluate resume design/visual formatting beyond general text-based advice, and its experience-year and education estimates depend on the quality and clarity of the information as written in the resume."),
  pageBreak(),
];

const chapter2 = [
  heading("Chapter 2: Literature Survey", HeadingLevel.HEADING_1),
  body("Applicant Tracking Systems have been widely discussed in career-guidance and human-resources literature as a filtering step that disproportionately screens out qualified candidates whose resumes do not contain the specific keywords a system or recruiter is matching against, motivating a body of consumer-facing tools and browser extensions that attempt to estimate ATS compatibility, typically through keyword-overlap counting between a resume and a job posting."),
  body("Simple keyword-overlap approaches share a known weakness with keyword-based document search generally: they fail to recognise that two different phrasings can refer to the same underlying skill or qualification, such as \"ML\" and \"Machine Learning\", or \"B.Tech\" and \"Bachelor of Technology\". Sentence embedding models, of the kind popularised by the Sentence-BERT family, address this by representing text as dense vectors positioned such that semantically similar phrases are close together regardless of exact wording, enabling a similarity threshold to stand in for a much larger space of equivalent phrasings than an exact-match dictionary could enumerate."),
  body("Separately, large language models have been shown to be effective at structured information extraction from unstructured or semi-structured documents when constrained to a defined output schema, commonly implemented via a JSON-mode or function-calling interface that increases the reliability of receiving syntactically valid, schema-conforming output rather than free-form prose. This project relies on this pattern for both the job description and the resume, converting each into a fixed structured shape before any scoring logic runs, which keeps the scoring computation itself deterministic and auditable rather than another opaque model call."),
  body("A recurring critique of AI-driven resume-scoring tools in career-guidance literature is a lack of transparency: a candidate shown only a final numeric score has no way to understand, contest, or act on that score. This project's design directly responds to that critique by decomposing the score into four named, individually reported components and by explicitly listing missing skills by name, rather than only presenting a single aggregate number."),
  pageBreak(),
];

const srsRows = [
  ["Requirement ID", "Description", "Type"],
  ["FR-1", "The system shall accept a resume file in PDF or DOCX format.", "Functional"],
  ["FR-2", "The system shall accept a job description as pasted text.", "Functional"],
  ["FR-3", "The system shall extract structured requirements from the job description using a language model.", "Functional"],
  ["FR-4", "The system shall extract a structured profile from the resume using a language model.", "Functional"],
  ["FR-5", "The system shall compute a skill match score using both exact and semantic matching.", "Functional"],
  ["FR-6", "The system shall compute an overall match score from named, weighted components.", "Functional"],
  ["FR-7", "The system shall list specific missing must-have and nice-to-have skills by name.", "Functional"],
  ["FR-8", "The system shall generate specific, actionable improvement feedback.", "Functional"],
  ["FR-9", "The system shall display the score breakdown visually (e.g. as a chart).", "Functional"],
  ["NFR-1", "The system shall run on a CPU-only machine without requiring a GPU.", "Non-functional"],
  ["NFR-2", "The system shall not depend on any paid API for its core functionality.", "Non-functional"],
  ["NFR-3", "The scoring methodology shall be documented and inspectable, not a single opaque score.", "Non-functional"],
];

const chapter3 = [
  heading("Chapter 3: System Analysis", HeadingLevel.HEADING_1),

  heading("3.1 Feasibility Study", HeadingLevel.HEADING_2),
  body("The system is technically feasible on standard consumer hardware. Resume parsing and embedding-based similarity computation are lightweight, CPU-bound operations. Structured extraction and feedback generation depend on Groq's hosted API, which offers a free tier sufficient for personal and academic use, making the system economically feasible without licensing cost. An internet connection is required for each analysis (three API calls: job-description extraction, resume extraction, and feedback generation), but the embedding-based scoring itself runs entirely locally once the structured data has been extracted."),

  heading("3.2 Requirements Specification", HeadingLevel.HEADING_2),
  body("The functional and non-functional requirements of the system are summarised below."),
  buildTable(srsRows, [1500, 6000, 1500]),
  new Paragraph({ text: "", spacing: { after: 200 } }),

  heading("3.3 Hardware and Software Requirements", HeadingLevel.HEADING_2),
  bullet("Processor: Any modern x86-64 processor (Intel/AMD), no GPU required."),
  bullet("RAM: 4 GB minimum, 8 GB recommended."),
  bullet("Operating System: Windows, Linux, or macOS."),
  bullet("Software: Python 3.10 or above, pip package manager."),
  bullet("Key libraries: Streamlit, pymupdf4llm, python-docx, sentence-transformers, Plotly, groq."),
  bullet("Internet connection: required for the three Groq API calls made per analysis."),
  pageBreak(),
];

const chapter4 = [
  heading("Chapter 4: System Design", HeadingLevel.HEADING_1),

  heading("4.1 System Architecture", HeadingLevel.HEADING_2),
  body("The system is organised into an extraction phase, which converts both input documents into structured data, and a scoring phase, which combines that structured data into a score and generates feedback. Figure 4.1 shows the overall architecture."),
  new Paragraph({
    children: [new ImageRun({ type: "png", data: fs.readFileSync(__dirname + "/assets/architecture_diagram.png"), transformation: { width: 600, height: 283 } })],
    alignment: AlignmentType.CENTER,
  }),
  new Paragraph({ children: [new TextRun({ text: "Figure 4.1: System architecture showing the extraction phase and scoring phase", italics: true, size: 20 })], alignment: AlignmentType.CENTER, spacing: { after: 300 } }),
  body("In the extraction phase, the resume is parsed to plain text and, together with the job description text, sent to a large language model constrained to return structured JSON matching a fixed schema. In the scoring phase, the resulting structured data is compared using an explicit weighted formula (Section 4.2), missing required skills are identified by name, and a final language model call generates specific feedback grounded in the score breakdown and missing-skills list."),

  heading("4.2 Scoring Methodology", HeadingLevel.HEADING_2),
  body("The overall score is a weighted sum of four components, chosen so that the most actionable signal (skill match) carries the most weight. Figure 4.2 shows the weight allocation."),
  new Paragraph({
    children: [new ImageRun({ type: "png", data: fs.readFileSync(__dirname + "/assets/scoring_methodology_diagram.png"), transformation: { width: 550, height: 259 } })],
    alignment: AlignmentType.CENTER,
  }),
  new Paragraph({ children: [new TextRun({ text: "Figure 4.2: Scoring weight allocation across the four components", italics: true, size: 20 })], alignment: AlignmentType.CENTER, spacing: { after: 300 } }),
  body("Skill match (50%) combines exact substring matching with embedding-based semantic matching, so that a required skill is credited as present if it appears in the resume's skill list either literally or as a close semantic match above a fixed similarity threshold. Semantic similarity (20%) compares the overall embeddings of the full resume and job description texts, capturing general domain and phrasing closeness beyond individual skills. Experience match (15%) compares the resume's estimated total experience against the job description's stated minimum, awarding partial credit when the candidate falls short rather than scoring it as a hard pass/fail. Education match (15%) checks the resume's listed education against the job description's stated requirements, with a semantic fallback for differently-phrased but equivalent qualifications."),

  heading("4.3 Module Design", HeadingLevel.HEADING_2),
  bullet("matcher.py — Core pipeline: resume parsing, structured extraction, weighted scoring, and feedback generation. Independent of the user interface."),
  bullet("app.py — Streamlit-based user interface: file upload, job description input, score display with a radar chart, missing-skills lists, and feedback rendering."),
  pageBreak(),
];

const chapter5 = [
  heading("Chapter 5: Implementation", HeadingLevel.HEADING_1),

  heading("5.1 Technology Stack", HeadingLevel.HEADING_2),
  bullet("Python 3 — primary implementation language."),
  bullet("Streamlit — web-based user interface framework."),
  bullet("pymupdf4llm — PDF resume text extraction."),
  bullet("python-docx — DOCX resume text extraction."),
  bullet("sentence-transformers (all-MiniLM-L6-v2) — embeddings for semantic skill and similarity matching."),
  bullet("Plotly — radar chart rendering for the score breakdown."),
  bullet("Groq API (Llama models) — structured extraction (JSON mode) and feedback generation."),
  new Paragraph({ text: "", spacing: { after: 200 } }),

  heading("5.2 Resume Parsing", HeadingLevel.HEADING_2),
  body("PDF resumes are converted to text using pymupdf4llm, the same library used for PDF handling elsewhere in this product line. DOCX resumes are parsed using python-docx, extracting the text of each non-empty paragraph. Both paths converge on the same output: a single plain-text string representing the resume's content, which is what the structured-extraction step operates on."),

  heading("5.3 Structured Extraction", HeadingLevel.HEADING_2),
  body("Both the job description and the resume are sent to Groq's chat completion API with response_format set to request JSON output, along with a prompt specifying the exact expected shape: for the job description, a job title, must-have skills, nice-to-have skills, a minimum experience-years figure, education requirements, and key responsibilities; for the resume, a candidate name, a skills list, an estimated total experience in years, education, projects, and certifications. Constraining the output to a fixed JSON schema keeps the downstream scoring logic deterministic, since it operates on well-defined fields rather than needing to re-parse free-form text."),

  heading("5.4 Skill Matching", HeadingLevel.HEADING_2),
  body("For each required skill, the system first checks for a case-insensitive substring match against the candidate's listed skills. If no exact match is found, the required skill and each of the candidate's skills are embedded, and the required skill is considered matched if its cosine similarity to any candidate skill exceeds a fixed threshold (0.62). This two-step approach avoids unnecessary embedding calls when an exact match already resolves the comparison, while still catching equivalent skills phrased differently."),

  heading("5.5 Weighted Scoring", HeadingLevel.HEADING_2),
  body("The four component scores (skill match, semantic similarity, experience match, education match) are combined using the fixed weights shown in Figure 4.2, and the resulting 0-1 value is scaled to a 0-100 overall score. Each component is also reported individually in the breakdown returned to the interface, so a low overall score can always be traced back to which specific component is driving it down."),

  heading("5.6 Feedback Generation", HeadingLevel.HEADING_2),
  body("A final Groq call is given the score breakdown, the list of missing must-have and nice-to-have skills, and the candidate's existing skills and projects, and is instructed to produce specific, actionable feedback organised into: top-priority skill additions (only suggested where the candidate plausibly already has related experience, to avoid recommending fabrication), suggestions for better highlighting existing relevant experience, and brief general ATS-formatting guidance."),
  pageBreak(),
];

const testRows = [
  ["Test ID", "Test Description", "Input", "Expected Output", "Result"],
  ["T-1", "Parse a PDF resume", "Sample PDF resume", "Correct plain text extracted", "Pass"],
  ["T-2", "Parse a DOCX resume", "Sample DOCX resume", "Correct plain text extracted", "Pass"],
  ["T-3", "Exact skill match", "Required: \"Python\"; resume has \"Python programming\"", "Matched via substring", "Pass"],
  ["T-4", "Semantic skill match", "Required: \"ML\"; resume has \"Machine Learning\"", "Matched via embedding similarity", "Pass"],
  ["T-5", "Missing skill detection", "Required skill absent from resume", "Correctly listed as missing", "Pass"],
  ["T-6", "Experience partial credit", "Required 4 years, candidate has 2", "Score reflects partial (not zero) credit", "Pass"],
  ["T-7", "Strong match end-to-end", "Backend-focused resume vs. backend JD", "High overall score", "Pass"],
  ["T-8", "Weak match end-to-end", "Backend-focused resume vs. data-science JD", "Substantially lower overall score", "Pass"],
  ["T-9", "Full pipeline wiring", "Mocked API responses across the pipeline", "Correct number and order of extraction/scoring/feedback calls", "Pass"],
  ["T-10", "Unsupported file type", "A .txt resume upload", "Clear error message, no crash", "Pass"],
];

const chapter6 = [
  heading("Chapter 6: Testing", HeadingLevel.HEADING_1),
  body("The system was tested against scenarios covering both resume file formats, exact and semantic skill matching, missing-skill detection, partial-credit experience scoring, a strong-match and a weak-match end-to-end scenario to confirm the score genuinely differentiates rather than trending uniformly high, full pipeline wiring, and an unsupported-file-type error case. The test cases and their outcomes are summarised in Table 6.1."),
  buildTable(testRows, [900, 2600, 2200, 2400, 900]),
  new Paragraph({ children: [new TextRun({ text: "Table 6.1: Test cases and results", italics: true, size: 20 })], alignment: AlignmentType.CENTER, spacing: { before: 100, after: 300 } }),
  body("All test cases passed. In particular, the weak-match scenario (T-8) confirmed that the overall score meaningfully decreases when the job description genuinely does not match the resume, rather than the system producing a uniformly high score regardless of input — an important property for the score to be credible and useful as decision support."),
  pageBreak(),
];

const chapter7 = [
  heading("Chapter 7: Results and Screenshots", HeadingLevel.HEADING_1),
  body("[Insert screenshots of the running application here: the upload/input screen, the score display with radar chart for a strong match, the same for a weak match, the missing-skills lists, and the generated feedback. Replace this paragraph with the actual screenshots before submission.]"),
  body("The system successfully differentiates between strong and weak resume-job matches, correctly identifies specific missing skills using both exact and semantic matching, and produces feedback that is specific to the candidate's actual profile and the specific job description provided."),
  pageBreak(),
];

const chapter8 = [
  heading("Chapter 8: Conclusion and Future Scope", HeadingLevel.HEADING_1),

  heading("8.1 Conclusion", HeadingLevel.HEADING_2),
  body("This project successfully implements a resume-to-job-description matching system that produces an explainable, component-based match score rather than a single opaque number, using structured extraction, hybrid exact-and-semantic skill matching, and an explicitly weighted scoring formula. By naming and individually reporting each scoring component, and by listing specific missing skills rather than only a summary judgement, the system gives a candidate concrete, actionable information rather than only a pass/fail-style verdict. The project demonstrates that large language models can be applied effectively to a comparison and scoring task while keeping the underlying computation transparent and auditable, rather than delegating the entire judgement to a single unexplained model call."),

  heading("8.2 Future Scope", HeadingLevel.HEADING_2),
  bullet("Calibrating the semantic-match similarity threshold against a labeled benchmark of known-equivalent and known-different skill pairs, rather than a spot-checked fixed value."),
  bullet("Support for batch analysis of multiple resumes against one job description, for use in screening rather than only self-assessment."),
  bullet("Resume formatting/structure analysis (e.g. detecting missing standard sections) in addition to content matching."),
  bullet("A history view allowing a candidate to track how their score against a given job description improves after edits."),
  bullet("Detecting and flagging likely keyword-stuffing (skills listed without any supporting evidence elsewhere in the resume)."),
  bullet("Integration with job-board APIs to fetch a job description directly from a URL rather than requiring it to be pasted."),
  pageBreak(),
];

const references = [
  heading("References", HeadingLevel.HEADING_1),
  body("[1] Reimers, N., and Gurevych, I. (2019). Sentence-BERT: Sentence Embeddings using Siamese BERT-Networks. Proceedings of EMNLP-IJCNLP."),
  body("[2] Society for Human Resource Management. Applicant Tracking Systems and resume screening practices — industry guidance."),
  body("[3] OpenAI. Function calling and structured JSON output guidance (design pattern referenced for constrained extraction)."),
  body("[4] Plotly Technologies Inc. Plotly Python Open Source Graphing Library. https://plotly.com/python/"),
  body("[5] Streamlit documentation. https://docs.streamlit.io"),
  body("[6] Groq API documentation. https://console.groq.com/docs"),
  body("[7] PyMuPDF (fitz) documentation, pymupdf4llm module. https://pymupdf.readthedocs.io"),
];

const doc = new Document({
  numbering: { config: [{ reference: "bullet-list", levels: [{ level: 0, format: LevelFormat.BULLET, text: "\u2022", alignment: AlignmentType.LEFT }] }] },
  sections: [
    { properties: {}, children: titlePageChildren },
    { properties: {}, children: certificateChildren },
    { properties: {}, children: abstractChildren },
    { properties: {}, children: tocChildren },
    {
      properties: {},
      headers: { default: new Header({ children: [new Paragraph({ text: CONFIG.PROJECT_TITLE, alignment: AlignmentType.CENTER })] }) },
      footers: { default: new Footer({ children: [new Paragraph({ alignment: AlignmentType.CENTER, children: [new TextRun({ children: [PageNumber.CURRENT] })] })] }) },
      children: [...chapter1, ...chapter2, ...chapter3, ...chapter4, ...chapter5, ...chapter6, ...chapter7, ...chapter8, ...references],
    },
  ],
});

Packer.toBuffer(doc).then((buffer) => {
  fs.writeFileSync(__dirname + "/Resume_JD_Matcher_Report.docx", buffer);
  console.log("Generated Resume_JD_Matcher_Report.docx");
});
