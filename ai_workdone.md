# Brief summary of changes made

Structure:
## time, Date
very concise and crisp details of the changes made.

Example:
## 01:50, 12-07-2025
fixed date warning in addExpense Dialog and Fixed dashboard theme

## 02:15, 13-07-2025
Implemented Phase 1 refresh token mechanism: Added RefreshToken model, auth service functions for token creation/validation/rotation, updated login endpoint to set HttpOnly cookies, added /auth/refresh and /auth/logout endpoints with token rotation security

## 02:30, 13-07-2025
Implemented Phase 2 refresh token mechanism: Added axios response interceptor for automatic 401 handling and token refresh, implemented queue system for simultaneous requests, updated login/logout functions to handle cookies, enabled withCredentials for CORS

## [Current], 16-07-2025
Implemented Phase 1 of Saving Goals Enhancement: Added status, is_completed, redeemed_at fields to SavingGoal model; created new saving categories "Saving Goal" and "Saving Goal Redeemed"; enhanced add-amount endpoint to create linked savings records; added edit and redeem API endpoints with cascade operations; updated frontend type definitions; created database migration script

## 06:45, 17-07-2025
Implemented Phase 2 & 3 of Saving Goals Enhancement: Updated SavingGoalCard component with edit mode, status indicators, and redeem functionality; added inline editing for goal name/amount/date; implemented context-aware redeem button ("Yippee! Redeem" vs "Break Piggy Bank"); added confirmation dialogs; updated SavingGoalsPanel with edit/redeem handlers; added new API endpoints for edit/redeem operations; enhanced create_saving_goal endpoint to auto-create savings records when saved_amount > 0

## 07:15, 17-07-2025
Fixed saving goals issues: Fixed 422 error on redeem button by adding empty request body; implemented dynamic saved_amount calculation from savings records instead of storing in database; updated get_saving_goals and add_amount endpoints to calculate totals from linked records; added auto-completion status updates based on calculated amounts; integrated dashboard/expense list reload on saving goal actions; added account check requirement for saving goals with user-friendly prompt

## 07:30, 17-07-2025
Fixed additional saving goals and UI issues: Fixed redeem button not showing for completed goals by updating canRedeem condition; added negative target amount validation in AddSavingGoalDialog; updated redeemed cards to show total saved amount and empty add field; enhanced ExpenseList to display date+time in 24h format with improved sorting that considers both date and time

## 07:45, 17-07-2025
Final saving goals refinements: Excluded 'Saving Goal Redeemed' category from all analysis charts and totals; kept redeemed saving goal cards frozen with saved amount and progress bar intact; maintained 'completed' status tag for redeemed achieved goals to distinguish them from broken piggy banks; reverted ExpenseList to show Date only while implementing backend sorting by date first, then by created_at for consistent chronological ordering

## 08:00, 17-07-2025
Fixed redeemed saving goals display: Updated get_saving_goals endpoint to calculate saved_amount from both 'Saving Goal' and 'Saving Goal Redeemed' categories, ensuring redeemed cards show total saved amount instead of 0; implemented dual status display showing both 'completed' and 'redeemed' chips for achieved goals that were redeemed

## 08:15, 17-07-2025
Implemented account balance distinction: Added new /accounts/balance endpoint that returns apparent_balance (DB value) and real_balance (apparent - saving goals); created AccountBalance interface and getAccountBalance API method; updated BalanceComponent to use new API and display different values for apparent vs real balance; removed incorrect balance calculation logic that was adding income/expenses; balance now properly reflects saving goals impact on available funds

## 08:30, 17-07-2025
Refined balance calculation logic to consider account modified_at timestamp: Updated get_account_balance endpoint to calculate apparent balance as DB balance plus net effect of transactions (income - expenses - savings) that meet criteria (created_at > modified_at AND date >= Date(modified_at)); real balance excludes all saving goal amounts to show available funds; updated BalanceComponent helper text to reflect new calculation methodology that only includes transactions after account's last manual update

## 10:45, 20-07-2025
Fixed timezone issues in date handling: Updated SubscriptionsPanel PAY NOW functionality to use user's local timezone instead of server timezone; modified backend AddAmountRequest model to accept optional date parameter; updated add_amount_to_saving_goal endpoint to use provided date; enhanced SavingGoalsPanel to send timezone-aware dates when adding amounts to saving goals; ensured consistent date handling across subscription payments and saving goal additions

## 11:15, 20-07-2025
Implemented subscription overdue functionality and payment dialog: Added overdue detection logic (current date > billing date + due period); implemented status chips for subscriptions (overdue/paid/active) similar to saving goals; created comprehensive payment dialog with Payment Date picker (defaulting to today), editable Amount field (defaulting to subscription amount), and calculated Next Billing Date display; reorganized subscription card layout to move Pay button next to amount for better visibility; enhanced Pay button to show error color for overdue subscriptions; ensured payment dialog changes don't affect basic recurring expense details