# Contributing to SkyFusionX 🌦️

First off, thank you for considering contributing to **SkyFusionX**! We welcome contributions from everyone, whether it's fixing bugs, improving documentation, or adding new features to our National Weather Big Data Analytics Platform (SIH26069).

This document provides guidelines and steps for contributing to the repository.

---

## Table of Contents

1. [Project Overview](#project-overview)
2. [Development Setup](#development-setup)
   - [Backend (FastAPI & Kafka)](#backend-setup)
   - [Frontend (React & Vite)](#frontend-setup)
3. [Contribution Workflow](#contribution-workflow)
4. [Branching Strategy](#branching-strategy)
5. [Code Style Guidelines](#code-style-guidelines)
6. [Reporting Issues](#reporting-issues)

---

## Project Overview

SkyFusionX uses a **10-Stage Intelligence Pipeline** to ingest, verify, and fuse weather data:
- **Backend:** Python 3.9+, FastAPI, SQLAlchemy, and `aiokafka` for stream processing.
- **Frontend:** React 18, Vite, Tailwind CSS, React-Leaflet, and Three.js.
- **Database:** SQLite (local dev) / PostgreSQL (production).

Familiarize yourself with the system architecture outlined in our [README.md](README.md) before making major changes.

---

## Development Setup

To contribute, you will need to run both the frontend and backend locally.

### Prerequisites
- Node.js 18+
- Python 3.9+
- Apache Kafka 3.0+ (running locally)

### Backend Setup

1. **Navigate to the backend directory:**
   ```bash
   cd backend
   ```
2. **Create and activate a virtual environment:**
   ```bash
   python -m venv venv
   # Windows:
   venv\Scripts\activate
   # Unix/MacOS:
   source venv/bin/activate
   ```
3. **Install dependencies:**
   ```bash
   pip install -r requirements.txt
   ```
4. **Configure Environment Variables:**
   Create a `.env` file in the `backend/` directory based on the `.env.example` file.
   ```env
   DATABASE_URL=sqlite:///./weather_truth.db
   KAFKA_BOOTSTRAP_SERVERS=localhost:9092
   GEMINI_API_KEY=your_gemini_api_key_here
   ```
5. **Run the server:**
   ```bash
   python run_local.py
   ```

### Frontend Setup

1. **Navigate to the root or frontend directory:**
   ```bash
   npm install
   ```
2. **Start the development server:**
   ```bash
   npm run dev
   ```

---

## Contribution Workflow

1. **Fork the repository** to your own GitHub account.
2. **Clone the project** to your local machine.
3. **Create a new branch** for your feature or bug fix (see [Branching Strategy](#branching-strategy)).
4. **Make your changes** and test them locally.
5. **Commit your changes** with clear and descriptive commit messages.
6. **Push to your fork** and submit a **Pull Request (PR)** to the `main` branch of the original repository.

---

## Branching Strategy

Please follow this naming convention for your branches:
- **Features:** `feature/your-feature-name`
- **Bug Fixes:** `bugfix/issue-description`
- **Documentation:** `docs/update-description`
- **Refactoring:** `refactor/component-name`

---

## Code Style Guidelines

### Python (Backend)
- Follow **PEP 8** style guidelines.
- Use **Type Hints** (`typing`) for all function signatures, especially in FastAPI routes and Pydantic models.
- Ensure any new intelligence engine components (in `app/intelligence/`) include appropriate docstrings explaining the methodology.

### React / TypeScript (Frontend)
- Use **Functional Components** with React Hooks.
- Use **TypeScript** for all new components (`.tsx` / `.ts`).
- Style components using **Tailwind CSS** utility classes.
- Keep the `components/` directory modular: separate UI elements, map components, and dashboard charts logically.

---

## Reporting Issues

If you find a bug or have a feature request, please open an issue on GitHub. Include:
1. A clear and descriptive title.
2. Steps to reproduce the issue (if it's a bug).
3. Details about your environment (OS, Node version, Python version).
4. Screenshots or console logs if applicable.

---

Thank you for contributing to SkyFusionX! Together, we can build a more resilient and intelligent weather analytics platform. 🚀
