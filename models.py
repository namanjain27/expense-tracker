from sqlalchemy import Column, Integer, String, Float, Date, ForeignKey, JSON, DateTime
from sqlalchemy.orm import relationship
from database import Base

# Base = declarative_base() # This line is redundant if Base is imported from database.py

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    name = Column(String, nullable=True)
    created_at = Column(DateTime)
    last_login = Column(DateTime, nullable=True)

    expenses = relationship("Expense", back_populates="owner")
    recurring_expenses = relationship("RecurringExpense", back_populates="owner")
    budgets = relationship("Budget", back_populates="owner")
    saving_goals = relationship("SavingGoal", back_populates="owner")

class Expense(Base):
    __tablename__ = "expenses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False) # Add user_id
    date = Column(Date, nullable=False)
    category_id = Column(Integer, nullable=False)
    amount = Column(Float, nullable=False)
    intention = Column(String, default="Need")
    name = Column(String, nullable=True)

    owner = relationship("User", back_populates="expenses") # Relationship

class RecurringExpense(Base):
    __tablename__ = "recurring_expenses"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False) # Add user_id
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
    intention = Column(String, default="Need")

    owner = relationship("User", back_populates="recurring_expenses") # Relationship

class Budget(Base):
    __tablename__ = "budgets"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False) # Add user_id
    monthly_income = Column(Float)
    saving_goal = Column(Float)
    category_budgets = Column(JSON)  # Stores category_id: amount mapping
    created_at = Column(DateTime)

    owner = relationship("User", back_populates="budgets") # Relationship

class SavingGoal(Base):
    __tablename__ = "saving_goals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False) # Add user_id
    name = Column(String, nullable=False)
    target_date = Column(Date, nullable=False)
    target_amount = Column(Float, nullable=False)
    saved_amount = Column(Float, nullable=False, default=0)

    owner = relationship("User", back_populates="saving_goals") # Relationship 