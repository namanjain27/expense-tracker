from sqlalchemy.orm import Session
import models
from sqlalchemy import func
from datetime import datetime
from dateutil.relativedelta import relativedelta
from quickchart import QuickChart

CATEGORIES = {
    1: "Food", 2: "Housing", 3: "Transportation", 4: "Personal",
    5: "Utility", 6: "Recreation", 7: "Health", 8: "Debt"
}

def _generate_chart_image(chart_config: dict, filename: str) -> str:
    """
    Generates a chart image from a Chart.js config using QuickChart.io,
    and returns the public URL.
    """
    qc = QuickChart()
    qc.width = 500
    qc.height = 300
    qc.config = chart_config

    try:
        url = qc.get_url()
        return url
    except Exception as e:
        print(f"Error generating chart with QuickChart for '{filename}': {e}")
        return ""


def generate_daily_spend_chart(db: Session, year: int, month: int, user_id: int) -> str:
    start_date = datetime(year, month, 1)
    end_date = start_date + relativedelta(months=1)
    daily_expenses = db.query(models.Expense.date, func.sum(models.Expense.amount).label('total')) \
        .filter(models.Expense.date >= start_date, models.Expense.date < end_date, models.Expense.user_id == user_id) \
        .group_by(models.Expense.date).order_by(models.Expense.date).all()
    
    chart_config = {
        "type": 'line',
        "data": {
            "labels": [day.date.strftime("%d %b") for day in daily_expenses],
            "datasets": [{"label": 'Daily Expenses', "data": [float(day.total) for day in daily_expenses], "fill": False, "borderColor": 'rgb(75, 192, 192)', "tension": 0.1}]
        },
        "options": {"scales": {"y": {"beginAtZero": True}}, "plugins": {"title": {"display": True, "text": 'Daily Expense Variation'}}}
    }
    filename = f"daily_spend_{year}_{month}.png"
    return _generate_chart_image(chart_config, filename)

def generate_expense_by_category_chart(db: Session, year: int, month: int, user_id: int) -> str:
    start_date = datetime(year, month, 1)
    end_date = start_date + relativedelta(months=1)
    
    category_totals_q = db.query(models.Expense.category_id, func.sum(models.Expense.amount).label('total')) \
        .filter(models.Expense.date >= start_date, models.Expense.date < end_date, models.Expense.user_id == user_id) \
        .group_by(models.Expense.category_id).all()
    category_totals = {CATEGORIES[item.category_id]: item.total for item in category_totals_q}
    
    labels = list(category_totals.keys())
    actual_data = list(category_totals.values())
    
    chart_config = {
        "type": 'doughnut',
        "data": {
            "labels": labels,
            "datasets": [{"data": actual_data, "backgroundColor": ['#9ACD32', '#36A2EB', '#FFCE56', '#4BC0C0', '#9966FF', '#FF9F40', '#FF6384', '#4CAF50', '#FF5252']}]
        },
        "options": {"plugins": {"legend": {"position": 'top'}, "title": {"display": True, "text": 'Monthly Expenses by Category'}}}
    }
        
    filename = f"expense_by_category_{year}_{month}.png"
    return _generate_chart_image(chart_config, filename)

def generate_budget_vs_actual_chart(db: Session, year: int, month: int, user_id: int) -> str:
    """
    Generate a bar chart comparing budget vs actual expenses by category
    """
    start_date = datetime(year, month, 1)
    end_date = start_date + relativedelta(months=1)
    
    # Get budget data for the month
    budget = db.query(models.Budget).filter(
        models.Budget.created_at >= start_date,
        models.Budget.created_at < end_date,
        models.Budget.user_id == user_id
    ).first()
    
    # Get actual expenses by category
    category_totals_q = db.query(models.Expense.category_id, func.sum(models.Expense.amount).label('total')) \
        .filter(models.Expense.date >= start_date, models.Expense.date < end_date, models.Expense.user_id == user_id) \
        .group_by(models.Expense.category_id).all()
    
    actual_expenses = {CATEGORIES[item.category_id]: float(item.total) for item in category_totals_q}
    
    if not budget:
        # If no budget exists, show only actual expenses
        labels = list(actual_expenses.keys())
        actual_data = list(actual_expenses.values())
        
        chart_config = {
            "type": 'bar',
            "data": {
                "labels": labels,
                "datasets": [{
                    "label": 'Actual Expenses (₹)',
                    "data": actual_data,
                    "backgroundColor": 'rgba(75, 192, 192, 0.8)',
                    "borderColor": 'rgba(75, 192, 192, 1)',
                    "borderWidth": 1
                }]
            },
            "options": {
                "responsive": True,
                "plugins": {
                    "title": {
                        "display": True,
                        "text": 'Actual Expenses by Category'
                    },
                    "legend": {
                        "position": 'top'
                    }
                },
                "scales": {
                    "y": {
                        "beginAtZero": True,
                        "title": {
                            "display": True,
                            "text": 'Amount (₹)'
                        }
                    }
                }
            }
        }
    else:
        # Budget exists, show comparison
        budget_categories = budget.category_budgets if budget.category_budgets else {}
        
        # Get all categories that have either budget or expenses
        all_categories = set(budget_categories.keys()) | set(actual_expenses.keys())
        # Filter out categories that have no budget and no expenses
        categories = [cat for cat in all_categories if 
                     budget_categories.get(cat, 0) > 0 or actual_expenses.get(cat, 0) > 0]
        
        budget_data = [budget_categories.get(cat, 0) for cat in categories]
        actual_data = [actual_expenses.get(cat, 0) for cat in categories]
        
        # Calculate percentages for color coding
        def get_color_for_percentage(budget_amt, actual_amt):
            if budget_amt == 0:
                return 'rgba(75, 192, 192, 0.8)'
            percentage = (actual_amt / budget_amt) * 100
            if percentage <= 50:
                return 'rgba(75, 192, 192, 0.8)'  # Green
            elif percentage <= 75:
                return 'rgba(255, 205, 86, 0.8)'  # Yellow
            elif percentage <= 100:
                return 'rgba(255, 159, 64, 0.8)'  # Orange
            else:
                return 'rgba(255, 99, 132, 0.8)'  # Red
        
        actual_colors = [get_color_for_percentage(budget_categories.get(cat, 0), actual_expenses.get(cat, 0)) 
                        for cat in categories]
        
        # Add savings comparison if budget has savings goal
        if budget.saving_goal and budget.saving_goal > 0:
            # Calculate actual savings: monthly_income - total_expenses + savings_category
            total_expenses = sum(actual_expenses.values())
            savings_category_amount = actual_expenses.get('Savings', 0)
            actual_savings = budget.monthly_income - total_expenses + savings_category_amount
            
            categories.append('Total Savings')
            budget_data.append(budget.saving_goal)
            actual_data.append(max(0, actual_savings))  # Don't show negative savings
            actual_colors.append(get_color_for_percentage(budget.saving_goal, max(0, actual_savings)))
        
        chart_config = {
            "type": 'bar',
            "data": {
                "labels": categories,
                "datasets": [
                    {
                        "label": 'Budget (₹)',
                        "data": budget_data,
                        "backgroundColor": 'rgba(54, 162, 235, 0.5)',
                        "borderColor": 'rgba(54, 162, 235, 1)',
                        "borderWidth": 1
                    },
                    {
                        "label": 'Actual (₹)',
                        "data": actual_data,
                        "backgroundColor": actual_colors,
                        "borderColor": [color.replace('0.8', '1') for color in actual_colors],
                        "borderWidth": 1
                    }
                ]
            },
            "options": {
                "responsive": True,
                "plugins": {
                    "title": {
                        "display": True,
                        "text": 'Budget vs Actual Expenses'
                    },
                    "legend": {
                        "position": 'top'
                    }
                },
                "scales": {
                    "y": {
                        "beginAtZero": True,
                        "title": {
                            "display": True,
                            "text": 'Amount (₹)'
                        }
                    },
                    "x": {
                        "ticks": {
                            "maxRotation": 45,
                            "minRotation": 45
                        }
                    }
                }
            }
        }
    
    filename = f"budget_vs_actual_{year}_{month}.png"
    return _generate_chart_image(chart_config, filename) 