import os
import sys
from sqlalchemy import create_engine, text

# Add the parent directory to Python path
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

# Database configuration
SQLALCHEMY_DATABASE_URL = "sqlite:///./expense_tracker.db"

def migrate():
    # Create engine
    engine = create_engine(SQLALCHEMY_DATABASE_URL)
    
    # Add intention column to expenses table
    with engine.connect() as connection:
        try:
            # Add column to expenses table
            connection.execute(text("""
                ALTER TABLE expenses 
                ADD COLUMN intention VARCHAR DEFAULT 'Saving'
            """))
            
            # Add column to recurring_expenses table
            connection.execute(text("""
                ALTER TABLE recurring_expenses 
                ADD COLUMN intention VARCHAR DEFAULT 'Saving'
            """))
            
            # Update existing records in expenses table
            connection.execute(text("""
                UPDATE expenses 
                SET intention = 'Saving' 
                WHERE intention IS NULL
            """))
            
            # Update existing records in recurring_expenses table
            connection.execute(text("""
                UPDATE recurring_expenses 
                SET intention = 'Saving' 
                WHERE intention IS NULL
            """))
            
            connection.commit()
            print("Migration completed successfully!")
            
        except Exception as e:
            print(f"Error during migration: {str(e)}")
            connection.rollback()

if __name__ == "__main__":
    migrate() 