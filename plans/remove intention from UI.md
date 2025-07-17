# Remove Intention from UI - Implementation Plan

## Overview
This document outlines the changes made to remove the expense intention feature (Need, Want, Saving) from the UI while maintaining "Need" as the default value for backend POST requests.

## Changes Made

### 1. Frontend UI Changes

#### `expense-tracker-frontend/src/components/AddRecordDialog.tsx`
- **Removed**: intention state variable (`const [intention, setIntention] = useState<IntentionType>('Need');`)
- **Removed**: intention form field (FormControl with Select for intention)
- **Removed**: intention from resetForm function
- **Modified**: handleSubmit to hardcode intention as "Need" when creating expense data
- **Result**: Users no longer see the intention selection field, but all expenses are created with "Need" as default

### 2. Dashboard Chart Removal

#### `expense-tracker-frontend/src/components/Dashboard.tsx`
- **Removed**: intentionData state and related type definitions
- **Removed**: fetchIntentionData function
- **Removed**: fetchIntentionData() calls from useEffect and other refresh functions
- **Removed**: intentionChartData and intentionChartOptions configuration
- **Removed**: "Expense Intention Breakdown" chart Paper component
- **Result**: Dashboard no longer displays the intention breakdown chart

### 3. Email Template Updates

#### `email_templates/monthly_report_template.html`
- **Removed**: intention breakdown chart div and img tag
- **Removed**: "Needs vs Wants vs Savings" chart reference

#### `email_templates/monthly_report_template_no_budget.html`
- **Removed**: intention breakdown chart div and img tag  
- **Removed**: "Needs vs Wants vs Savings" chart reference
- **Result**: Monthly report emails no longer include intention breakdown visualization

### 4. Backend Chart Service

#### `service/chart_service.py`
- **Removed**: `generate_intention_breakdown_chart` function entirely
- **Result**: Backend no longer generates intention breakdown charts

## Impact Assessment

### Positive Changes
- Simplified user interface - one less field to fill
- Streamlined dashboard with fewer charts
- Reduced cognitive load for users
- Cleaner email reports

### Maintained Functionality
- All existing expense data with intention values remains intact
- Backend API still accepts and stores intention values
- New expenses automatically get "Need" as intention value
- No breaking changes to database schema

### Future Considerations
- The intention field still exists in the database and backend
- If needed, the UI can be re-enabled by reversing these changes
- Existing analytics/reports that rely on intention data will still work
- Consider removing intention from backend if never needed again

## Files Modified
1. `/expense-tracker-frontend/src/components/AddRecordDialog.tsx`
2. `/expense-tracker-frontend/src/components/Dashboard.tsx`
3. `/email_templates/monthly_report_template.html`
4. `/email_templates/monthly_report_template_no_budget.html`
5. `/service/chart_service.py`

## Testing Recommendations
- Test adding new expenses to ensure they get "Need" as default intention
- Verify dashboard loads without intention chart
- Test monthly report generation and email sending
- Ensure existing expenses still display correctly in transaction lists