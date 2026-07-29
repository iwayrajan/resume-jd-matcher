"""
Resume / JD Matcher - upload a resume, paste a job description, get an ATS-style
match score with a category breakdown, missing-skill gaps, and specific
improvement suggestions.

Run with: streamlit run app.py
"""

import os
import tempfile

import streamlit as st
import plotly.graph_objects as go

from matcher import ResumeMatcher, ParseError

st.set_page_config(page_title="Resume / JD Matcher", page_icon="\U0001F4CB", layout="wide")

with st.sidebar:
    st.header("Settings")
    default_key = os.environ.get("GROQ_API_KEY", "")
    groq_key = st.text_input("Groq API key", value=default_key, type="password",
                              help="Free key from https://console.groq.com/keys")
    model_name = st.selectbox("Groq model", ["llama-3.3-70b-versatile", "llama-3.1-8b-instant"])
    st.markdown("---")
    st.caption(
        "Pipeline: parse resume \u2192 Groq extracts structured JD requirements and resume profile \u2192 "
        "weighted scoring (skill match, semantic similarity, experience, education) \u2192 "
        "Groq generates specific improvement suggestions."
    )


@st.cache_resource(show_spinner="Loading embedding model...")
def get_matcher():
    return ResumeMatcher()


st.title("\U0001F4CB Resume / JD Matcher")
st.caption("Upload a resume and paste a job description to get an ATS-style match score and specific feedback.")

col1, col2 = st.columns(2)
with col1:
    resume_file = st.file_uploader("Upload resume (PDF or DOCX)", type=["pdf", "docx"])
with col2:
    jd_text = st.text_area("Paste the job description", height=220, placeholder="Paste the full job description here...")

analyze_clicked = st.button("Analyze Match", type="primary", disabled=not (resume_file and jd_text))

if analyze_clicked:
    if not groq_key:
        st.error("Add your Groq API key in the sidebar first.")
    else:
        matcher = get_matcher()

        with tempfile.NamedTemporaryFile(delete=False, suffix="_" + resume_file.name) as tmp:
            tmp.write(resume_file.getvalue())
            tmp_path = tmp.name

        try:
            with st.spinner("Parsing resume..."):
                resume_text = matcher.parse_resume(tmp_path)
        except ParseError as e:
            st.error(str(e))
            st.stop()

        with st.spinner("Analyzing match (this calls Groq 3 times: JD extraction, resume extraction, feedback)..."):
            try:
                result = matcher.analyze(resume_text, jd_text, groq_api_key=groq_key, model=model_name)
            except Exception as e:
                st.error(f"Error during analysis: {e}")
                st.stop()

        score = result["score"]
        breakdown = score["breakdown"]

        # ---------------- Overall score ----------------
        st.markdown("---")
        score_col, chart_col = st.columns([1, 2])

        with score_col:
            st.metric("Overall Match Score", f"{score['overall_score']} / 100")
            candidate = result["resume_profile"].get("candidate_name", "Candidate")
            job_title = result["jd_requirements"].get("job_title", "this role")
            st.caption(f"{candidate} vs. {job_title}")

        with chart_col:
            categories = ["Skill Match", "Semantic Fit", "Experience", "Education"]
            values = [breakdown["skill_match"], breakdown["semantic_similarity"],
                      breakdown["experience_match"], breakdown["education_match"]]
            fig = go.Figure(data=go.Scatterpolar(
                r=values + [values[0]], theta=categories + [categories[0]],
                fill="toself", line_color="#534AB7",
            ))
            fig.update_layout(
                polar=dict(radialaxis=dict(visible=True, range=[0, 100])),
                showlegend=False, height=300, margin=dict(l=40, r=40, t=20, b=20),
            )
            st.plotly_chart(fig, use_container_width=True)

        # ---------------- Missing skills ----------------
        st.markdown("### Skill Gaps")
        gap_col1, gap_col2 = st.columns(2)
        with gap_col1:
            st.markdown("**Missing must-have skills**")
            if score["missing_must_have_skills"]:
                for s in score["missing_must_have_skills"]:
                    st.markdown(f"- {s}")
            else:
                st.markdown("*None \u2014 all must-have skills covered.*")
        with gap_col2:
            st.markdown("**Missing nice-to-have skills**")
            if score["missing_nice_to_have_skills"]:
                for s in score["missing_nice_to_have_skills"]:
                    st.markdown(f"- {s}")
            else:
                st.markdown("*None \u2014 all nice-to-have skills covered.*")

        # ---------------- Feedback ----------------
        st.markdown("### Improvement Suggestions")
        st.markdown(result["feedback"])

        # ---------------- Extracted profiles (for transparency/debugging) ----------------
        with st.expander("Show extracted JD requirements and resume profile"):
            ecol1, ecol2 = st.columns(2)
            with ecol1:
                st.markdown("**Job requirements (extracted)**")
                st.json(result["jd_requirements"])
            with ecol2:
                st.markdown("**Resume profile (extracted)**")
                st.json(result["resume_profile"])
else:
    st.info("Upload a resume and paste a job description, then click Analyze Match.")
