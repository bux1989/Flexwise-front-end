# <table_name>

**Type:** Table  
**Purpose:** <one-sentence summary>  
**Schema:** public  
**Related:** <links to views/functions/triggers>

## Columns
| Name | Type | PK | FK → | Not Null | Default | Notes |
|------|------|----|------|----------|---------|-------|
| ...  | ...  | ✅ | table.column | ✅ | ... | ... |

## Keys & Constraints
- PK: ...
- Unique: ...
- Check: ...

## Indexes
- `<index_name>` on (col1, col2) – purpose: <filter/order/join>

## RLS
- Enabled: Yes/No
- Policies:
  - `<policy_name>` (SELECT): `<using expression>` – intent: <explain>

## Triggers
- `<trigger_name>` BEFORE/AFTER INSERT/UPDATE/DELETE → `<function_name>`

## Dependencies
- Writes to: ...
- Reads from: ...
- Referenced by: ...

## Example Queries
```sql
-- common read
SELECT ... FROM <table_name>
WHERE ...;

-- common write
INSERT INTO <table_name> (...) VALUES (...);
```

## Notes

* <edge cases, pitfalls, performance notes>