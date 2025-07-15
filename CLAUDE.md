# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview
TrackX is a personal financial analysis app with a Python FastAPI backend, React TypeScript frontend, and SQLite database. The app tracks expenses, subscriptions, budgets, and savings goals with data visualizations and ML-powered expense categorization.

## Development Commands

### Backend (Python FastAPI)
```bash
# Setup virtual environment
python -m venv venv
source venv/bin/activate  # Unix/MacOS
.\venv\Scripts\activate   # Windows

# Install dependencies
pip install -r requirements.txt

# Run development server
uvicorn main:app --reload

# Database is SQLite - no migration commands needed, tables auto-create
```

### Frontend (React + TypeScript)
```bash
cd expense-tracker-frontend

# Install dependencies
npm install

# Development server
npm run dev

# Production build
npm run build

# TypeScript compilation
tsc
```

## Architecture Overview

### Backend Structure
- `main.py`: Central FastAPI app with all API endpoints organized by tags (Authentication, Expenses, Budget, etc.)
- `models.py`: SQLAlchemy ORM models (User, Expense, RecurringExpense, Budget, SavingGoal)
- `database.py`: Database configuration and session management
- `service/`: Business logic modules (auth_service, mail_service, chart_service, statementExtractor)
- `categoryFinder.pkl`: ML model for expense category prediction
- Authentication uses JWT tokens with password hashing

### Frontend Structure
- `src/components/`: React components for different app sections (Dashboard, ExpenseList, various dialogs)
- `src/services/api.ts`: Centralized API client with axios interceptors for JWT auth
- `src/types/`: TypeScript interfaces for data models
- Material-UI for component library, Chart.js for visualizations

### Key Features
- Monthly expense tracking with category-based budgeting
- ML-powered expense categorization using scikit-learn
- Subscription/recurring expense management
- Savings goal tracking
- Excel export functionality
- Email reports with scheduled background jobs
- Bank statement upload and transaction extraction

## Development Guidelines
- Python: Use type hints, async route handlers, Pydantic models for validation
- TypeScript: Strong typing required, avoid `any` type, functional components with hooks
- Database: SQLAlchemy ORM, schema auto-creates on startup
- Authentication: JWT tokens stored in localStorage, axios interceptors handle auth headers
- All meaningful changes should be documented in `ai_workdone.md`

## API Documentation
- Swagger UI: http://localhost:8000/docs
- ReDoc: http://localhost:8000/redoc