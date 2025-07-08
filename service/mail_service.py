from datetime import date, timedelta, datetime
from dateutil.relativedelta import relativedelta
import models
from sqlalchemy.orm import Session
from email.mime.multipart import MIMEMultipart
from email.mime.text import MIMEText
import smtplib
from sqlalchemy import func
import os
from dotenv import load_dotenv
from database import get_db
from . import chart_service
import jinja2

load_dotenv()

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

def send_email(to_email: str, subject: str, body: str, is_html: bool = False):
    from_email = "jainnaman027@gmail.com"
    password = os.getenv("smpt_email_pass")

    msg = MIMEMultipart()
    msg['From'] = from_email
    msg['To'] = to_email
    msg['Subject'] = subject

    if is_html:
        msg.attach(MIMEText(body, 'html'))
    else:
        msg.attach(MIMEText(body, 'plain'))

    try:
        server = smtplib.SMTP('smtp.gmail.com', 587)
        server.starttls()
        server.login(from_email, password)
        server.sendmail(from_email, to_email, msg.as_string())
        server.quit()
        print("Email sent successfully")
    except Exception as e:
        print(f"Failed to send email: {e}")

def _send_monthly_report_logic(db: Session, year: int, month: int, user_id: int):
    """
    Contains the core logic for generating the monthly report for a specific month and year.
    Returns a dictionary with 'subject' and 'body' if a report is generated, otherwise None.
    """
    report_date = datetime(year, month, 1)
    start_date = datetime(year, month, 1)
    end_date = start_date + relativedelta(months=1)

    budget = db.query(models.Budget).filter(
        models.Budget.created_at >= start_date,
        models.Budget.created_at < end_date,
        models.Budget.user_id == user_id
    ).first()

    template_file = 'email_templates/monthly_report_template.html' if budget else 'email_templates/monthly_report_template_no_budget.html'

    expenses = db.query(models.Expense).filter(
        models.Expense.date >= start_date,
        models.Expense.date < end_date,
        models.Expense.user_id == user_id
    ).all()

    total_spent = sum(expense.amount for expense in expenses)
    total_saved = (budget.monthly_income - total_spent) if budget else 0

    last_month_start = start_date - relativedelta(months=1)
    past_expenses = db.query(models.Expense).filter(
        models.Expense.date >= last_month_start,
        models.Expense.date < start_date,
        models.Expense.user_id == user_id
    ).all()
    past_total_spent = sum(expense.amount for expense in past_expenses)
    percent_change_expenses = ((total_spent - past_total_spent) / past_total_spent * 100) if past_total_spent > 0 else "N/A"

    overspent_categories = []
    if budget and budget.category_budgets:
        category_expenses_q = db.query(models.Expense.category_id, func.sum(models.Expense.amount).label('total'))\
            .filter(models.Expense.date >= start_date, models.Expense.date < end_date, models.Expense.user_id == user_id)\
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

    # Generate charts
    budget_vs_actual_chart_url = chart_service.generate_budget_vs_actual_chart(db, year, month, user_id)
    intention_breakdown_pie_url = chart_service.generate_intention_breakdown_chart(db, year, month, user_id)
    daily_spend_line_chart_url = chart_service.generate_daily_spend_chart(db, year, month, user_id)

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
    email_body = email_body.replace('{{budget_vs_actual_chart_url}}', budget_vs_actual_chart_url)
    email_body = email_body.replace('{{intention_breakdown_pie_url}}', intention_breakdown_pie_url)
    email_body = email_body.replace('{{daily_spend_line_chart_url}}', daily_spend_line_chart_url)

    subject = f"TrackX - {report_date.strftime('%B %Y')} Monthly Report"
    return {"subject": subject, "body": email_body}

def scheduled_report_job():
    """
    Scheduled job to send monthly report to all active users if expenses were made in the previous month.
    """
    print("Scheduler: Running monthly report job check...")
    db = next(get_db())
    today = date.today()
    first_day_of_current_month = today.replace(day=1)
    last_day_of_previous_month = first_day_of_current_month - timedelta(days=1)
    year = last_day_of_previous_month.year
    month = last_day_of_previous_month.month

    users = db.query(models.User).all()

    for user in users:
        expenses_count = db.query(models.Expense).filter(
            models.Expense.date >= datetime(year, month, 1),
            models.Expense.date < (datetime(year, month, 1) + relativedelta(months=1)),
            models.Expense.user_id == user.id
        ).count()

        if expenses_count > 0:
            print(f"Scheduler: Found {expenses_count} expenses for {month}/{year} for user {user.email}. Sending report.")
            report_data = _send_monthly_report_logic(db, year, month, user.id)
            if report_data:
                try:
                    send_email(user.email, report_data["subject"], report_data["body"], is_html=True)
                    print(f"Scheduler: Email sent successfully to {user.email}.")
                except Exception as e:
                    print(f"Scheduler: Failed to send email to {user.email}: {e}")
        else:
            print(f"Scheduler: No expenses found for {month}/{year} for user {user.email}. Report not sent.")

    db.close()

template_loader = jinja2.FileSystemLoader(searchpath="./email_templates")
template_env = jinja2.Environment(loader=template_loader)

def send_password_reset_email(to_email: str, reset_link: str):
    template = template_env.get_template("password_reset_template.html")
    email_body = template.render(reset_link=reset_link)
    send_email(to_email, "Password Reset Request for TrackX", email_body, is_html=True)