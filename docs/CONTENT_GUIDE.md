# Codempress Content Production Guide

**Version:** 1.0

> This document defines the standards, workflows, templates, and quality
> requirements for creating educational content across Codempress. Every
> lesson, project, assessment, and AI-generated artifact must follow
> this guide.

---

## 1. Core Principles

- **Single Source of Truth:** A topic is written once and reused
  across all career paths.
- **Concept First:** Teach principles before tools.
- **Project Driven:** Every module should culminate in a practical
  project.
- **AI Assisted, Human Reviewed:** AI accelerates production;
  reviewers ensure accuracy.
- **Progressive Learning:** Content scales from ELI5 to professional
  engineering.

---

## 2. Content Hierarchy

```text
Domain
 └── Category
      └── Module
           └── Topic
                └── Lesson
                     ├── Examples
                     ├── Practice
                     ├── Quiz
                     ├── Project
                     └── Interview Prep
```

---

## 3. Standard Topic Template

Every topic MUST contain:

1. Metadata
2. Learning Objectives
3. Prerequisites
4. Estimated Duration
5. ELI5 Explanation
6. Beginner Explanation
7. Intermediate Explanation
8. Advanced Explanation
9. Real-world Use Cases
10. Worked Examples
11. Hands-on Exercises
12. Mini Project
13. Common Mistakes
14. Best Practices
15. Cheat Sheet
16. Quiz
17. Interview Questions
18. Further Reading
19. AI Tutor Prompt
20. Mastery Checklist

---

## 4. Metadata Schema

```yaml
id:
title:
domain:
category:
module:
difficulty:
estimated_time:
tags:
prerequisites:
career_paths:
last_reviewed:
version:
```

---

## 5. Lesson Writing Standards

- One concept per lesson.
- Use clear headings.
- Introduce new terminology gradually.
- Include diagrams where useful.
- Show at least two practical examples.
- Explain *why* something matters before *how* to use it.

---

## 6. Code Example Standards

Every code example must include:

- Objective
- Source code
- Line-by-line explanation
- Expected output
- Complexity (if applicable)
- Common pitfalls
- Improved version (when relevant)

Examples should be executable and use current language versions.

---

## 7. Project Standards

Every project includes:

- Title
- Goal
- Learning outcomes
- Difficulty
- Estimated duration
- Required skills
- Requirements
- Deliverables
- Stretch goals
- Evaluation rubric

Projects should map to portfolio-quality work whenever possible.

---

## 8. Assessment Standards

Assessment types:

- Multiple choice
- Short answer
- Coding challenge
- Debugging task
- Design exercise
- Architecture review
- Project evaluation
- Mock interview

Each assessment must test stated learning objectives.

---

## 9. AI Prompt Standards

Each topic includes prompts for:

- Explain simply
- Generate examples
- Create exercises
- Create quiz
- Review code
- Suggest improvements
- Generate interview questions
- Create revision notes

Prompts should be deterministic, reusable, and version-controlled.

---

## 10. Accessibility

- Plain language for beginners.
- Clear formatting.
- Descriptive headings.
- Keyboard-friendly interactions.
- Avoid relying only on color to convey meaning.

---

## 11. Quality Checklist

Before publishing, verify:

- Technical accuracy
- Grammar and spelling
- Logical flow
- Up-to-date information
- Correct code execution
- Appropriate difficulty
- Functional links and references
- Consistent terminology

---

## 12. Review Workflow

```text
Draft
  │
AI Review
  │
Technical Review
  │
Editorial Review
  │
Quality Assurance
  │
Publish
  │
Continuous Feedback
```

---

## 13. Versioning

- Major version: structural/content overhaul.
- Minor version: new examples or sections.
- Patch: typo, clarification, or bug fix.

Maintain a changelog for every topic.

---

## 14. Content Maintenance

Review topics:

- Every 6 months for stable subjects.
- Every 3 months for rapidly evolving technologies.
- Immediately after major breaking changes.

Deprecated content should remain archived with migration guidance.

---

## 15. Success Metrics

Measure:

- Lesson completion
- Quiz performance
- Project completion
- Interview readiness
- Learner satisfaction
- Time to mastery
- Content quality score

---

## 16. Definition of Done

A topic is complete only when it has:

- Approved metadata
- Full lesson
- Working code examples
- Exercises
- Project
- Assessment
- Interview preparation
- AI prompts
- Review approval
- Version history
- Published status

---

## Appendix: Recommended Folder Structure

```text
topic/
├── metadata.yaml
├── lesson.md
├── examples/
├── exercises/
├── project.md
├── quiz.json
├── interview.md
├── ai-prompts.md
├── assets/
└── changelog.md
```

---

## Appendix B: How this guide maps to the codebase

| Guide concept        | Implementation                                                                                       |
| -------------------- | ---------------------------------------------------------------------------------------------------- |
| Topic template       | `scripts/scaffold-topic.mjs <slug>` — generates the full folder structure                            |
| Quality checklist    | `scripts/validate-topic.mjs <slug>` — checks metadata, required files, and the 20 required sections  |
| Folder structure     | `content/topics/<slug>/` (see Appendix above)                                                        |
| Metadata schema      | `metadata.yaml` per topic (flat YAML keys)                                                           |
| Content hierarchy    | Prisma: `Course → Module → Topic → Lesson` (Domain/Category live on Course + metadata)               |
| Review workflow      | `Topic.contentStatus` enum: DRAFT → AI_REVIEW → TECH_REVIEW → EDITORIAL_REVIEW → QA → PUBLISHED        |
| Versioning           | `Topic.version` + `changelog.md`                                                                     |
| Content browser UI   | `/content` (list) and `/content/[slug]` (detail + checklist)                                          |
