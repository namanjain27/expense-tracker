# Plan:

## Add Record [Replacement of Add Expense button]
1. instead of add expense, 'Add Record' will be there
2. It has 3 state toggle switch on top - Income, Expense (Set as Default), Saving
3. Accordingly the form input fields will change as described below:
    -> Income - Name, Amount, Date (Today by default), Category
    -> Expense - Remains as existing
    -> Saving - Name, Amount, Date (Today by default), Category
4. other conditions for all 3 types of record:
    -> Name field should be mentioned as optional
    -> Income categories - Salary, Interest, Gift, Matured Amount, Divident, Stocks, Side Hustle
    -> Saving Categories - Stocks, PPF, Recurring deposit, Fixed Deposit, Mutual Fund, Others
    ->we will not allow for update in records. So plan the APIs for create, read and delete only.

## Create separate database tables for income and savings. Containing created_date too.
## Add a income, expenses, savings tri-color wheel for the visual monthly analysis in dashboard

---

## Total Balance [New section to show total balance from all accounts of the user]
1. It has 2 values: Real (shown in larger size) and Apparent. Basically, real = apparent - (outstanding amount + unbilled amount) in credit cards
2. We have a future plan of adding credit cards section. So on adding a credit card expense, we will decrease the real amount and keep the apparent amount as it is.
3. We may have a future plan to allow user to create multiple accounts so create a separate table named - 'Accounts', Containing - User_id, balance amount, created_date, modified_date

---

# Implementation Plan

## Backend Changes (models.py, main.py)

### 1. Database Models (models.py)
- Add `Income` table with fields: id, user_id, name, amount, date, category_id, created_at
- Add `Saving` table with fields: id, user_id, name, amount, date, category_id, created_at  
- Add `Account` table with fields: id, user_id, balance, created_at, modified_at
- Add relationships to User model

### 2. API Constants and Categories (main.py)
- Define `INCOME_CATEGORIES`: {1: "Salary", 2: "Interest", 3: "Gift", 4: "Matured Amount", 5: "Dividend", 6: "Stocks", 7: "Side Hustle", 8: "Others"}
- Define `SAVING_CATEGORIES`: {1: "Stocks", 2: "PPF", 3: "Recurring deposit", 4: "Fixed Deposit", 5: "Mutual Fund", 6: "Others"}

### 3. Pydantic Models (main.py)
- Create `IncomeBase`, `IncomeCreate`, `Income` models 
- Create `SavingBase`, `SavingCreate`, `Saving` models
- Create `AccountBase`, `AccountCreate`, `Account` models

### 4. API Endpoints (main.py)
- **Income APIs**: POST /income/, GET /income/, DELETE /income/{id}, GET /income/total
- **Saving APIs**: POST /savings/, GET /savings/, DELETE /savings/{id}, GET /savings/total  
- **Account APIs**: POST /accounts/, GET /accounts/, PUT /accounts/{id}
- **Summary API**: GET /monthly-summary (income, expenses, savings breakdown)

## Frontend Changes (AddExpenseDialog.tsx -> AddRecordDialog.tsx)

### 1. Component Restructuring
- Rename `AddExpenseDialog` to `AddRecordDialog`
- Add toggle switch with 3 states: Income, Expense (default), Saving
- Conditionally render form fields based on selected record type
- Update category dropdown to use appropriate category list based on record type

### 2. Form Field Changes
- Make Name field optional for all record types
- Remove "intention" field for Income and Saving types
- Remove "recurring" checkbox for Income and Saving types
- Update form validation accordingly

### 3. API Integration
- Update onAdd prop to handle different record types
- Create separate API calls for income, expense, and saving records
- Update parent components to handle new record types

## Frontend Dashboard Updates

### 1. Balance Section
- Add new Balance component showing Real and Apparent balance
- Position prominently in dashboard layout
- Implement real vs apparent balance calculation logic

### 2. Monthly Analysis Visualization  
- Create tri-color wheel chart component for income/expenses/savings
- Update existing chart components to include income and savings data
- Modify chart service to provide combined data

### 3. Navigation and State
- Update expense list components to show all record types
- Add filters for record type (income/expense/saving)
- Update monthly navigation to include all record types

## Implementation Order

### Phase 1: Backend Foundation
1. Add new database models (Income, Saving, Account)
2. Define category constants
3. Create Pydantic models
4. Implement basic CRUD APIs for Income and Saving

### Phase 2: Backend Balance Logic  
1. Implement Account APIs - its get API will be used for balance calculation currently
2. Add monthly summary endpoint
3. Update existing expense APIs to work with new balance system

### Phase 3: Frontend Core Changes
1. Rename and restructure AddExpenseDialog component
2. Implement toggle switch and conditional form rendering
3. Update API calls and parent component integration
4. Test record creation for all three types

### Phase 4: Frontend Dashboard & Visualization
1. Create Balance component
2. Implement tri-color wheel chart
3. Update existing charts to include income/savings
4. Add record type filters to lists

### Phase 5: Integration & Testing
1. End-to-end testing of all record types
2. Balance calculation verification
3. Chart data accuracy validation
4. UI/UX refinements