# Quick Debug Steps for Login Issues

## 🚀 What I've Done

1. **Enhanced Logging** - Added detailed console logs to track login attempts
2. **Better Error Handling** - Input validation and trimming  
3. **Debug Page** - Created `/debug/auth` page to test all credentials
4. **Error Messages** - More informative error display on login pages

## ✅ Test Steps (Do This Now)

### Option 1: Quick Test via Debug Page
```
1. Go to: http://localhost:3000/debug/auth
2. Click "Test All Credentials"
3. Check which portals pass/fail
4. Share the results
```

### Option 2: Manual Test with Console
```
1. Go to: http://localhost:3000/login
2. Click "Manager Portal" card
3. Open DevTools: F12 or Cmd+Opt+I
4. Go to Console tab
5. Click "Use Demo" button
6. Look for logs starting with "[Auth]"
7. Try to log in
8. Share console output
```

## 📋 Demo Credentials (Should Work)

```
Manager Portal:
  Email: manager@homeware.ae
  Password: Demo@123

Supervisor Portal:
  Email: supervisor@homeware.ae
  Password: Demo@123

Employee Portal:
  Email: employee@homeware.ae
  Password: Demo@123

Client Portal:
  Email: client@homeware.ae
  Password: Demo@123

Guest Portal:
  Email: guest@homeware.ae
  Password: Demo@123
```

## 🔍 What to Look For

If login fails, check console for one of these messages:

**SUCCESS** ✅
```
[Auth] Validating manager portal with email: manager@homeware.ae
[Auth] Login successful for manager, role: manager
```

**FAILURE** ❌
```
[Auth] Validating manager portal with email: manager@homeware.ae
[Auth] Login failed for manager
```

## 🐛 What Might Be Wrong

1. **Email mismatch** - Check if email is typed correctly
2. **Password mismatch** - Check capital letters (Demo@123 has capital D)
3. **Portal doesn't exist** - Check [Auth] Portal 'xxx' credentials not found message
4. **Dashboard page missing** - Check if /manager/dashboard page loads

## 📞 How to Report Issue

When testing, please share:
1. Which portal you tested
2. What error message appeared
3. Console log output (copy from DevTools)
4. Whether "Use Demo" button fills credentials correctly

---

**File:** `/DEBUG_LOGIN_GUIDE.md` for detailed troubleshooting
