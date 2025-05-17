

from fuzzywuzzy import process

def match_column(possible_names, actual_columns):
    match, score = process.extractOne(possible_names, actual_columns)
    return match if score > 60 else None

target_fields = {
    'date': ['date', 'transaction date', 'value date','Txn Date', 'Expense Date'],
    'description': ['description', 'particulars', 'payment name', 'narration'],
    'withdrawal': ['debit', 'withdrawal', 'amount withdrawn'],
    'deposit': ['credit', 'deposit', 'amount deposited']
}

from datetime import datetime
import xlrd

def extract_transactions(filepath):

    book = xlrd.open_workbook(filepath)
    sh = book.sheet_by_index(0)
    col_a = sh.col_values(0, start_rowx=0, end_rowx=None)
    

    dateMatchRows = set()
    for i in range(0,len(col_a)-1):
        if col_a[i]:
            for j in (target_fields['date']):
                try:
                    if(match_column(col_a[i], j)):
                        dateMatchRows.add(i)
                except (TypeError):
                    pass
    #matchedFields is field in sheet -> our field
    matchedFields = {}
    headerRowNum = 0
    if dateMatchRows:
        # check that particular row contains other 3 cols or not and save them
        for row in dateMatchRows:
            # travel in this row - add in dict - if len(dict) == 4 then we found it!
            col_array = sh.row_values(row, start_colx=0, end_colx=None)
            for field, options in target_fields.items():
                for option in options:
                    match = match_column(option, col_array)
                    if match:
                        matchedFields[match] = field
                        if(len(matchedFields)==4): headerRowNum = row
                        break
    if(not matchedFields):
        print("Error: No Table Found!")
        
    col_name_to_index = {name: i for i, name in enumerate(sh.row_values(headerRowNum))}
    # Get column indices for our fields
    field_col_indices = {}
    for sheet_col_name, our_field in matchedFields.items():
        if sheet_col_name in col_name_to_index:
            field_col_indices[our_field] = col_name_to_index[sheet_col_name]

    # Final structured list
    transactions = []
    flag = True

    for row_idx in range(headerRowNum + 1, sh.nrows):
        row = sh.row_values(row_idx)
        if not any(row):  # skip empty rows
            continue

        try:
            record = {}

            # Date parsing (xlrd returns float for dates sometimes)
            raw_date = row[field_col_indices['date']]
            if(not row[field_col_indices['description']]): break
            if(not str(raw_date)): break
            if(str(raw_date)[0]=='*'):
                if(flag): 
                    flag = False
                    continue
            if isinstance(raw_date, float):
                dt_tuple = xlrd.xldate_as_tuple(raw_date, sh.book.datemode)
                record['Date'] = datetime(*dt_tuple).strftime('%Y-%m-%d')
            else:
                record['Date'] = str(raw_date)

            record['Description'] = str(row[field_col_indices['description']]).strip()
            record['Withdrawal'] = float(row[field_col_indices['withdrawal']] or 0)
            record['Deposit'] = float(row[field_col_indices['deposit']] or 0)

            transactions.append(record)
        except Exception as e:
            print(f"Skipping row {row_idx} due to error: {e}")
            break

    return transactions
