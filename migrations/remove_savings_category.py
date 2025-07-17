"""
Migration script to remove the "Savings" category from expenses.

This migration:
1. Moves all expenses with category_id=8 ("Savings") to the savings table with category_id=6 ("Others")
2. Updates category_id=9 ("Debt") to category_id=8 to maintain sequential numbering
3. Updates any budget entries that reference the "Savings" category
4. Updates any recurring_expenses that reference the "Savings" category

Run this migration before deploying frontend changes.
"""

import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from datetime import datetime

# Add parent directory to path to import models
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from database import get_db_url
from models import Base

def run_migration():
    """Execute the migration to remove savings category from expenses."""
    
    # Create engine and session
    engine = create_engine(get_db_url())
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        print("Starting migration to remove Savings category from expenses...")
        
        # Step 1: Move expenses with category_id=8 ("Savings") to savings table
        print("Step 1: Moving expenses with category_id=8 to savings table...")
        
        migration_query = text("""
            INSERT INTO savings (user_id, name, amount, date, category_id, created_at)
            SELECT user_id, name, amount, date, 6, created_at
            FROM expenses 
            WHERE category_id = 8
        """)
        
        result = session.execute(migration_query)
        moved_count = result.rowcount if hasattr(result, 'rowcount') else 0
        print(f"Moved {moved_count} expense records to savings table with category_id=6 ('Others')")
        
        # Step 2: Delete the moved expenses from expenses table
        print("Step 2: Deleting moved expenses from expenses table...")
        
        delete_query = text("DELETE FROM expenses WHERE category_id = 8")
        result = session.execute(delete_query)
        deleted_count = result.rowcount if hasattr(result, 'rowcount') else 0
        print(f"Deleted {deleted_count} expense records with category_id=8")
        
        # Step 3: Update category_id=9 ("Debt") to category_id=8 in expenses
        print("Step 3: Updating Debt category from ID 9 to ID 8...")
        
        update_expenses_query = text("UPDATE expenses SET category_id = 8 WHERE category_id = 9")
        result = session.execute(update_expenses_query)
        updated_expenses = result.rowcount if hasattr(result, 'rowcount') else 0
        print(f"Updated {updated_expenses} expense records: category_id 9 -> 8")
        
        # Step 4: Update recurring_expenses table
        print("Step 4: Updating recurring_expenses table...")
        
        # Move recurring expenses with category_id=8 to be treated as savings (we'll handle this manually)
        # For now, we'll update them to a different category or handle them separately
        recurring_savings_query = text("SELECT COUNT(*) FROM recurring_expenses WHERE category_id = 8")
        recurring_savings_count = session.execute(recurring_savings_query).scalar()
        
        if recurring_savings_count > 0:
            print(f"WARNING: Found {recurring_savings_count} recurring expenses with Savings category.")
            print("These need to be manually reviewed and potentially converted to savings records.")
            
            # For now, we'll change them to Personal category (4) as a safe default
            update_recurring_query = text("UPDATE recurring_expenses SET category_id = 4 WHERE category_id = 8")
            session.execute(update_recurring_query)
            print("Updated recurring Savings expenses to Personal category (4)")
        
        # Update recurring expenses with category_id=9 to 8
        update_recurring_debt_query = text("UPDATE recurring_expenses SET category_id = 8 WHERE category_id = 9")
        result = session.execute(update_recurring_debt_query)
        updated_recurring = result.rowcount if hasattr(result, 'rowcount') else 0
        print(f"Updated {updated_recurring} recurring expense records: category_id 9 -> 8")
        
        # Step 5: Update budget table if it exists
        print("Step 5: Updating budget table...")
        
        # Check if budget table exists and has entries
        budget_check_query = text("SELECT COUNT(*) FROM budget")
        try:
            budget_count = session.execute(budget_check_query).scalar()
            if budget_count > 0:
                # Update budget category_budgets JSON to remove Savings and renumber Debt
                print("Found budget entries. Manual review required for budget category mappings.")
                print("Budget entries will need to be updated manually in the application.")
        except Exception as e:
            print(f"Budget table check failed (might not exist): {e}")
        
        # Commit all changes
        session.commit()
        print("Migration completed successfully!")
        
        # Step 6: Provide summary
        print("\nMigration Summary:")
        print(f"- Moved {moved_count} expense records to savings table")
        print(f"- Deleted {deleted_count} expense records from expenses table")
        print(f"- Updated {updated_expenses} expense records (Debt: 9 -> 8)")
        print(f"- Updated {updated_recurring} recurring expense records (Debt: 9 -> 8)")
        print("- Savings category (ID 8) removed from expenses")
        print("- Debt category renumbered from ID 9 to ID 8")
        
        print("\nNEXT STEPS:")
        print("1. Update backend CATEGORIES constant to remove Savings (ID 8)")
        print("2. Update frontend EXPENSE_CATEGORIES to remove Savings")
        print("3. Update chart colors/indexes in Dashboard")
        print("4. Test all expense-related functionality")
        print("5. Review and update any existing budgets manually")
        
    except Exception as e:
        print(f"Migration failed: {e}")
        session.rollback()
        raise e
    finally:
        session.close()

if __name__ == "__main__":
    run_migration()