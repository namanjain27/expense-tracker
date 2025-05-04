from sqlalchemy import Column, Integer, String, Float, Date
from database import Base

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    date = Column(Date, nullable=False)
    category_id = Column(Integer, nullable=False)
    amount = Column(Float, nullable=False)

class RecurringExpense(Base):
    __tablename__ = "recurring_expenses"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    amount = Column(Float, nullable=False)
    category_id = Column(Integer, nullable=False)
    subscription_period_value = Column(Integer, nullable=False, default=1)
    subscription_period_unit = Column(String, nullable=False, default="months")  # days, months, years
    effective_date = Column(Date, nullable=False)
    billing_period_value = Column(Integer, nullable=False, default=1)
    billing_period_unit = Column(String, nullable=False, default="months")  # days, months, years
    due_period_value = Column(Integer, nullable=True)
    due_period_unit = Column(String, nullable=True)  # days, months, years 