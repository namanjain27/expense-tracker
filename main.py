from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func
from typing import List
from datetime import date
from database import get_db, engine
import models
from pydantic import BaseModel
from fastapi.responses import FileResponse
import openpyxl
from openpyxl import Workbook
import tempfile
import os

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

origins = [
    "http://localhost",
    "http://localhost:5173",
    "https://your-website-domain.com"
]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,  # Allow cookies and authorization headers
    allow_methods=["*"],  # Allow all HTTP methods (GET, POST, PUT, etc.)
    allow_headers=["*"]  # Allow all headers
)

# Category mapping
CATEGORIES = {
    1: "Food",
    2: "Rent",
    3: "Travel",
    4: "Shopping",
    5: "Utility",
    6: "Misc"
}

# Pydantic models for request/response
class ExpenseBase(BaseModel):
    date: date
    category_id: int
    amount: float

    class Config:
        orm_mode = True

class ExpenseCreate(ExpenseBase):
    pass

class Expense(ExpenseBase):
    id: int
    category: str = ""

    def __init__(self, **data):
        super().__init__(**data)
        self.category = CATEGORIES.get(self.category_id, "Unknown")

@app.post("/expenses/", response_model=Expense)
def create_expense(expense: ExpenseCreate, db: Session = Depends(get_db)):
    if expense.category_id not in CATEGORIES:
        raise HTTPException(status_code=400, detail="Invalid category ID. Must be between 1 and 6")
    
    db_expense = models.Expense(**expense.dict())
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return Expense(**db_expense.__dict__)

@app.get("/expenses/", response_model=List[Expense])
def read_expenses(skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    expenses = db.query(models.Expense).offset(skip).limit(limit).all()
    return [Expense(**expense.__dict__) for expense in expenses]

@app.get("/expenses/total")
def get_total_expenses(db: Session = Depends(get_db)):
    # Get overall total
    total = db.query(models.Expense).with_entities(func.sum(models.Expense.amount)).scalar()
    
    # Get category-wise totals
    category_totals = db.query(
        models.Expense.category_id,
        func.sum(models.Expense.amount).label('total')
    ).group_by(models.Expense.category_id).all()
    
    # Convert category IDs to names and format the response
    category_breakdown = {
        CATEGORIES[cat_id]: amount for cat_id, amount in category_totals
    }
    
    return {
        "overall_total": total if total else 0,
        "category_breakdown": category_breakdown
    }

@app.delete("/expenses/{expense_id}")
def delete_expense(expense_id: int, db: Session = Depends(get_db)):
    expense = db.query(models.Expense).filter(models.Expense.id == expense_id).first()
    if expense is None:
        raise HTTPException(status_code=404, detail="Expense not found")
    
    message = f"Expense on {expense.date} for {CATEGORIES[expense.category_id]} amounting to {expense.amount} deleted successfully"
    db.delete(expense)
    db.commit()
    return message

@app.get("/expenses/export")
def export_expenses(db: Session = Depends(get_db)):
    # Get all expenses
    expenses = db.query(models.Expense).all()
    
    # Create a new workbook
    wb = Workbook()
    ws = wb.active
    ws.title = "Expenses_"+str(date.today())
    
    # Add headers
    headers = ["ID", "Date", "Category", "Amount"]
    for col, header in enumerate(headers, 1):
        ws.cell(row=1, column=col, value=header)
    
    # Add data
    for row, expense in enumerate(expenses, 2):
        ws.cell(row=row, column=1, value=expense.id)
        ws.cell(row=row, column=2, value=expense.date)
        ws.cell(row=row, column=3, value=CATEGORIES[expense.category_id])
        ws.cell(row=row, column=4, value=expense.amount)
    
    # Create a temporary file
    with tempfile.NamedTemporaryFile(delete=False, suffix='.xlsx') as tmp:
        wb.save(tmp.name)
        tmp_path = tmp.name
    
    # Return the file
    return FileResponse(
        tmp_path,
        media_type="application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        filename="expenses.xlsx",
        background=None
    ) 