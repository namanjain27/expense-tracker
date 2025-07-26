#!/usr/bin/env python3
"""
Migration script to convert existing saving goal records to the new GoalAllocation system.

This script:
1. Creates the new goal_allocations table
2. Migrates existing Saving records with category_id 7 & 8 to GoalAllocation records
3. Links them properly with saving_goal_id
4. Preserves all data for historical accuracy

Run this script after updating the models.py with GoalAllocation model.
"""

import sys
import os
sys.path.append(os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

from sqlalchemy import create_engine, text
from sqlalchemy.orm import sessionmaker
from database import SQLALCHEMY_DATABASE_URL, Base
from models import GoalAllocation, Saving, SavingGoal
import models

def migrate_saving_goals_to_allocations():
    """Migrate existing saving goal records to the new GoalAllocation system"""
    
    # Create engine and session
    engine = create_engine(SQLALCHEMY_DATABASE_URL, connect_args={"check_same_thread": False})
    SessionLocal = sessionmaker(autocommit=False, autoflush=False, bind=engine)
    
    # Create all new tables (including goal_allocations)
    Base.metadata.create_all(bind=engine)
    
    db = SessionLocal()
    
    try:
        print("Starting migration of saving goal records to goal allocations...")
        
        # Step 1: Find all Saving records with category_id 7 or 8 (Saving Goal categories)
        goal_savings = db.query(Saving).filter(
            Saving.category_id.in_([7, 8])  # "Saving Goal" and "Saving Goal Redeemed"
        ).all()
        
        print(f"Found {len(goal_savings)} saving goal records to migrate...")
        
        migrated_count = 0
        skipped_count = 0
        
        for saving_record in goal_savings:
            # Step 2: Find the corresponding SavingGoal by matching name
            # Remove any prefix from the saving record name if it exists
            goal_name = saving_record.name
            
            # Find matching saving goal
            saving_goal = db.query(SavingGoal).filter(
                SavingGoal.user_id == saving_record.user_id,
                SavingGoal.name == goal_name
            ).first()
            
            if not saving_goal:
                print(f"Warning: Could not find matching saving goal for record '{goal_name}' (user_id: {saving_record.user_id})")
                skipped_count += 1
                continue
            
            # Step 3: Create GoalAllocation record
            goal_allocation = GoalAllocation(
                user_id=saving_record.user_id,
                saving_goal_id=saving_goal.id,
                amount=saving_record.amount,
                date=saving_record.date,
                created_at=saving_record.created_at,
                note=f"Migrated from saving record (category {'Saving Goal' if saving_record.category_id == 7 else 'Saving Goal Redeemed'})"
            )
            
            db.add(goal_allocation)
            migrated_count += 1
            
            print(f"Migrated: {goal_name} - ₹{saving_record.amount} -> Goal ID {saving_goal.id}")
        
        # Step 4: Commit the new GoalAllocation records
        db.commit()
        print(f"Successfully created {migrated_count} goal allocation records")
        
        # Step 5: Update SavingGoal saved_amount based on new allocations
        print("Recalculating saved amounts for all saving goals...")
        
        all_goals = db.query(SavingGoal).all()
        for goal in all_goals:
            # Calculate total from goal allocations
            total_allocated = db.query(models.func.sum(GoalAllocation.amount)).filter(
                GoalAllocation.saving_goal_id == goal.id
            ).scalar() or 0
            
            goal.saved_amount = total_allocated
            
            # Update completion status
            if total_allocated >= goal.target_amount:
                goal.is_completed = True
                if goal.status == "active":
                    goal.status = "completed"
            
            print(f"Updated goal '{goal.name}': saved_amount = ₹{total_allocated}")
        
        db.commit()
        
        # Step 6: Ask user if they want to delete the old Saving records
        print("\nMigration completed successfully!")
        print(f"Migrated: {migrated_count} records")
        print(f"Skipped: {skipped_count} records (no matching goal found)")
        
        response = input("\nDo you want to DELETE the old saving goal records (category_id 7 & 8)? (y/N): ")
        if response.lower() == 'y':
            # Delete old saving goal records
            deleted_count = db.query(Saving).filter(
                Saving.category_id.in_([7, 8])
            ).delete()
            db.commit()
            print(f"Deleted {deleted_count} old saving goal records from the savings table")
        else:
            print("Old records kept. You can manually delete them later if needed.")
            
        print("\n✅ Migration completed successfully!")
        print("The saving goals system now uses GoalAllocation records instead of Saving records.")
        print("This resolves the phantom transaction issue in monthly analysis.")
        
    except Exception as e:
        print(f"❌ Error during migration: {e}")
        db.rollback()
        raise
    finally:
        db.close()

if __name__ == "__main__":
    print("🔄 Saving Goals to Goal Allocations Migration")
    print("=" * 50)
    print("This will migrate existing saving goal data to the new GoalAllocation system.")
    print("This resolves data consistency issues in monthly analysis.")
    print()
    
    response = input("Do you want to proceed with the migration? (y/N): ")
    if response.lower() == 'y':
        migrate_saving_goals_to_allocations()
    else:
        print("Migration cancelled.")