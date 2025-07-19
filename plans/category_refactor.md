There are few existing features that needs to be refactored after well-thought and planning. Features being - Category for the 3 record types (Income, Expense and Savings), Saving Goals and Budget.

# Final Expectation
## Add budget for income and savings categories too
1. update the existing budget dialog box to set the budget plan for other record types too.
## ability to add custom category for all 3 record type
1. User should be able to add a custom category. This should be user-specific. This could be done from add record dialog box and budget dialog box both. 
2. For each category, we allow the user to set a budget. Same should be allowed for new added categories.
## saving goal action reflect as record
3. on adding money to saving goals cards, this should register a new savings type record with the details of saving goals. Category should be "Saving Goal".
## Reflect change in balance
4. When a record with category as "saving goal" is made then it must affect the total balance. Real balance should decrease, keeping the apparent as it is.
## control - which user can add custom categories
4. Lets call the existing categories as primary categories, including "saving goal". From backend I want to control weather to allow a user with custom catgeories or not.
## action on saving goal cards are linked to its records
5. if a saving goal is deleted then all its corresponding expenses will also be deleted.
6. allow to edit the target date, target amount, saving goal name on each saving goal card.
7. if saving goal name is updated then the same name update must happen in all corresponding expenses.
## saving goal redeem when achieved
8. As we do not want the user to make double payments while saving for an item and on actual spending of the item. Once a saving goal is achieved, a button should appear saying - "Transfer to account". This should add the target amount to the real amount in total balance. For this to work - change the category in corresponding records of those saving goal to "Saving Goal Redeemed". And this category should be ignored from calculating balance, 

expense, income, savings -> add a monthly health floating emoji
categorical expenses -> expense type
budget vs expenses -> expense type categories
daily expenses -> monthly

