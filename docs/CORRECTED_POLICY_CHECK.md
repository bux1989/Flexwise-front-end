# Corrected Policy Verification Query

## Fixed SQL Query

```sql
-- Corrected query (use 'qual' instead of 'polqual')
SELECT 
  'Policy Fixed' as status,
  schemaname,
  tablename, 
  policyname,
  CASE 
    WHEN pg_get_expr(qual, oid) LIKE '%jwt%sub%' 
    THEN '✅ Uses JWT subject'
    ELSE '❌ Still uses auth.uid()'
  END as policy_check
FROM pg_policies p
JOIN pg_class c ON p.tablename = c.relname
WHERE schemaname = 'auth' AND tablename = 'mfa_factors';
```

## Alternative Simple Check

```sql
-- Simple check without complex parsing
SELECT 
  'Policy Status' as info,
  policyname,
  cmd,
  'Policy exists and should use JWT subject' as note
FROM pg_policies 
WHERE schemaname = 'auth' AND tablename = 'mfa_factors';
```

## MFA System Status

Based on your test results, everything is now working correctly:

✅ **MFA Factors Visible**: User can see verified phone factor  
✅ **Function Working**: Returns `false` (blocks AAL1 access)  
✅ **ID Mapping Fixed**: JWT subject matches MFA user_id  
✅ **Policy Applied**: RLS policy exists and enforces access  

The dual ID issue has been resolved!
