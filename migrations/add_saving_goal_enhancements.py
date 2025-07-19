"""
Migration script to add new fields to SavingGoal model for enhanced functionality.

This migration:
1. Adds status column to saving_goals table with default 'active'
2. Adds is_completed boolean column with default False
3. Adds redeemed_at timestamp column (nullable)
4. Ensures all existing goals have proper default values

Run this migration before deploying the enhanced saving goals feature.
"""

import sys
import os
from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from datetime import datetime

# Add parent directory to path to import models
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

get_db_url = "sqlite:///../expense_tracker.db"
from models import Base

def run_migration():
    """Execute the migration to add saving goal enhancement fields."""
    
    # Create engine and session
    engine = create_engine(get_db_url)
    Session = sessionmaker(bind=engine)
    session = Session()
    
    try:
        print("Starting migration to add saving goal enhancement fields...")
        
        # Step 1: Add status column
        print("Step 1: Adding status column to saving_goals table...")
        try:
            add_status_query = text("""
                ALTER TABLE saving_goals 
                ADD COLUMN status VARCHAR DEFAULT 'active' NOT NULL
            """)
            session.execute(add_status_query)
            print("Added status column successfully")
        except Exception as e:
            print(f"Status column might already exist: {e}")
        
        # Step 2: Add is_completed column
        print("Step 2: Adding is_completed column to saving_goals table...")
        try:
            add_is_completed_query = text("""
                ALTER TABLE saving_goals 
                ADD COLUMN is_completed BOOLEAN DEFAULT FALSE NOT NULL
            """)
            session.execute(add_is_completed_query)
            print("Added is_completed column successfully")
        except Exception as e:
            print(f"is_completed column might already exist: {e}")
        
        # Step 3: Add redeemed_at column
        print("Step 3: Adding redeemed_at column to saving_goals table...")
        try:
            add_redeemed_at_query = text("""
                ALTER TABLE saving_goals 
                ADD COLUMN redeemed_at DATETIME NULL
            """)
            session.execute(add_redeemed_at_query)
            print("Added redeemed_at column successfully")
        except Exception as e:
            print(f"redeemed_at column might already exist: {e}")
        
        # Step 4: Update existing goals to set is_completed based on saved_amount vs target_amount
        print("Step 4: Updating completion status for existing goals...")
        
        update_completion_query = text("""
            UPDATE saving_goals 
            SET is_completed = TRUE, status = 'completed'
            WHERE saved_amount >= target_amount AND status = 'active'
        """)
        result = session.execute(update_completion_query)
        updated_count = result.rowcount if hasattr(result, 'rowcount') else 0
        print(f"Updated completion status for {updated_count} goals")
        
        # Commit all changes
        session.commit()
        print("Migration completed successfully!")
        
        # Step 5: Provide summary
        print("\nMigration Summary:")
        print("- Added 'status' column with default 'active'")
        print("- Added 'is_completed' boolean column with default FALSE")
        print("- Added 'redeemed_at' timestamp column (nullable)")
        print(f"- Updated completion status for {updated_count} existing goals")
        
        print("\nNEXT STEPS:")
        print("1. Deploy backend changes with enhanced API endpoints")
        print("2. Update frontend components to use new fields")
        print("3. Test all saving goal functionality")
        print("4. Verify balance integration works correctly")
        
    except Exception as e:
        print(f"Migration failed: {e}")
        session.rollback()
        raise e
    finally:
        session.close()

if __name__ == "__main__":
    run_migration()