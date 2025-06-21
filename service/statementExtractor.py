import os
from datetime import datetime
import xlrd
import openpyxl
from fuzzywuzzy import process
import csv


def match_column(possible_names, actual_columns):
    match, score = process.extractOne(possible_names, actual_columns)
    return match if score > 80 else None

target_fields = {
    'date': ['date', 'transaction date', 'value date','Txn Date', 'Expense Date'],
    'description': ['description', 'particulars', 'payment name', 'narration'],
    'withdrawal': ['debit', 'withdrawal', 'amount withdrawn'],
    'deposit': ['credit', 'deposit', 'amount deposited']
}

def _to_float(value):
    """Safely convert a value to a float, handling None, empty strings, and commas."""
    if value is None:
        return 0.0
    
    value_str = str(value).replace(',', '').strip()
    if not value_str:
        return 0.0
    
    try:
        return float(value_str)
    except ValueError:
        return 0.0

def _read_xls(filepath):
    try:
        book = xlrd.open_workbook(filepath)
        sh = book.sheet_by_index(0)
        data = []
        for row_idx in range(sh.nrows):
            row_values = []
            for col_idx in range(sh.ncols):
                cell_type = sh.cell_type(row_idx, col_idx)
                cell_value = sh.cell_value(row_idx, col_idx)
                if cell_type == xlrd.XL_CELL_DATE:
                    dt_tuple = xlrd.xldate_as_tuple(cell_value, book.datemode)
                    row_values.append(datetime(*dt_tuple))
                else:
                    row_values.append(cell_value)
            data.append(row_values)
        return data
    except xlrd.biffh.XLRDError:
        try:
            with open(filepath, 'r', encoding='utf-8') as f:
                reader = csv.reader(f)
                return [row for row in reader]
        except Exception as e:
            raise ValueError(f"File is not a valid .xls file and could not be read as CSV. Error: {e}")

def _read_xlsx(filepath):
    try:
        book = openpyxl.load_workbook(filepath, data_only=True)
        sh = book.active
        return [[cell.value for cell in row] for row in sh.iter_rows()]
    except Exception as e:
        raise ValueError(f"Failed to read .xlsx file. Error: {e}")


def extract_transactions(filepath):
    filename, extension = os.path.splitext(filepath)
    extension = extension.lower()

    if extension == '.xls':
        data = _read_xls(filepath)
    elif extension == '.xlsx':
        data = _read_xlsx(filepath)
    else:
        raise ValueError(f"Unsupported file format: {extension}")

    if not data:
        return []

    col_a = [row[0] if row else None for row in data]

    dateMatchRows = set()
    for i, cell_value in enumerate(col_a):
        if cell_value and isinstance(cell_value, str):
            for j in (target_fields['date']):
                if match_column(j, [cell_value]):
                    dateMatchRows.add(i)
                    break

    matchedFields = {}
    headerRowNum = -1
    best_match_count = 0

    for row_idx in dateMatchRows:
        if row_idx >= len(data): continue
        row_values_str = [str(v) if v is not None else '' for v in data[row_idx]]
        current_matched_fields = {}
        
        for field, options in target_fields.items():
            for option in options:
                match = match_column(option, row_values_str)
                if match and match not in current_matched_fields:
                    current_matched_fields[match] = field
                    break
        
        if len(current_matched_fields) > best_match_count:
            best_match_count = len(current_matched_fields)
            matchedFields = current_matched_fields
            headerRowNum = row_idx
        
        if best_match_count == len(target_fields):
            break

    if headerRowNum == -1:
        print("Error: Could not find a suitable header row.")
        return []
    
    col_name_to_index = {str(name): i for i, name in enumerate(data[headerRowNum])}
    field_col_indices = {}
    for sheet_col_name, our_field in matchedFields.items():
        if sheet_col_name in col_name_to_index:
            field_col_indices[our_field] = col_name_to_index[sheet_col_name]

    transactions = []

    for row_idx in range(headerRowNum + 1, len(data)):
        row = data[row_idx]
        if not any(row) or len(row) <= max(field_col_indices.values() or [0]):
            continue

        try:
            record = {}

            date_col_idx = field_col_indices.get('date')
            desc_col_idx = field_col_indices.get('description')
            with_col_idx = field_col_indices.get('withdrawal')
            dep_col_idx = field_col_indices.get('deposit')

            if date_col_idx is None or desc_col_idx is None:
                continue

            raw_date = row[date_col_idx]
            if not raw_date:
                continue

            date_str = str(raw_date).strip()
            if not any(char.isdigit() for char in date_str):
                print(f"Skipping row {row_idx} due to invalid date (no numerals): '{date_str}'")
                continue

            if not row[desc_col_idx]: 
                continue
            
            if isinstance(raw_date, datetime):
                record['Date'] = raw_date.strftime('%Y-%m-%d')
            elif isinstance(raw_date, str):
                try:
                    record['Date'] = datetime.strptime(raw_date, '%d-%m-%Y').strftime('%Y-%m-%d')
                except ValueError:
                    record['Date'] = str(raw_date)
            else:
                record['Date'] = str(raw_date)

            record['Description'] = str(row[desc_col_idx]).strip()
            
            withdrawal_val = row[with_col_idx] if with_col_idx is not None else 0
            deposit_val = row[dep_col_idx] if dep_col_idx is not None else 0
            
            record['Withdrawal'] = _to_float(withdrawal_val)
            record['Deposit'] = _to_float(deposit_val)

            transactions.append(record)
        except (ValueError, IndexError) as e:
            print(f"Skipping row {row_idx} due to error: {e}")
            continue

    return transactions
