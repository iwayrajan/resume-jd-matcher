"""
matcher.py
----------
Core pipeline: parse resume (PDF/DOCX) + job description text -> structured
extraction via Groq -> weighted scoring across skill match, semantic
similarity, experience, and education -> actionable feedback generation.

This is neither retrieval (nothing is searched/cited) nor text-to-code
(nothing is executed) - it's an extract-score-generate pipeline, the third
distinct architecture pattern in this product line.
"""

import json
import re

import numpy as np
import pymupdf4llm
import docx
from sentence_transformers import SentenceTransformer
from groq import Groq

SKILL_MATCH_THRESHOLD = 0.62  # cosine similarity above which two skill phrases are treated as equivalent

# Scoring weights. Skill match is weighted heaviest since it's the most
# direct, most gameable-by-improvement signal (add the missing skill, if you
# genuinely have it, and the score moves) - deliberately more actionable to a
# student than the semantic-similarity component, which reflects overall
# phrasing/domain closeness and is harder to act on directly.
WEIGHTS = {
    "skill_match": 0.50,
    "semantic_similarity": 0.20,
    "experience_match": 0.15,
    "education_match": 0.15,
}


class ParseError(Exception):
    pass


class ResumeMatcher:
    def __init__(self, embed_model_name: str = "all-MiniLM-L6-v2"):
        self.embed_model = SentenceTransformer(embed_model_name)

    # ---------- Step 1: Parsing ----------
    @staticmethod
    def parse_resume(path: str) -> str:
        if path.lower().endswith(".pdf"):
            return pymupdf4llm.to_markdown(path)
        elif path.lower().endswith(".docx"):
            document = docx.Document(path)
            return "\n".join(p.text for p in document.paragraphs if p.text.strip())
        else:
            raise ParseError(f"Unsupported resume file type: {path} (use PDF or DOCX)")

    # ---------- Step 2: Structured extraction via Groq ----------
    @staticmethod
    def _extract_json(client: Groq, model: str, prompt: str) -> dict:
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0,
            response_format={"type": "json_object"},
        )
        return json.loads(response.choices[0].message.content)

    def extract_jd_requirements(self, jd_text: str, groq_api_key: str, model: str = "llama-3.3-70b-versatile") -> dict:
        client = Groq(api_key=groq_api_key)
        prompt = f"""Extract structured requirements from this job description. Return ONLY valid JSON, no \
other text, with exactly this shape:
{{
  "job_title": "string",
  "must_have_skills": ["skill1", "skill2", ...],
  "nice_to_have_skills": ["skill1", ...],
  "min_experience_years": 0,
  "education_requirements": ["requirement1", ...],
  "key_responsibilities": ["responsibility1", ...]
}}
Use an empty list or 0 for anything not mentioned. Keep skill names short (2-4 words each).

Job description:
{jd_text}
"""
        return self._extract_json(client, model, prompt)

    def extract_resume_profile(self, resume_text: str, groq_api_key: str, model: str = "llama-3.3-70b-versatile") -> dict:
        client = Groq(api_key=groq_api_key)
        prompt = f"""Extract structured information from this resume. Return ONLY valid JSON, no other text, \
with exactly this shape:
{{
  "candidate_name": "string",
  "skills": ["skill1", "skill2", ...],
  "total_experience_years": 0,
  "education": ["degree/institution", ...],
  "projects": ["project name/description", ...],
  "certifications": ["cert1", ...]
}}
Estimate total_experience_years from the work history dates; use 0 if this looks like a fresher/student \
resume with no professional experience listed. Keep skill names short (2-4 words each).

Resume:
{resume_text}
"""
        return self._extract_json(client, model, prompt)

    # ---------- Step 3: Scoring ----------
    def _embed(self, texts: list[str]) -> np.ndarray:
        return self.embed_model.encode(texts, convert_to_numpy=True)

    @staticmethod
    def _cosine_sim(a: np.ndarray, b: np.ndarray) -> float:
        denom = (np.linalg.norm(a) * np.linalg.norm(b))
        if denom == 0:
            return 0.0
        return float(np.dot(a, b) / denom)

    def _skill_coverage(self, required_skills: list[str], resume_skills: list[str]) -> tuple[float, list[str]]:
        """Returns (fraction_matched, list_of_missing_skills). A required skill
        counts as matched if it appears as a substring of a resume skill (or
        vice versa, case-insensitive) OR its embedding is close enough to any
        resume skill's embedding to be considered equivalent (e.g. "ML" and
        "Machine Learning")."""
        if not required_skills:
            return 1.0, []
        if not resume_skills:
            return 0.0, list(required_skills)

        resume_lower = [s.lower() for s in resume_skills]
        resume_embeddings = self._embed(resume_skills)

        missing = []
        matched_count = 0
        for req in required_skills:
            req_lower = req.lower()
            exact_hit = any(req_lower in r or r in req_lower for r in resume_lower)
            if exact_hit:
                matched_count += 1
                continue
            req_embedding = self._embed([req])[0]
            sims = [self._cosine_sim(req_embedding, r_emb) for r_emb in resume_embeddings]
            if max(sims, default=0) >= SKILL_MATCH_THRESHOLD:
                matched_count += 1
            else:
                missing.append(req)

        return matched_count / len(required_skills), missing

    def _experience_score(self, required_years: float, actual_years: float) -> float:
        if not required_years or required_years <= 0:
            return 1.0
        if actual_years >= required_years:
            return 1.0
        return max(0.0, actual_years / required_years)

    def _education_score(self, required: list[str], actual: list[str]) -> float:
        if not required:
            return 1.0
        if not actual:
            return 0.0
        actual_lower = " | ".join(actual).lower()
        matched = sum(1 for req in required if req.lower() in actual_lower)
        # Partial credit even without an exact substring hit, since resumes
        # phrase degrees inconsistently (e.g. "B.Tech" vs "Bachelor of Technology")
        if matched == 0:
            req_emb = self._embed(required)
            act_emb = self._embed(actual)
            sims = [max(self._cosine_sim(r, a) for a in act_emb) for r in req_emb]
            matched = sum(1 for s in sims if s >= SKILL_MATCH_THRESHOLD)
        return min(1.0, matched / len(required))

    def score(self, resume_profile: dict, jd_requirements: dict, resume_text: str, jd_text: str) -> dict:
        must_have = jd_requirements.get("must_have_skills", [])
        nice_to_have = jd_requirements.get("nice_to_have_skills", [])
        resume_skills = resume_profile.get("skills", [])

        must_coverage, missing_must = self._skill_coverage(must_have, resume_skills)
        nice_coverage, missing_nice = self._skill_coverage(nice_to_have, resume_skills)
        skill_match = 0.8 * must_coverage + 0.2 * nice_coverage

        resume_emb = self._embed([resume_text[:3000]])[0]  # cap length for speed; enough signal for overall similarity
        jd_emb = self._embed([jd_text[:3000]])[0]
        semantic_similarity = max(0.0, self._cosine_sim(resume_emb, jd_emb))

        experience_match = self._experience_score(
            jd_requirements.get("min_experience_years", 0),
            resume_profile.get("total_experience_years", 0),
        )
        education_match = self._education_score(
            jd_requirements.get("education_requirements", []),
            resume_profile.get("education", []),
        )

        overall = (
            WEIGHTS["skill_match"] * skill_match
            + WEIGHTS["semantic_similarity"] * semantic_similarity
            + WEIGHTS["experience_match"] * experience_match
            + WEIGHTS["education_match"] * education_match
        )

        return {
            "overall_score": round(overall * 100),
            "breakdown": {
                "skill_match": round(skill_match * 100),
                "semantic_similarity": round(semantic_similarity * 100),
                "experience_match": round(experience_match * 100),
                "education_match": round(education_match * 100),
            },
            "missing_must_have_skills": missing_must,
            "missing_nice_to_have_skills": missing_nice,
        }

    # ---------- Step 4: Feedback generation ----------
    def generate_feedback(self, resume_profile: dict, jd_requirements: dict, score_result: dict,
                           groq_api_key: str, model: str = "llama-3.3-70b-versatile") -> str:
        client = Groq(api_key=groq_api_key)
        prompt = f"""A candidate's resume was scored against a job description. Give specific, actionable \
feedback in markdown, organized as:
1. **Top priority additions** - the most important missing skills to genuinely add (only if the candidate \
plausibly has related experience already; don't suggest fabricating skills)
2. **Resume improvements** - 3-4 specific suggestions to better highlight relevant experience already present
3. **ATS formatting tips** - brief, generic best practices (keyword placement, standard section headers, etc.)

Keep it concise and specific to this candidate and this job, not generic advice.

Job title: {jd_requirements.get('job_title', 'Unknown')}
Missing must-have skills: {score_result['missing_must_have_skills']}
Missing nice-to-have skills: {score_result['missing_nice_to_have_skills']}
Candidate's existing skills: {resume_profile.get('skills', [])}
Candidate's projects: {resume_profile.get('projects', [])}
Overall score: {score_result['overall_score']}/100
"""
        response = client.chat.completions.create(
            model=model,
            messages=[{"role": "user", "content": prompt}],
            temperature=0.3,
        )
        return response.choices[0].message.content

    # ---------- End to end ----------
    def analyze(self, resume_text: str, jd_text: str, groq_api_key: str, model: str = "llama-3.3-70b-versatile") -> dict:
        jd_requirements = self.extract_jd_requirements(jd_text, groq_api_key, model)
        resume_profile = self.extract_resume_profile(resume_text, groq_api_key, model)
        score_result = self.score(resume_profile, jd_requirements, resume_text, jd_text)
        feedback = self.generate_feedback(resume_profile, jd_requirements, score_result, groq_api_key, model)
        return {
            "jd_requirements": jd_requirements,
            "resume_profile": resume_profile,
            "score": score_result,
            "feedback": feedback,
        }
