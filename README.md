# Multilingual AI Issue Analyzer & Escalation System

This project analyzes public complaints written in multiple languages and automatically classifies issues using NLP techniques. It also detects urgency and helps escalate critical civic issues.

## Features
- Multilingual complaint analysis
- Issue classification using NLP
- Urgency detection
- Escalation logic
- Interactive frontend interface
- FastAPI backend

## System Architecture

The system processes multilingual public complaints and detects urgent civic issues using NLP techniques.

Workflow:

User Complaint → Language Processing → Issue Classification → Urgency Scoring → Escalation Detection → Dashboard Output

1. Complaint data is collected from a dataset.
2. Text preprocessing and multilingual handling is applied.
3. NLP model classifies the complaint into issue categories.
4. Urgency scoring detects high-priority issues.
5. Escalation logic flags critical cases.
6. Results are displayed through the frontend interface.

## Dataset

The system uses a multilingual complaints dataset containing public issue reports.

Example fields:

* complaint_text
* language
* issue_category
* urgency_score

File used:
final_multilingual_complaints.csv

## Example Complaint Analysis

Input complaint:
"There is severe water leakage in our area and it has not been fixed for days."

Output:

* Detected Issue Category: Water Supply
* Urgency Score: High
* Escalation Status: Flagged

## Tech Stack
Python
FastAPI
NLP
React / JavaScript
CSV Dataset

## How to Run

Backend:
python -m uvicorn app1:app --reload

Frontend:
npm install
npm start
