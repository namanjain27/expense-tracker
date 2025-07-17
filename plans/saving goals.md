# Feature Design
## saving goal action reflect as record
1. on adding money to saving goals cards, this should register a new savings type record with the details of saving goals. Category should be "Saving Goal".
## Reflect change in balance
1. When a record with category as "saving goal" is made then it must affect the total balance. Real balance should decrease, keeping the apparent as it is.
## action on saving goal cards are linked to its records
1. if a saving goal is deleted then all its corresponding expenses will also be deleted.
2. allow to edit the target date, target amount, saving goal name on each saving goal card.
3. if saving goal name is updated then the same name update must happen in all corresponding expenses.
## saving goal redeem
1. If the user wants to discontinue the savings goal at any time, user can click on a button. This should add the target amount to the real amount in total balance.
2. if the goal was not achieved then call the button as "break piggy bank" and show a warning to confirm. Else if achieved then turn the button to -"Yippee! Redeem".
3. As we do not want the user to make double payments while saving for an item and on actual spending of the item. For this to work - change the category in corresponding records of those saving goal to "Saving Goal Redeemed". And this category should be ignored from calculating balance.

# Saving Goals Enhancement Implementation Plan                                       
                                                                                          
       Phase 1: Backend Database & Model Changes                                          
                                                                                          
       1.1 Database Schema Updates                                                        
                                                                                          
       - Add to SavingGoal Model:                                                         
         - status field (enum: 'active', 'completed', 'redeemed')                         
         - is_completed boolean field                                                   
         - redeemed_at timestamp field                                                    
       - Add to Saving Categories:                                                             
         - Add new categories: "Saving Goal" and "Saving Goal Redeemed"                        
         - Update SAVING_CATEGORIES constant                                                   
                                                                                               
       1.2 API Endpoint Enhancements                                                                                        
       - New Endpoints:                                                                        
         - PUT /saving-goals/{id}/edit - Edit goal details                                     
         - POST /saving-goals/{id}/redeem - Redeem completed goal                              
         - DELETE /saving-goals/{id} - Enhanced to delete related records                      
       - Modified Endpoints:                                                                   
         - POST /saving-goals/{id}/add-amount - Create linked savings record                   
         - Update balance calculation endpoints                                                
                                                                                               
       Phase 2: Balance System Integration                                                     
                                                                                               
       2.1 Balance Calculation Logic                                                           
                                                                                               
       - Real Balance: Include savings goal contributions as deductions                        
       - Apparent Balance: Show balance without savings goal impact                            
       - Balance API: Return both real and apparent balance                                    
       - Redeem Impact: Add redeemed amount back to real balance                               
                                                                                               
       2.2 Records Integration                                                                 
                                                                                               
       - Auto-create savings records when adding to goals                                      
       - Cascade delete savings records when goal is deleted                                   
       - Update record names when goal name changes                                            
       - Category management for redeemed goals                                                
                                                                                               
       Phase 3: Frontend Enhancements                                                          
                                                                                               
       3.1 SavingGoalCard Updates                                                              
                                                                                               
       - Add Edit Mode: Toggle between view/edit modes                                         
       - Inline Editing: Edit name, target amount, target date                                 
       - Redeem Button: Context-aware (Break Piggy Bank vs Yippee!)                            
       - Status Indicators: Visual status (active/completed/redeemed)                          
                                                                                               
       3.2 Type Definitions                                                                    
                                                                                               
       - Update SavingGoal interface: Add status, completion fields                            
       - New API types: EditSavingGoal, RedeemSavingGoal                                       
       - Balance types: RealBalance, ApparentBalance                                           
                                                                                               
       3.3 Integration Components                                                              
                                                                                               
       - Balance component: Show real vs apparent balance                                      
       - Transaction list: Show linked savings records                                         
       - Confirmation dialogs: For redeem actions                                              
                                                                                               
       Phase 4: Data Flow & Business Logic                                                     
                                                                                               
       4.1 Add Amount Flow                                                                     
                                                                                               
       1. User adds amount to goal → Update goal.saved_amount                                  
       2. Create savings record with category "Saving Goal"                                    
       3. Update real balance (decrease)                                                       
       4. Check if goal is completed → Update status                                           
                                                                                               
       4.2 Edit Goal Flow                                                                      
                                                                                               
       1. User edits goal details → Update goal record                                         
       2. Update linked savings records (if name changed)                                      
       3. Recalculate completion status                                                        
       4. Update UI immediately                                                                
                                                                                               
       4.3 Redeem Flow                                                                         
                                                                                               
       1. Check goal completion status                                                         
       2. Show appropriate confirmation (Break vs Yippee)                                      
       3. Update goal status to 'redeemed'                                                     
       4. Change linked records category to "Saving Goal Redeemed"                             
       5. Add redeemed amount to real balance                                                  
       6. Update UI to show redeemed state                                                     
                                                                                               
       Phase 5: Additional Features                                                            
                                                                                               
       5.1 Balance Management                                                                  
                                                                                               
       - Dashboard integration: Show real vs apparent balance                                  
       - Transaction filtering: Option to include/exclude redeemed goals                       
       - Reports: Include savings goal impact in monthly reports                               
                                                                                               
       5.2 User Experience                                                                     
                                                                                               
       - Progress tracking: Visual indicators for goal completion                              
       - Notifications: Goal completion alerts                                                 
       - History tracking: View redeemed goals history                                         
                                                                                               
       Implementation Order:                                                                   
                                                                                               
       1. Backend model changes & database migration                                           
       2. API endpoint updates                                                                 
       3. Frontend type definitions & basic UI                                                 
       4. Balance system integration                                                           
       5. Advanced features & polish                                                           
                                                                                               
       Files to Modify:                                                                        
                                                                                               
       - Backend: models.py, main.py, database migration                                       
       - Frontend: savingGoal.ts, SavingGoalCard.tsx, AddSavingGoalDialog.tsx                  
       - New Components: EditSavingGoalDialog.tsx, RedeemConfirmationDialog.tsx                
       - Balance: BalanceComponent.tsx, balance-related APIs      

