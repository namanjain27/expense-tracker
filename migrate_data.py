from sqlalchemy.orm import Session
from database import Base, engine, get_db
import models
from service.auth_service import get_password_hash # Import the hashing function
from datetime import datetime

def run_migration():
    db = next(get_db())
    try:
        # Ensure all tables are created, including the new 'users' table
        models.Base.metadata.create_all(bind=engine)

        # 1. Create a default user if one doesn't exist
        default_email = "admin@example.com"
        default_user = db.query(models.User).filter(models.User.email == default_email).first()

        if not default_user:
            print(f"Creating default user: {default_email}")
            hashed_password = get_password_hash("adminpassword") # Use a strong default password
            default_user = models.User(
                email=default_email,
                hashed_password=hashed_password,
                name="Default Admin",
                created_at=datetime.now(),
                last_login=datetime.now()
            )
            db.add(default_user)
            db.commit()
            db.refresh(default_user)
        else:
            print(f"Default user {default_email} already exists. Using existing user.")
        
        default_user_id = default_user.id
        print(f"Default user ID: {default_user_id}")

        # 2. Update existing records in all tables to assign them to the default user
        # Expenses
        print("Migrating Expenses...")
        updated_expenses_count = db.query(models.Expense).filter(models.Expense.user_id == None).update({"user_id": default_user_id})
        db.commit()
        print(f"Updated {updated_expenses_count} existing Expense records.")

        # Recurring Expenses
        print("Migrating Recurring Expenses...")
        updated_recurring_count = db.query(models.RecurringExpense).filter(models.RecurringExpense.user_id == None).update({"user_id": default_user_id})
        db.commit()
        print(f"Updated {updated_recurring_count} existing Recurring Expense records.")

        # Budgets
        print("Migrating Budgets...")
        updated_budgets_count = db.query(models.Budget).filter(models.Budget.user_id == None).update({"user_id": default_user_id})
        db.commit()
        print(f"Updated {updated_budgets_count} existing Budget records.")

        # Saving Goals
        print("Migrating Saving Goals...")
        updated_saving_goals_count = db.query(models.SavingGoal).filter(models.SavingGoal.user_id == None).update({"user_id": default_user_id})
        db.commit()
        print(f"Updated {updated_saving_goals_count} existing Saving Goal records.")

        print("Data migration completed successfully.")

    except Exception as e:
        db.rollback()
        print(f"An error occurred during migration: {e}")
    finally:
        db.close()

if __name__ == "__main__":
    run_migration() 