# Apparent balance = Balance in DB table
# Real balance represents the hidden balance which will eventual balance. 
# Simple condition:
1. Apparent subtracted by (sum of all Savings records with category "Saving Goal") = real balance. Because we want to show that the user is actually saving up.
2. Keep this condition modular, as we will introduce more conditions later which will affect the apparent and real balance relationship 
# After any saving goal redeem:
new real balance = old real balance + Saved amount. Keeping the apparent balance unaffected. 
# real balance should be calculated dynamically everytime and reload when changes are made to any saving goal. 
# As a consequence, if a record with category - "saving goal" is deleted then real balance should be added by that saved amount.
# On account balance update:
1. The new balance is the new apparent balance. 
2. apparent balance is not affected by saving goals.
3. if (created_at of record > updated_at of account) && (date of record >= Date(update_at) of account) then only it updates the balance amount. And hence affects the apparent and real balance.
4. Updated_at dateTime only updates when the user has manually updated.
------------
Backend Balance Calculation (main.py:1181-1243):
  - Apparent Balance: DB balance + net effect of transactions
  after account's modified_at
  - Transaction Filtering: Only includes records where created_at     
   > modified_at AND date >= Date(modified_at)
  - Real Balance: Apparent balance minus ALL saving goal amounts      
  (shows available funds)

  Key Logic Implementation:
  # Only consider transactions after account's last manual update     
  relevant_income = income records meeting criteria
  relevant_expenses = expense records meeting criteria
  relevant_savings = saving records meeting criteria

  # Apparent balance = DB balance + net transaction effect
  apparent_balance = db_balance + relevant_income -
  relevant_expenses - relevant_savings

  # Real balance = apparent balance - all saving goals (money
  locked away)
  real_balance = apparent_balance - all_saving_goals
------
Account Balance Implementation Plan                                    
                                                                         
  Goal                                                                   
                                                                         
  Implement apparent vs real balance distinction according to the plan   
  specifications:                                                        
  - Apparent Balance = Balance stored in DB (unchanged by saving goals)  
  - Real Balance = Apparent Balance - sum of active "Saving Goal"        
  category savings                                                       
                                                                         
  Changes Required                                                       
                                                                         
  1. Backend API Updates (main.py)                                       
                                                                         
  - Create new endpoint /accounts/balance that returns both apparent     
  and real balance                                                       
  - Implement balance calculation logic:                                 
    - Apparent balance = account.balance from DB                         
    - Real balance = apparent balance - sum of category 7 ("Saving       
  Goal") savings records                                                 
  - Update existing account endpoints to maintain apparent balance only  
  - Ensure balance updates only affect records created after             
  account.modified_at                                                    
                                                                         
  2. Frontend BalanceComponent.tsx Updates                               
                                                                         
  - Remove current incorrect balance calculation logic (lines 50-78)     
  - Update to fetch and display both apparent and real balance from new  
   API                                                                   
  - Fix display to show different values for apparent vs real balance    
  - Update on saving goal changes (when refreshTrigger changes)          
  - Maintain current edit functionality for apparent balance only        
                                                                         
  3. Integration Points                                                  
                                                                         
  - Ensure SavingGoalsPanel triggers balance refresh when adding money   
  to goals                                                               
  - Balance should recalculate when saving goal records are              
  added/deleted                                                          
  - Redeeming goals (category 7→8 change) should increase real balance   
  - Account balance updates should only affect future records per plan   
  rules                                                                  
                                                                         
  4. Data Flow                                                           
                                                                         
  - User adds money to saving goal → Creates category 7 record → Real    
  balance decreases                                                      
  - User redeems saving goal → Changes category 7→8 → Real balance       
  increases by redeemed amount                                           
  - User updates account balance → Only apparent balance changes, real   
  balance recalculates                                                   
                                                                         
  Files to Modify                                                        
                                                                         
  1. /mnt/d/codes/expenseTrackerPy/main.py - Add balance calculation     
  endpoint                                                               
  2. /mnt/d/codes/expenseTrackerPy/expense-tracker-frontend/src/compone  
  nts/BalanceComponent.tsx - Update to use new API                       
  3. /mnt/d/codes/expenseTrackerPy/expense-tracker-frontend/src/service  
  s/api.ts - Add new balance API method 