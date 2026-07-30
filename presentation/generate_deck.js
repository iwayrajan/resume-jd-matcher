const pptxgen = require("pptxgenjs");
const path = require("path");

const CONFIG = require("../student_config.json");
const ASSET = (f) => path.join(__dirname, f);

const NAVY = "0B3D62";
const TEAL = "0F6E56";
const PURPLE = "534AB7";
const WHITE = "FFFFFF";
const OFFWHITE = "F5F6F7";
const TEXT_DARK = "1A1A1A";
const TEXT_MUTED = "5F5E5A";
const CARD_BG = "FFFFFF";
const CARD_BORDER = "E2E4E8";

const FONT_HEAD = "Cambria";
const FONT_BODY = "Calibri";

let pres = new pptxgen();
pres.layout = "LAYOUT_WIDE";
const SW = 13.33, SH = 7.5;

function iconCircle(slide, { x, y, size = 0.6, icon, bg = NAVY }) {
  slide.addShape("ellipse", { x, y, w: size, h: size, fill: { color: bg }, line: { type: "none" } });
  const pad = size * 0.2;
  slide.addImage({ path: ASSET(`icons_${icon}.png`), x: x + pad / 2, y: y + pad / 2, w: size - pad, h: size - pad });
}
function slideTitle(slide, text, opts = {}) {
  slide.addText(text, { x: 0.6, y: 0.45, w: SW - 1.2, h: 0.7, fontFace: FONT_HEAD, fontSize: 30, bold: true, color: TEXT_DARK, margin: 0, ...opts });
}
function pageNum(slide, n) {
  slide.addText(String(n), { x: SW - 0.7, y: SH - 0.45, w: 0.4, h: 0.3, fontFace: FONT_BODY, fontSize: 10, color: TEXT_MUTED, align: "right", margin: 0 });
}

// Slide 1 — Title
{
  const s = pres.addSlide();
  s.addShape("rect", { x: 0, y: 0, w: SW, h: SH, fill: { color: NAVY }, line: { type: "none" } });
  s.addImage({ path: ASSET("icons_target.png"), x: SW - 2.3, y: 0.6, w: 1.3, h: 1.3, transparency: 15 });
  s.addText("Resume / JD Matcher", { x: 0.9, y: 2.5, w: SW - 1.8, h: 1.1, fontFace: FONT_HEAD, fontSize: 44, bold: true, color: WHITE, margin: 0 });
  s.addText("An ATS-Style Match Scoring and Gap Analysis System", { x: 0.9, y: 3.55, w: SW - 1.8, h: 0.6, fontFace: FONT_BODY, fontSize: 20, color: "CADCFC", margin: 0 });
  s.addText(`[${CONFIG.PROJECT_TYPE}]`, { x: 0.9, y: 4.25, w: 6, h: 0.4, fontFace: FONT_BODY, fontSize: 14, italic: true, color: "8FA8C2", margin: 0 });
  s.addText([
    { text: CONFIG.STUDENT_NAME, options: { bold: true, breakLine: true } },
    { text: `${CONFIG.COLLEGE_NAME}  |  ${CONFIG.ACADEMIC_YEAR}`, options: {} },
  ], { x: 0.9, y: 6.5, w: 8, h: 0.7, fontFace: FONT_BODY, fontSize: 14, color: WHITE, margin: 0 });
}

// Slide 2 — Problem
{
  const s = pres.addSlide();
  slideTitle(s, "The problem");
  s.addText([
    { text: "ATS systems filter resumes before a human ever sees them", options: { bold: true, breakLine: true, paraSpaceAfter: 10 } },
    { text: "Candidates rarely know how well their resume actually matches a specific job", options: { bullet: true, breakLine: true, paraSpaceAfter: 8 } },
    { text: "Generic resume advice doesn't say what to fix for *this* job posting", options: { bullet: true, breakLine: true, paraSpaceAfter: 8 } },
    { text: "A single opaque \"AI score\" isn't actionable \u2014 it needs to say why", options: { bullet: true } },
  ], { x: 0.6, y: 1.6, w: 7.0, h: 4.5, fontFace: FONT_BODY, fontSize: 16, color: TEXT_DARK, margin: 0, valign: "top", lineSpacingMultiple: 1.15 });

  s.addShape("roundRect", { x: 8.1, y: 1.9, w: 4.6, h: 3.6, rectRadius: 0.12, fill: { color: OFFWHITE }, line: { color: CARD_BORDER, width: 1 } });
  iconCircle(s, { x: 8.5, y: 2.25, size: 0.8, icon: "warning", bg: PURPLE });
  s.addText("\u201cWhy did my application get rejected before anyone even read it?\u201d", { x: 8.4, y: 3.25, w: 3.9, h: 1.9, fontFace: FONT_HEAD, fontSize: 15, italic: true, color: NAVY, margin: 0 });
  pageNum(s, 2);
}

// Slide 3 — Objectives
{
  const s = pres.addSlide();
  slideTitle(s, "Objectives");
  const objectives = [
    { icon: "extract", title: "Extract structured data", desc: "Turn both resume and JD into comparable structured fields" },
    { icon: "search", title: "Match skills, not just words", desc: "Exact + semantic matching so equivalent phrasing counts" },
    { icon: "target", title: "Score transparently", desc: "One overall score, built from four named components" },
    { icon: "robot", title: "Give specific feedback", desc: "Actionable suggestions, not generic resume advice" },
  ];
  const colW = 5.9, gapX = 0.5, startX = 0.6, rowY = [1.7, 3.55];
  objectives.forEach((o, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = startX + col * (colW + gapX), y = rowY[row];
    iconCircle(s, { x, y: y + 0.1, size: 0.75, icon: o.icon, bg: NAVY });
    s.addText(o.title, { x: x + 1.0, y, w: colW - 1.0, h: 0.4, fontFace: FONT_HEAD, fontSize: 16, bold: true, color: TEXT_DARK, margin: 0, valign: "top" });
    s.addText(o.desc, { x: x + 1.0, y: y + 0.45, w: colW - 1.0, h: 0.8, fontFace: FONT_BODY, fontSize: 13, color: TEXT_MUTED, margin: 0, valign: "top" });
  });
  pageNum(s, 3);
}

// Slide 4 — Architecture
{
  const s = pres.addSlide();
  slideTitle(s, "System architecture");
  s.addText("Extract structured data first, then score and generate feedback from it", { x: 0.6, y: 1.15, w: SW - 1.2, h: 0.4, fontFace: FONT_BODY, fontSize: 14, italic: true, color: TEXT_MUTED, margin: 0 });
  s.addImage({ path: ASSET("architecture_diagram.png"), x: 2.98, y: 1.9, w: 7.37, h: 3.47 });
  pageNum(s, 4);
}

// Slide 5 — Scoring methodology
{
  const s = pres.addSlide();
  slideTitle(s, "How the score is built");
  s.addText("Four named, weighted components \u2014 not one opaque model judgement", { x: 0.6, y: 1.15, w: SW - 1.2, h: 0.4, fontFace: FONT_BODY, fontSize: 14, italic: true, color: TEXT_MUTED, margin: 0 });
  s.addImage({ path: ASSET("scoring_methodology_diagram.png"), x: 2.2, y: 1.8, w: 8.9, h: 4.19 });
  pageNum(s, 5);
}

// Slide 6 — Tech stack
{
  const s = pres.addSlide();
  slideTitle(s, "Technology stack");
  const stack = [
    { icon: "python", label: "Python 3", sub: "Core language" },
    { icon: "layer", label: "Streamlit", sub: "Upload + score dashboard" },
    { icon: "extract", label: "pymupdf4llm", sub: "PDF resume parsing" },
    { icon: "book", label: "python-docx", sub: "DOCX resume parsing" },
    { icon: "brain", label: "sentence-transformers", sub: "Semantic skill matching" },
    { icon: "chunk", label: "Plotly", sub: "Radar chart breakdown" },
    { icon: "bolt", label: "Groq API", sub: "Extraction + feedback" },
    { icon: "check", label: "JSON mode", sub: "Reliable structured output" },
  ];
  const cols = 4, cardW = 2.85, cardH = 1.9, gapX = 0.28, gapY = 0.35, startX = 0.6, startY = 1.7;
  stack.forEach((t, i) => {
    const col = i % cols, row = Math.floor(i / cols);
    const x = startX + col * (cardW + gapX), y = startY + row * (cardH + gapY);
    s.addShape("roundRect", { x, y, w: cardW, h: cardH, rectRadius: 0.1, fill: { color: CARD_BG }, line: { color: CARD_BORDER, width: 1 } });
    iconCircle(s, { x: x + 0.25, y: y + 0.25, size: 0.6, icon: t.icon, bg: NAVY });
    s.addText(t.label, { x: x + 0.2, y: y + 0.95, w: cardW - 0.4, h: 0.55, fontFace: FONT_HEAD, fontSize: 12.5, bold: true, color: TEXT_DARK, margin: 0, valign: "top" });
    s.addText(t.sub, { x: x + 0.2, y: y + 1.45, w: cardW - 0.4, h: 0.4, fontFace: FONT_BODY, fontSize: 10, color: TEXT_MUTED, margin: 0 });
  });
  pageNum(s, 6);
}

// Slide 7 — Exact vs semantic matching
{
  const s = pres.addSlide();
  slideTitle(s, "Why semantic skill matching");
  s.addText("Example: the JD asks for \u201cML\u201d, the resume says \u201cMachine Learning\u201d", { x: 0.6, y: 1.15, w: SW - 1.2, h: 0.4, fontFace: FONT_BODY, fontSize: 14, italic: true, color: TEXT_MUTED, margin: 0 });

  s.addShape("roundRect", { x: 0.6, y: 1.75, w: 5.8, h: 4.6, rectRadius: 0.12, fill: { color: "FAECE7" }, line: { type: "none" } });
  s.addText("Exact match only", { x: 1.0, y: 2.0, w: 5.0, h: 0.4, fontFace: FONT_HEAD, fontSize: 16, bold: true, color: "712B13", margin: 0 });
  s.addText([
    { text: "\u201cML\u201d is not a substring of \u201cMachine Learning\u201d", options: { bullet: true, breakLine: true, paraSpaceAfter: 8 } },
    { text: "Skill counted as missing, unfairly", options: { bullet: true, breakLine: true, paraSpaceAfter: 8 } },
    { text: "Score penalizes a candidate who actually qualifies", options: { bullet: true } },
  ], { x: 1.0, y: 2.5, w: 5.0, h: 3.5, fontFace: FONT_BODY, fontSize: 14, color: TEXT_DARK, margin: 0, valign: "top", lineSpacingMultiple: 1.15 });

  s.addShape("roundRect", { x: 6.9, y: 1.75, w: 5.8, h: 4.6, rectRadius: 0.12, fill: { color: "E1F5EE" }, line: { type: "none" } });
  s.addText("Exact + semantic match", { x: 7.3, y: 2.0, w: 5.0, h: 0.4, fontFace: FONT_HEAD, fontSize: 16, bold: true, color: "085041", margin: 0 });
  s.addText([
    { text: "Embeddings recognize \u201cML\u201d and \u201cMachine Learning\u201d as equivalent", options: { bullet: true, breakLine: true, paraSpaceAfter: 8 } },
    { text: "Similarity above threshold (0.62) counts as a match", options: { bullet: true, breakLine: true, paraSpaceAfter: 8 } },
    { text: "Score correctly credits the candidate", options: { bullet: true } },
  ], { x: 7.3, y: 2.5, w: 5.0, h: 3.5, fontFace: FONT_BODY, fontSize: 14, color: TEXT_DARK, margin: 0, valign: "top", lineSpacingMultiple: 1.15 });
  pageNum(s, 7);
}

// Slide 8 — Score differentiation demo
{
  const s = pres.addSlide();
  slideTitle(s, "The score has to actually differentiate");
  s.addText([
    { text: "Same resume, two different job descriptions", options: { bullet: true, breakLine: true, paraSpaceAfter: 10 } },
    { text: "A backend-focused resume vs. a Backend Developer JD", options: { bullet: true, breakLine: true, paraSpaceAfter: 10 } },
    { text: "The same resume vs. a Data Scientist JD", options: { bullet: true, breakLine: true, paraSpaceAfter: 10 } },
    { text: "A credible tool should score these very differently \u2014 not both \"pretty good\"", options: { bullet: true } },
  ], { x: 0.6, y: 1.8, w: 6.2, h: 4, fontFace: FONT_BODY, fontSize: 16, color: TEXT_DARK, margin: 0, valign: "top", lineSpacingMultiple: 1.2 });

  s.addShape("roundRect", { x: 7.3, y: 1.9, w: 2.7, h: 3.9, rectRadius: 0.12, fill: { color: "E1F5EE" }, line: { type: "none" } });
  s.addText("Backend JD", { x: 7.3, y: 2.15, w: 2.7, h: 0.4, align: "center", fontFace: FONT_HEAD, fontSize: 14, bold: true, color: "085041", margin: 0 });
  s.addText("Strong\nmatch", { x: 7.3, y: 3.3, w: 2.7, h: 1.2, align: "center", fontFace: FONT_HEAD, fontSize: 22, bold: true, color: "085041", margin: 0 });

  s.addShape("roundRect", { x: 10.2, y: 1.9, w: 2.7, h: 3.9, rectRadius: 0.12, fill: { color: "FAECE7" }, line: { type: "none" } });
  s.addText("Data Scientist JD", { x: 10.2, y: 2.15, w: 2.7, h: 0.4, align: "center", fontFace: FONT_HEAD, fontSize: 14, bold: true, color: "712B13", margin: 0 });
  s.addText("Weak\nmatch", { x: 10.2, y: 3.3, w: 2.7, h: 1.2, align: "center", fontFace: FONT_HEAD, fontSize: 22, bold: true, color: "712B13", margin: 0 });
  pageNum(s, 8);
}

// Slide 9 — Feedback example
{
  const s = pres.addSlide();
  slideTitle(s, "Specific, not generic, feedback");
  s.addShape("roundRect", { x: 0.6, y: 1.8, w: 12.1, h: 4.3, rectRadius: 0.12, fill: { color: OFFWHITE }, line: { color: CARD_BORDER, width: 1 } });
  s.addText([
    { text: "Top priority additions", options: { bold: true, breakLine: true, paraSpaceAfter: 6, fontSize: 15, color: NAVY } },
    { text: "Add Docker experience \u2014 you've used containerized deployments in your RAG chatbot project; make that explicit.", options: { bullet: true, breakLine: true, paraSpaceAfter: 12 } },
    { text: "Resume improvements", options: { bold: true, breakLine: true, paraSpaceAfter: 6, fontSize: 15, color: NAVY } },
    { text: "Quantify the impact of your Django internship project (e.g. \u201creduced processing time by X%\u201d).", options: { bullet: true, breakLine: true, paraSpaceAfter: 12 } },
    { text: "ATS formatting tips", options: { bold: true, breakLine: true, paraSpaceAfter: 6, fontSize: 15, color: NAVY } },
    { text: "Use standard section headers (\u201cExperience\u201d, \u201cEducation\u201d) so automated parsers read them correctly.", options: { bullet: true } },
  ], { x: 1.0, y: 2.1, w: 11.3, h: 3.7, fontFace: FONT_BODY, fontSize: 13.5, color: TEXT_DARK, margin: 0, valign: "top", lineSpacingMultiple: 1.15 });
  pageNum(s, 9);
}

// Slide 10 — Testing & results
{
  const s = pres.addSlide();
  slideTitle(s, "Testing & results");
  s.addText("10", { x: 0.7, y: 1.7, w: 2.6, h: 1.5, fontFace: FONT_HEAD, fontSize: 62, bold: true, color: TEAL, margin: 0, align: "center" });
  s.addText("/ 10", { x: 3.1, y: 2.2, w: 1.2, h: 0.9, fontFace: FONT_HEAD, fontSize: 28, bold: true, color: TEXT_MUTED, margin: 0 });
  s.addText("test cases passed", { x: 0.7, y: 3.15, w: 3.2, h: 0.4, fontFace: FONT_BODY, fontSize: 13, color: TEXT_MUTED, align: "center", margin: 0 });

  const results = [
    { icon: "check", text: "Both PDF and DOCX resumes parse correctly" },
    { icon: "check", text: "Exact and semantic skill matching both verified" },
    { icon: "check", text: "Experience partial-credit scoring verified" },
    { icon: "check", text: "Strong-match and weak-match scores genuinely differ" },
    { icon: "check", text: "Full pipeline wiring verified end-to-end" },
  ];
  let ry = 1.65;
  results.forEach((r) => {
    iconCircle(s, { x: 4.7, y: ry, size: 0.45, icon: r.icon, bg: TEAL });
    s.addText(r.text, { x: 5.35, y: ry - 0.05, w: 7.3, h: 0.55, fontFace: FONT_BODY, fontSize: 13.5, color: TEXT_DARK, margin: 0, valign: "middle" });
    ry += 0.85;
  });
  pageNum(s, 10);
}

// Slide 11 — Demo
{
  const s = pres.addSlide();
  slideTitle(s, "Demo");
  const shots = ["Screenshot: upload + JD input screen", "Screenshot: strong-match score + radar chart", "Screenshot: weak-match score + feedback"];
  const w = 3.85, h = 3.9, gap = 0.35, startX = 0.6, y = 1.9;
  shots.forEach((label, i) => {
    const x = startX + i * (w + gap);
    s.addShape("roundRect", { x, y, w, h, rectRadius: 0.1, fill: { color: OFFWHITE }, line: { color: CARD_BORDER, width: 1, dashType: "dash" } });
    s.addText("[ insert screenshot ]", { x, y: y + h / 2 - 0.5, w, h: 0.4, align: "center", fontFace: FONT_BODY, fontSize: 12, italic: true, color: TEXT_MUTED, margin: 0 });
    s.addText(label, { x: x + 0.2, y: y + h - 0.6, w: w - 0.4, h: 0.5, fontFace: FONT_BODY, fontSize: 12, color: TEXT_DARK, align: "center", margin: 0 });
  });
  pageNum(s, 11);
}

// Slide 12 — Challenges faced
{
  const s = pres.addSlide();
  slideTitle(s, "Challenges faced");
  const challenges = [
    { icon: "warning", title: "Different phrasings of the same skill", desc: "Solved with exact-match-first, semantic-match-fallback skill comparison" },
    { icon: "target", title: "Making the score explainable", desc: "Solved by decomposing it into four named, individually reported components" },
    { icon: "search", title: "Estimating experience from free text", desc: "Solved by having the model estimate years from work-history dates directly" },
    { icon: "chunk", title: "Avoiding generic, unhelpful feedback", desc: "Solved by grounding the feedback prompt in the specific score breakdown and missing skills" },
  ];
  const colW = 5.9, gapX = 0.5, startX = 0.6, rowY = [1.65, 3.9];
  challenges.forEach((c, i) => {
    const col = i % 2, row = Math.floor(i / 2);
    const x = startX + col * (colW + gapX), y = rowY[row];
    iconCircle(s, { x, y: y + 0.05, size: 0.65, icon: c.icon, bg: PURPLE });
    s.addText(c.title, { x: x + 0.85, y, w: colW - 0.85, h: 0.4, fontFace: FONT_HEAD, fontSize: 15, bold: true, color: TEXT_DARK, margin: 0, valign: "top" });
    s.addText(c.desc, { x: x + 0.85, y: y + 0.42, w: colW - 0.85, h: 1.4, fontFace: FONT_BODY, fontSize: 12.5, color: TEXT_MUTED, margin: 0, valign: "top", lineSpacingMultiple: 1.1 });
  });
  pageNum(s, 12);
}

// Slide 13 — Future scope
{
  const s = pres.addSlide();
  slideTitle(s, "Future scope");
  const future = [
    { icon: "future", text: "Calibrate the similarity threshold against a labeled skill-pair benchmark" },
    { icon: "database", text: "Batch analysis of multiple resumes against one job description" },
    { icon: "target", text: "Resume structure/formatting analysis, not just content matching" },
    { icon: "chat", text: "Fetch job descriptions directly from a URL instead of pasting" },
  ];
  let fy = 1.85;
  future.forEach((f) => {
    iconCircle(s, { x: 0.7, y: fy, size: 0.6, icon: f.icon, bg: TEAL });
    s.addText(f.text, { x: 1.5, y: fy, w: 10.8, h: 0.6, fontFace: FONT_BODY, fontSize: 16, color: TEXT_DARK, margin: 0, valign: "middle" });
    fy += 1.05;
  });
  pageNum(s, 13);
}

// Slide 14 — Thank you
{
  const s = pres.addSlide();
  s.addShape("rect", { x: 0, y: 0, w: SW, h: SH, fill: { color: NAVY }, line: { type: "none" } });
  s.addText("Thank you", { x: 0.9, y: 2.9, w: SW - 1.8, h: 1.0, fontFace: FONT_HEAD, fontSize: 44, bold: true, color: WHITE, margin: 0 });
  s.addText("Questions?", { x: 0.9, y: 3.9, w: SW - 1.8, h: 0.6, fontFace: FONT_BODY, fontSize: 20, color: "CADCFC", margin: 0 });
}

pres.writeFile({ fileName: path.join(__dirname, "Resume_JD_Matcher_Presentation.pptx") }).then(() => {
  console.log("Generated Resume_JD_Matcher_Presentation.pptx");
});
