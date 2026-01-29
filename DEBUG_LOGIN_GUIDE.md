# Debug Guide for Multi-Portal Login Issues

## Problem
Demo credentials work for Admin portal but not for other portals (Manager, Supervisor, Employee, Client, Guest).

## Root Cause Investigation
Added enhanced logging throughout the authentication system to help identify the issue.

## Files Modified

### 1. Authentication Library (`/lib/auth.ts`)
**Changes:**
- Added detailed console logging in `validateCredentials()` function
- Added portal existence check with error reporting
- Added input normalization (trim + lowercase for email)
- Detailed comparison logging showing:
  - Input email vs expected email
  - Input password vs expected password
  - Match results for each credential

### 2. Login Pages
Added enhanced error handling and logging to all portal login pages:
- `/app/login/admin/page.tsx`
- `/app/login/manager/page.tsx`
- `/app/login/supervisor/page.tsx`
- `/app/login/employee/page.tsx`
- `/app/login/client/page.tsx`
- `/app/login/guest/page.tsx`

**Changes:**
- Try-catch blocks for error handling
- Console logging of login attempts
- Detailed error message display
- Session storage logging

### 3. Debug Page (`/app/debug/auth/page.tsx`)
**URL:** http://localhost:3000/debug/auth

**Features:**
- Test all portal credentials at once
- Display DEMO_CREDENTIALS content
- Show success/failure status for each portal
- Display detailed results including redirects

## How to Debug

### Step 1: Check Browser Console
1. Go to http://localhost:3000/login/manager (or other portal)
2. Open Chrome DevTools (F12)
3. Go to Console tab
4. Try logging in with demo credentials
5. Look for logs like:
   ```
   [Auth] Validating manager portal with email: manager@homeware.ae
   [Auth] Demo creds for manager: {email: 'manager@homeware.ae', password: 'Demo@123'}
   [Auth] Comparison: {inputEmail: '...', expectedEmail: '...', ...}
   ```

### Step 2: Use Debug Page
1. Navigate to http://localhost:3000/debug/auth
2. Click "Test All Credentials" button
3. See which portals pass/fail
4. Check the DEMO_CREDENTIALS object at the bottom

### Step 3: Manual Testing
1. Try the "Use Demo" button on each login page
2. Check if credentials are filled correctly
3. Monitor console for validation logs
4. Check Network tab to see API responses (if applicable)

## Expected Demo Credentials

| Portal | Email | Password |
|--------|-------|----------|
| Admin | admin@homeware.ae | Demo@123 |
| Manager | manager@homeware.ae | Demo@123 |
| Supervisor | supervisor@homeware.ae | Demo@123 |
| Employee | employee@homeware.ae | Demo@123 |
| Client | client@homeware.ae | Demo@123 |
| Guest | guest@homeware.ae | Demo@123 |

## Common Issues & Solutions

### Issue 1: Whitespace in Input
**Solution:** The `validateCredentials()` function now trims whitespace and converts email to lowercase.

### Issue 2: Portal Not Found
**Solution:** Check console for `[Auth] Portal 'xxx' credentials not found in DEMO_CREDENTIALS`
- Verify the portal name is spelled correctly
- Check DEMO_CREDENTIALS object in `/lib/auth.ts`

### Issue 3: Password Mismatch
**Solution:** Check console comparison logs:
```
emailMatch: true/false
passwordMatch: true/false
```

### Issue 4: Redirect Not Working
**Solution:** Verify dashboard pages exist at:
- `/admin/dashboard`
- `/manager/dashboard`
- `/supervisor/dashboard`
- `/employee/dashboard`
- `/client/dashboard`
- `/guest/dashboard`

## Log Example (Success)

```
[Auth] Validating manager portal with email: manager@homeware.ae
[Auth] Demo creds for manager: {email: 'manager@homeware.ae', password: 'Demo@123'}
[Auth] Comparison: {
  inputEmail: 'manager@homeware.ae',
  expectedEmail: 'manager@homeware.ae',
  inputPassword: 'Demo@123',
  expectedPassword: 'Demo@123',
  emailMatch: true,
  passwordMatch: true
}
[Auth] Login successful for manager, role: manager
```

## Log Example (Failure)

```
[Auth] Validating manager portal with email: manager@homeware.ae
[Auth] Demo creds for manager: {email: 'manager@homeware.ae', password: 'Demo@123'}
[Auth] Comparison: {
  inputEmail: 'manager@homeware.ae',
  expectedEmail: 'manager@homeware.ae',
  inputPassword: 'Demo@123',
  expectedPassword: 'Demo@123',
  emailMatch: true,
  passwordMatch: false
}
[Auth] Login failed for manager
```

## Next Steps

1. **Test the login flow:**
   - Open http://localhost:3000/login
   - Click on Manager Portal card
   - Click "Use Demo" button
   - Check console for logs
   - Try to log in

2. **Report findings:**
   - Check console logs for validation steps
   - Note which portal fails and where
   - Check if credentials are being filled correctly
   - Verify dashboard pages are loading

3. **If still failing:**
   - Open /debug/auth page
   - Run test
   - Share results of what passes/fails
   - Check if DEMO_CREDENTIALS are correct

---
*Last Updated: January 28, 2026*
