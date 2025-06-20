from fastapi import FastAPI, Depends, HTTPException, UploadFile, File, BackgroundTasks
from sqlalchemy.orm import Session
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy import func
from typing import List, Union, Dict
from datetime import date, timedelta, datetime
from dateutil.relativedelta import relativedelta
from database import get_db, engine
import models
from pydantic import BaseModel, field_validator
from fastapi.responses import FileResponse, JSONResponse
import openpyxl
from openpyxl import Workbook
import tempfile
import os
import shutil
from enum import Enum
import pandas as pd
import joblib
from statementExtractor import extract_transactions
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import smtplib
from dotenv import load_dotenv
import os
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.cron import CronTrigger
import atexit

load_dotenv()


# Load the ML model
model = joblib.load('categoryFinder.pkl')

# Create database tables
models.Base.metadata.create_all(bind=engine)

app = FastAPI()

origins = [
    "http://localhost:5173",
    "https://your-website-domain.com",
    "https://expense-tracker-frontend-nfhv.onrender.com",
    "https://expense-tracker-frontend-32m0.onrender.com",
    "http://localhost:8000",
    "http://localhost:10000"
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
    2: "Housing",
    3: "Transportation",
    4: "Personal",
    5: "Utility",
    6: "Recreation",
    7: "Health",
    8: "Savings",
    9: "Debt"
}

# Pydantic models for request/response
class IntentionType(str, Enum):
    NEED = "Need"
    WANT = "Want"
    SAVING = "Saving"

class ExpenseBase(BaseModel):
    date: date
    category_id: int
    amount: float
    intention: IntentionType = IntentionType.NEED
    name: str | None = None  # Make name optional with default None
    
    @field_validator("date", mode="before")
    def parse_datetime_to_date(cls, v):
        if isinstance(v, str):
            try:
                return datetime.fromisoformat(v.replace("Z", "+00:00")).date()
            except ValueError:
                pass
        elif isinstance(v, datetime):
            return v.date()
        return v

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

# Pydantic models for recurring expenses
class PeriodUnit(str, Enum):
    DAYS = "days"
    MONTHS = "months"
    YEARS = "years"

class PeriodBase(BaseModel):
    value: int
    unit: PeriodUnit

    @field_validator('value')
    def validate_value(cls, v):
        if not 1 <= v <= 30:
            raise ValueError('Value must be between 1 and 30')
        return v

class RecurringExpenseBase(BaseModel):
    name: str
    amount: float
    category_id: int
    intention: IntentionType = IntentionType.NEED
    subscription_period: PeriodBase = PeriodBase(value=1, unit=PeriodUnit.MONTHS)
    effective_date: date
    billing_period: PeriodBase = PeriodBase(value=1, unit=PeriodUnit.MONTHS)
    due_period: PeriodBase

    class Config:
        orm_mode = True

class RecurringExpenseCreate(RecurringExpenseBase):
    pass

class RecurringExpense(RecurringExpenseBase):
    id: int
    category: str = ""

    def __init__(self, **data):
        super().__init__(**data)
        self.category = CATEGORIES.get(self.category_id, "Unknown")

# Add this with other Pydantic models
class DueTomorrowResponse(BaseModel):
    message: str

    # class importBankStatementResponse(BaseModel):


class DueTomorrowListResponse(BaseModel):
    subscriptions: List[RecurringExpense]

# Add this with other Pydantic models
class BudgetBase(BaseModel):
    monthly_income: float
    saving_goal: float
    category_budgets: Dict[str, float]

    @field_validator('monthly_income', 'saving_goal')
    def validate_amounts(cls, v):
        if v < 0:
            raise ValueError('Amount cannot be negative')
        return v

    @field_validator('category_budgets')
    def validate_category_budgets(cls, v):
        for category, amount in v.items():
            if amount < 0:
                raise ValueError(f'Budget for {category} cannot be negative')
        return v

class BudgetCreate(BudgetBase):
    pass

class Budget(BudgetBase):
    id: int
    created_at: datetime

    class Config:
        orm_mode = True

class CategoryPredictionRequest(BaseModel):
    name: str

@app.post("/predict-category")
def predict_category(request: CategoryPredictionRequest):
    try:
        predicted_category = model.predict([request.name])[0]
        return {"category": predicted_category}
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))



@app.post("/upload/")
async def upload_file(file: UploadFile = File(...)):
    if not file.filename.endswith((".xls", ".xlsx")):
        raise HTTPException(status_code=400, detail="Only .xls or .xlsx files are allowed")
    
    temp_file_path = f"temp_uploads/{file.filename}"
    os.makedirs("temp_uploads", exist_ok=True)
    
    with open(temp_file_path, "wb") as buffer:
        shutil.copyfileobj(file.file, buffer)

    try:
        data = extract_transactions(temp_file_path)
        total_withdrawal = sum(item["Withdrawal"] for item in data)
        total_deposit = sum(item["Deposit"] for item in data)
        count = len(data)
        net_monthly_expenditure = total_withdrawal-total_deposit
    finally:
        os.remove(temp_file_path)  # Clean up temp file

    return {"data": data,
            "total_amount_withdrawn": total_withdrawal,
            "total_amount_deposited": total_deposit,
            "net_monthly_expenditure": net_monthly_expenditure,
            "total_transcations": count}


@app.post("/expenses/", response_model=Expense)
def create_expense(expense: ExpenseCreate, db: Session = Depends(get_db)):
    if expense.category_id not in CATEGORIES:
        raise HTTPException(status_code=400, detail="Invalid category ID. Must be between 1 and 9")
    
    db_expense = models.Expense(**expense.dict())
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    return Expense(**db_expense.__dict__)

@app.post("/recurring-expenses/", response_model=RecurringExpense)
def create_recurring_expense(expense: RecurringExpenseCreate, db: Session = Depends(get_db)):
    if expense.category_id not in CATEGORIES:
        raise HTTPException(status_code=400, detail="Invalid category ID. Must be between 1 and 9")
    
    # Convert the period objects to database format
    db_expense = models.RecurringExpense(
        name=expense.name,
        amount=expense.amount,
        category_id=expense.category_id,
        intention=expense.intention,
        subscription_period_value=expense.subscription_period.value,
        subscription_period_unit=expense.subscription_period.unit,
        effective_date=expense.effective_date,
        billing_period_value=expense.billing_period.value,
        billing_period_unit=expense.billing_period.unit,
        due_period_value=expense.due_period.value,
        due_period_unit=expense.due_period.unit
    )
    db.add(db_expense)
    db.commit()
    db.refresh(db_expense)
    
    # Convert back to response format
    return RecurringExpense(
        id=db_expense.id,
        name=db_expense.name,
        amount=db_expense.amount,
        category_id=db_expense.category_id,
        intention=db_expense.intention,
        subscription_period=PeriodBase(
            value=db_expense.subscription_period_value,
            unit=db_expense.subscription_period_unit
        ),
        effective_date=db_expense.effective_date,
        billing_period=PeriodBase(
            value=db_expense.billing_period_value,
            unit=db_expense.billing_period_unit
        ),
        due_period=PeriodBase(
            value=db_expense.due_period_value or 1,
            unit=db_expense.due_period_unit or "months"
        )
    )

@app.get("/expenses/", response_model=List[Expense])
def read_expenses(month: int = None, year: int = None, skip: int = 0, limit: int = 100, db: Session = Depends(get_db)):
    # If month and year are provided, filter expenses for that month
    if month is not None and year is not None:
        start_date = date(year, month, 1)
        if month == 12:
            end_date = date(year + 1, 1, 1)
        else:
            end_date = date(year, month + 1, 1)
        
    expenses = db.query(models.Expense).filter(
        models.Expense.date >= start_date,
        models.Expense.date < end_date
    ).offset(skip).limit(limit).all()
    return [Expense(**expense.__dict__) for expense in expenses]

@app.get("/expenses/total")
def get_total_expenses(month: int = None, year: int = None, db: Session = Depends(get_db)):
    # If month and year are provided, filter expenses for that month
    if month is not None and year is not None:
        start_date = date(year, month, 1)
        if month == 12:
            end_date = date(year + 1, 1, 1)
        else:
            end_date = date(year, month + 1, 1)
        
        # Get overall total for the month
        total = db.query(models.Expense).filter(
            models.Expense.date >= start_date,
            models.Expense.date < end_date
        ).with_entities(func.sum(models.Expense.amount)).scalar()
        
        # Get category-wise totals for the month
        category_totals = db.query(
            models.Expense.category_id,
            func.sum(models.Expense.amount).label('total')
        ).filter(
            models.Expense.date >= start_date,
            models.Expense.date < end_date
        ).group_by(models.Expense.category_id).all()
    else:
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
    headers = ["ID", "Date", "Category", "Amount", "Intention", "Name"]
    for col, header in enumerate(headers, 1):
        ws.cell(row=1, column=col, value=header)
    
    # Add data
    for row, expense in enumerate(expenses, 2):
        ws.cell(row=row, column=1, value=expense.id)
        ws.cell(row=row, column=2, value=expense.date)
        ws.cell(row=row, column=3, value=CATEGORIES[expense.category_id])
        ws.cell(row=row, column=4, value=expense.amount)
        ws.cell(row=row, column=5, value=expense.intention)
        ws.cell(row=row, column=6, value=expense.name)
    
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

@app.get("/recurring-expenses/", response_model=List[RecurringExpense])
def get_recurring_expenses(db: Session = Depends(get_db)):
    today = date.today()
    
    # Get all subscriptions where effective_date + subscription_period >= today
    subscriptions = db.query(models.RecurringExpense).all()
    active_subscriptions = []
    
    for sub in subscriptions:
        # Calculate end date based on subscription period
        if sub.subscription_period_unit == "days":
            end_date = sub.effective_date + timedelta(days=sub.subscription_period_value)
        elif sub.subscription_period_unit == "months":
            end_date = sub.effective_date + relativedelta(months=sub.subscription_period_value)
        else:  # years
            end_date = sub.effective_date + relativedelta(years=sub.subscription_period_value)
            
        if end_date >= today:
            # Convert database model to Pydantic model with proper period objects
            subscription_dict = {
                "id": sub.id,
                "name": sub.name,
                "amount": sub.amount,
                "category_id": sub.category_id,
                "intention": sub.intention,
                "subscription_period": {
                    "value": sub.subscription_period_value,
                    "unit": sub.subscription_period_unit
                },
                "effective_date": sub.effective_date,
                "billing_period": {
                    "value": sub.billing_period_value,
                    "unit": sub.billing_period_unit
                },
                "due_period": {
                    "value": sub.due_period_value or 1,
                    "unit": sub.due_period_unit or "months"
                }
            }
            active_subscriptions.append(subscription_dict)
    
    return active_subscriptions

@app.post("/recurring-expenses/{subscription_id}/update-effective-date", response_model=RecurringExpense)
def update_subscription_effective_date(subscription_id: int, db: Session = Depends(get_db)):
    subscription = db.query(models.RecurringExpense).filter(models.RecurringExpense.id == subscription_id).first()
    if not subscription:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    # Calculate new effective date based on billing period
    if subscription.billing_period_unit == "days":
        new_effective_date = subscription.effective_date + timedelta(days=subscription.billing_period_value)
    elif subscription.billing_period_unit == "months":
        new_effective_date = subscription.effective_date + relativedelta(months=subscription.billing_period_value)
    else:  # years
        new_effective_date = subscription.effective_date + relativedelta(years=subscription.billing_period_value)
    
    # Update the effective date
    subscription.effective_date = new_effective_date
    db.commit()
    db.refresh(subscription)
    
    # Convert to response format
    return {
        "id": subscription.id,
        "name": subscription.name,
        "amount": subscription.amount,
        "category_id": subscription.category_id,
        "intention": subscription.intention,
        "subscription_period": {
            "value": subscription.subscription_period_value,
            "unit": subscription.subscription_period_unit
        },
        "effective_date": subscription.effective_date,
        "billing_period": {
            "value": subscription.billing_period_value,
            "unit": subscription.billing_period_unit
        },
        "due_period": {
            "value": subscription.due_period_value or 1,
            "unit": subscription.due_period_unit or "months"
        }
    }

@app.put("/recurring-expenses/{subscription_id}", response_model=RecurringExpense)
def update_recurring_expense(subscription_id: int, expense: RecurringExpenseCreate, db: Session = Depends(get_db)):
    db_expense = db.query(models.RecurringExpense).filter(models.RecurringExpense.id == subscription_id).first()
    if not db_expense:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    # Update the expense fields
    db_expense.name = expense.name
    db_expense.amount = expense.amount
    db_expense.category_id = expense.category_id
    db_expense.intention = expense.intention
    db_expense.subscription_period_value = expense.subscription_period.value
    db_expense.subscription_period_unit = expense.subscription_period.unit
    db_expense.effective_date = expense.effective_date
    db_expense.billing_period_value = expense.billing_period.value
    db_expense.billing_period_unit = expense.billing_period.unit
    db_expense.due_period_value = expense.due_period.value
    db_expense.due_period_unit = expense.due_period.unit
    
    db.commit()
    db.refresh(db_expense)
    
    # Convert to response format
    return {
        "id": db_expense.id,
        "name": db_expense.name,
        "amount": db_expense.amount,
        "category_id": db_expense.category_id,
        "intention": db_expense.intention,
        "subscription_period": {
            "value": db_expense.subscription_period_value,
            "unit": db_expense.subscription_period_unit
        },
        "effective_date": db_expense.effective_date,
        "billing_period": {
            "value": db_expense.billing_period_value,
            "unit": db_expense.billing_period_unit
        },
        "due_period": {
            "value": db_expense.due_period_value or 1,
            "unit": db_expense.due_period_unit or "months"
        }
    }

@app.get("/recurring-expenses/due-tomorrow", response_model=Union[DueTomorrowListResponse, DueTomorrowResponse])
def get_subscriptions_due_tomorrow(db: Session = Depends(get_db)):
    today = datetime.now().date()
    
    # Get all active subscriptions
    subscriptions = db.query(models.RecurringExpense).all()
    due_subscriptions = []
    
    for sub in subscriptions:
        # Calculate the alert date: effective_date + due_period - 1 day
        if sub.due_period_unit == "days":
            alert_date = sub.effective_date + timedelta(days=sub.due_period_value - 1)
        elif sub.due_period_unit == "months":
            alert_date = sub.effective_date + relativedelta(months=sub.due_period_value) - timedelta(days=1)
        else:  # years
            alert_date = sub.effective_date + relativedelta(years=sub.due_period_value) - timedelta(days=1)
        
        # Check if the alert date is today
        if alert_date == today:
            # Convert database model to Pydantic model with proper period objects
            subscription_dict = {
                "id": sub.id,
                "name": sub.name,
                "amount": sub.amount,
                "category_id": sub.category_id,
                "intention": sub.intention,
                "subscription_period": {
                    "value": sub.subscription_period_value,
                    "unit": sub.subscription_period_unit
                },
                "effective_date": sub.effective_date,
                "billing_period": {
                    "value": sub.billing_period_value,
                    "unit": sub.billing_period_unit
                },
                "due_period": {
                    "value": sub.due_period_value or 1,
                    "unit": sub.due_period_unit or "months"
                }
            }
            due_subscriptions.append(subscription_dict)
    
    if len(due_subscriptions) == 0:
        return DueTomorrowResponse(message="No subscriptions due tomorrow")
    return DueTomorrowListResponse(subscriptions=due_subscriptions)

@app.delete("/recurring-expenses/{subscription_id}")
def delete_recurring_expense(subscription_id: int, db: Session = Depends(get_db)):
    subscription = db.query(models.RecurringExpense).filter(models.RecurringExpense.id == subscription_id).first()
    if subscription is None:
        raise HTTPException(status_code=404, detail="Subscription not found")
    
    message = f"Subscription {subscription.name} amounting to {subscription.amount} deleted successfully"
    db.delete(subscription)
    db.commit()
    return message

@app.get("/expenses/intention-breakdown")
def get_intention_breakdown(month: int, year: int, db: Session = Depends(get_db)):
    # Get all expenses for the specified month and year
    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1)
    else:
        end_date = date(year, month + 1, 1)
    
    expenses = db.query(models.Expense).filter(
        models.Expense.date >= start_date,
        models.Expense.date < end_date
    ).all()
    
    # Calculate totals for each intention
    intention_totals = {
        "Need": 0,
        "Want": 0,
        "Saving": 0
    }
    
    for expense in expenses:
        intention_totals[expense.intention] += expense.amount
    
    # Calculate percentages
    total = sum(intention_totals.values())
    intention_percentages = {
        intention: (amount / total * 100) if total > 0 else 0
        for intention, amount in intention_totals.items()
    }
    
    return {
        "totals": intention_totals,
        "percentages": intention_percentages,
        "total_amount": total
    }

@app.post("/budget/", response_model=Budget)
def create_budget(budget: BudgetCreate, db: Session = Depends(get_db)):
    # Convert category names to IDs
    category_budgets = {}
    for category_name, amount in budget.category_budgets.items():
        category_id = next((k for k, v in CATEGORIES.items() if v == category_name), None)
        if category_id is None:
            raise HTTPException(status_code=400, detail=f"Invalid category: {category_name}")
        category_budgets[category_id] = amount

    db_budget = models.Budget(
        monthly_income=budget.monthly_income,
        saving_goal=budget.saving_goal,
        category_budgets=category_budgets,
        created_at=datetime.now()
    )
    db.add(db_budget)
    db.commit()
    db.refresh(db_budget)
    
    # Convert category IDs back to names for response
    response_budgets = {}
    for cat_id, amount in db_budget.category_budgets.items():
        response_budgets[CATEGORIES[int(cat_id)]] = amount

    
    return Budget(
        id=db_budget.id,
        monthly_income=db_budget.monthly_income,
        saving_goal=db_budget.saving_goal,
        category_budgets=response_budgets,
        created_at=db_budget.created_at
    )

@app.get("/budget/latest", response_model=Budget)
def get_latest_budget(month: int = None, year: int = None, db: Session = Depends(get_db)):
    query = db.query(models.Budget)
    
    if month is not None and year is not None:
        # Filter budgets for the specified month and year
        start_date = datetime(year, month, 1)
        if month == 12:
            end_date = datetime(year + 1, 1, 1)
        else:
            end_date = datetime(year, month + 1, 1)
        query = query.filter(
            models.Budget.created_at >= start_date,
            models.Budget.created_at < end_date
        )
    
    budget = query.order_by(models.Budget.created_at.desc()).first()
    if not budget:
        raise HTTPException(status_code=200, detail="No budget found")
    
    # Convert category IDs to names
    response_budgets = {}
    for cat_id, amount in budget.category_budgets.items():
        response_budgets[CATEGORIES[int(cat_id)]] = amount
    
    return Budget(
        id=budget.id,
        monthly_income=budget.monthly_income,
        saving_goal=budget.saving_goal,
        category_budgets=response_budgets,
        created_at=budget.created_at
    )

@app.put("/budget/latest", response_model=Budget)
def update_latest_budget(budget: BudgetCreate, month: int = None, year: int = None, db: Session = Depends(get_db)):
    query = db.query(models.Budget)
    
    if month is not None and year is not None:
        # Filter budgets for the specified month and year
        start_date = datetime(year, month, 1)
        if month == 12:
            end_date = datetime(year + 1, 1, 1)
        else:
            end_date = datetime(year, month + 1, 1)
        query = query.filter(
            models.Budget.created_at >= start_date,
            models.Budget.created_at < end_date
        )
    
    latest_budget = query.order_by(models.Budget.created_at.desc()).first()
    
    if not latest_budget:
        # If no budget exists for the specified month/year, create a new one
        category_budgets = {}
        for category_name, amount in budget.category_budgets.items():
            category_id = next((k for k, v in CATEGORIES.items() if v == category_name), None)
            if category_id is None:
                raise HTTPException(status_code=400, detail=f"Invalid category: {category_name}")
            category_budgets[int(category_id)] = amount

        new_budget = models.Budget(
            monthly_income=budget.monthly_income,
            saving_goal=budget.saving_goal,
            category_budgets=category_budgets,
            created_at=datetime.now()
        )
        db.add(new_budget)
        db.commit()
        db.refresh(new_budget)
        latest_budget = new_budget
    else:
        # Update existing budget
        category_budgets = {}
        for category_name, amount in budget.category_budgets.items():
            category_id = next((k for k, v in CATEGORIES.items() if v == category_name), None)
            if category_id is None:
                raise HTTPException(status_code=400, detail=f"Invalid category: {category_name}")
            category_budgets[int(category_id)] = amount

        latest_budget.monthly_income = budget.monthly_income
        latest_budget.saving_goal = budget.saving_goal
        latest_budget.category_budgets = category_budgets
        latest_budget.created_at = datetime.now()

        db.commit()
        db.refresh(latest_budget)
    
    # Convert category IDs back to names for response
    response_budgets = {}
    for cat_id, amount in latest_budget.category_budgets.items():
        response_budgets[CATEGORIES[int(cat_id)]] = amount
    
    return Budget(
        id=latest_budget.id,
        monthly_income=latest_budget.monthly_income,
        saving_goal=latest_budget.saving_goal,
        category_budgets=response_budgets,
        created_at=latest_budget.created_at
    )

@app.get("/expenses/daily")
def get_daily_expenses(month: int, year: int, db: Session = Depends(get_db)):
    # Calculate start and end dates for the month
    start_date = date(year, month, 1)
    if month == 12:
        end_date = date(year + 1, 1, 1)
    else:
        end_date = date(year, month + 1, 1)
    
    # Query expenses for the month and group by date
    daily_expenses = db.query(
        models.Expense.date,
        func.sum(models.Expense.amount).label('total')
    ).filter(
        models.Expense.date >= start_date,
        models.Expense.date < end_date
    ).group_by(
        models.Expense.date
    ).order_by(
        models.Expense.date
    ).all()
    
    # Format the response
    return {
        "daily_expenses": [
            {
                "date": expense.date.strftime("%Y-%m-%d"),
                "amount": float(expense.total)
            }
            for expense in daily_expenses
        ]
    }

def _send_monthly_report_logic(db: Session, year: int, month: int):
    """
    Contains the core logic for generating the monthly report for a specific month and year.
    Returns a dictionary with 'subject' and 'body' if a report is generated, otherwise None.
    """
    report_date = datetime(year, month, 1)
    start_date = datetime(year, month, 1)
    end_date = start_date + relativedelta(months=1)

    budget = db.query(models.Budget).filter(
        models.Budget.created_at >= start_date,
        models.Budget.created_at < end_date
    ).first()

    template_file = 'email_templates/monthly_report_template.html' if budget else 'email_templates/monthly_report_template_no_budget.html'

    expenses = db.query(models.Expense).filter(
        models.Expense.date >= start_date,
        models.Expense.date < end_date
    ).all()

    total_spent = sum(expense.amount for expense in expenses)
    total_saved = (budget.monthly_income - total_spent) if budget else 0

    last_month_start = start_date - relativedelta(months=1)
    past_expenses = db.query(models.Expense).filter(
        models.Expense.date >= last_month_start,
        models.Expense.date < start_date
    ).all()
    past_total_spent = sum(expense.amount for expense in past_expenses)
    percent_change_expenses = ((total_spent - past_total_spent) / past_total_spent * 100) if past_total_spent > 0 else "N/A"

    overspent_categories = []
    if budget and budget.category_budgets:
        category_expenses_q = db.query(models.Expense.category_id, func.sum(models.Expense.amount).label('total'))\
            .filter(models.Expense.date >= start_date, models.Expense.date < end_date)\
            .group_by(models.Expense.category_id).all()

        category_expenses = {item.category_id: item.total for item in category_expenses_q}

        for cat_id, total_spent_for_cat in category_expenses.items():
            budget_for_cat = budget.category_budgets.get(str(cat_id))
            if budget_for_cat and total_spent_for_cat > budget_for_cat:
                overspent_categories.append(CATEGORIES[cat_id])

    budget_used_percent = (total_spent / budget.monthly_income * 100) if budget and budget.monthly_income > 0 else 0
    savings_goal_reached = total_saved >= budget.saving_goal if budget else False

    top_expenses = sorted(expenses, key=lambda x: x.amount, reverse=True)[:3]
    top_expense_1 = f"{top_expenses[0].name} of amount ₹{top_expenses[0].amount:,.2f} on {top_expenses[0].date.strftime('%Y-%m-%d')}" if len(top_expenses) > 0 else "N/A"
    top_expense_2 = f"{top_expenses[1].name} of amount ₹{top_expenses[1].amount:,.2f} on {top_expenses[1].date.strftime('%Y-%m-%d')}" if len(top_expenses) > 1 else "N/A"
    top_expense_3 = f"{top_expenses[2].name} of amount ₹{top_expenses[2].amount:,.2f} on {top_expenses[2].date.strftime('%Y-%m-%d')}" if len(top_expenses) > 2 else "N/A"

    with open(template_file, 'r') as file:
        email_body = file.read()

    email_body = email_body.replace('{{Month}}', report_date.strftime('%B %Y'))
    email_body = email_body.replace('{{total_spent}}', f"₹{total_spent:,.2f}")
    email_body = email_body.replace('{{total_saved}}', f"₹{total_saved:,.2f}")
    email_body = email_body.replace('{{percent_change_expenses}}', f"{percent_change_expenses:.2f}%" if isinstance(percent_change_expenses, float) else "N/A")
    email_body = email_body.replace('{{budget_used_percent}}', f"{budget_used_percent:.2f}%")
    email_body = email_body.replace('{{overspent_categories_names_comma_separated}}', ', '.join(overspent_categories) if overspent_categories else "None")
    email_body = email_body.replace('{{savings_goal_reached}}', "Yes" if savings_goal_reached else "No")
    email_body = email_body.replace('{{top_expense_1}}', top_expense_1)
    email_body = email_body.replace('{{top_expense_2}}', top_expense_2)
    email_body = email_body.replace('{{top_expense_3}}', top_expense_3)
    email_body = email_body.replace('{{budget_vs_actual_chart_url}}', "")
    email_body = email_body.replace('{{intention_breakdown_pie_url}}', "")
    email_body = email_body.replace('{{daily_spend_line_chart_url}}', "")

    subject = f"TrackX - {report_date.strftime('%B %Y')} Monthly Report"
    return {"subject": subject, "body": email_body}


@app.post("/send-monthly-report")
def send_monthly_report(background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    today = date.today()
    first_day_of_current_month = today.replace(day=1)
    last_day_of_previous_month = first_day_of_current_month - timedelta(days=1)
    year = last_day_of_previous_month.year
    month = last_day_of_previous_month.month
    print(f"Sending monthly report for {month}/{year}")

    report_data = _send_monthly_report_logic(db, year, month)
    if report_data:
        background_tasks.add_task(send_email, "jainnaman027@gmail.com", report_data["subject"], report_data["body"])
        return {"message": "Monthly report has been queued."}
    
    return {"message": "No report was generated."}

def send_email(to_email: str, subject: str, body: str):
    from_email = "jainnaman027@gmail.com"
    password = os.getenv("smpt_email_pass")
    print(os.getenv("smpt_email_pass"))

    msg = MIMEMultipart()
    msg['From'] = from_email
    msg['To'] = to_email
    msg['Subject'] = subject

    msg.attach(MIMEText(body, 'html'))

    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(from_email, password)
        server.sendmail(from_email, to_email, msg.as_string())
        server.quit()
        print("Email sent successfully")
    except Exception as e:
        print(f"Failed to send email: {e}")

def scheduled_report_job():
    """
    Scheduled job to send monthly report if expenses were made in the previous month.
    """
    print("Scheduler: Running monthly report job check...")
    db = next(get_db())
    today = date.today()
    first_day_of_current_month = today.replace(day=1)
    last_day_of_previous_month = first_day_of_current_month - timedelta(days=1)
    year = last_day_of_previous_month.year
    month = last_day_of_previous_month.month

    start_date = datetime(year, month, 1)
    end_date = start_date + relativedelta(months=1)

    expenses_count = db.query(models.Expense).filter(
        models.Expense.date >= start_date,
        models.Expense.date < end_date
    ).count()

    if expenses_count > 0:
        print(f"Scheduler: Found {expenses_count} expenses for {month}/{year}. Sending report.")
        report_data = _send_monthly_report_logic(db, year, month)
        if report_data:
            try:
                send_email("jainnaman027@gmail.com", report_data["subject"], report_data["body"])
                print("Scheduler: Email sent successfully.")
            except Exception as e:
                print(f"Scheduler: Failed to send email: {e}")
    else:
        print(f"Scheduler: No expenses found for {month}/{year}. Report not sent.")
    db.close()

scheduler = BackgroundScheduler(daemon=True)
scheduler.add_job(scheduled_report_job, CronTrigger(day=1, hour=6, minute=0))
scheduler.start()

atexit.register(lambda: scheduler.shutdown())

class SavingGoalBase(BaseModel):
    name: str
    target_date: date
    target_amount: float
    saved_amount: float = 0

    class Config:
        orm_mode = True

class SavingGoalCreate(SavingGoalBase):
    pass

class SavingGoal(SavingGoalBase):
    id: int

class AddAmountRequest(BaseModel):
    amount: float

@app.post("/saving-goals/", response_model=SavingGoal)
def create_saving_goal(goal: SavingGoalCreate, db: Session = Depends(get_db)):
    db_goal = models.SavingGoal(**goal.dict())
    db.add(db_goal)
    db.commit()
    db.refresh(db_goal)
    return db_goal

@app.get("/saving-goals/", response_model=List[SavingGoal])
def get_saving_goals(db: Session = Depends(get_db)):
    goals = db.query(models.SavingGoal).all()
    return goals

@app.put("/saving-goals/{goal_id}", response_model=SavingGoal)
def update_saving_goal(goal_id: int, goal: SavingGoalCreate, db: Session = Depends(get_db)):
    db_goal = db.query(models.SavingGoal).filter(models.SavingGoal.id == goal_id).first()
    if not db_goal:
        raise HTTPException(status_code=404, detail="Saving goal not found")
    
    for key, value in goal.dict().items():
        setattr(db_goal, key, value)
    
    db.commit()
    db.refresh(db_goal)
    return db_goal

@app.post("/saving-goals/{goal_id}/add-amount", response_model=SavingGoal)
def add_amount_to_saving_goal(goal_id: int, request: AddAmountRequest, db: Session = Depends(get_db)):
    db_goal = db.query(models.SavingGoal).filter(models.SavingGoal.id == goal_id).first()
    if not db_goal:
        raise HTTPException(status_code=404, detail="Saving goal not found")

    db_goal.saved_amount += request.amount
    db.commit()
    db.refresh(db_goal)
    return db_goal

@app.delete("/saving-goals/{goal_id}")
def delete_saving_goal(goal_id: int, db: Session = Depends(get_db)):
    db_goal = db.query(models.SavingGoal).filter(models.SavingGoal.id == goal_id).first()
    if not db_goal:
        raise HTTPException(status_code=404, detail="Saving goal not found")

    db.delete(db_goal)
    db.commit()
    return {"message": "Saving goal deleted successfully"}

