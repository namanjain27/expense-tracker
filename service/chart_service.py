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