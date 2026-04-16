# iOS TestFlight Crash Fix - Prompt for Create Anything

## Problem
The app crashes immediately on iOS TestFlight before showing the first screen. The crash happens during app initialization, likely due to web-specific code executing on native iOS or undefined environment variables.

## Critical Issues to Fix

### 1. Web-Specific Code in App.tsx (CRITICAL - Most Likely Cause)

**File**: `create-anything/_/apps/mobile/App.tsx`

**Issue**: The file contains web-specific code that executes unconditionally on iOS native, causing immediate crashes when accessing `window` object.

**Specific Problems**:
- Line 44-45: `window.innerWidth` and `window.innerHeight` accessed without Platform check
- Lines 61-76: `useHandshakeParent` hook uses `window.parent.postMessage` unconditionally
- Lines 78-113: `CreateApp` component uses `window.addEventListener` and `window.parent.postMessage` without guards

**Fix Required**:
1. Wrap all `window` access in `Platform.OS === 'web'` checks or `typeof window !== 'undefined'` guards
2. Make `useHandshakeParent` hook only execute on web platform
3. Make `CreateApp` component's window-related code conditional on web platform
4. Fix `SafeAreaProvider` initialMetrics (lines 39-47) to not reference `window` on native - use safe defaults for iOS

**Example Fix Pattern**:
```typescript
// Instead of: window.innerWidth
// Use: Platform.OS === 'web' ? window.innerWidth : 390

// Wrap hooks/components that use window:
if (Platform.OS === 'web') {
  // window-related code here
}
```

---

### 2. Undefined Environment Variables (HIGH PRIORITY)

**Issue**: Multiple files access `process.env.EXPO_PUBLIC_*` variables without null/undefined checks, causing crashes when these are undefined in production builds.

**Files to Fix**:

#### File 1: `create-anything/_/apps/mobile/src/utils/auth/store.js`
- **Line 4**: `EXPO_PUBLIC_PROJECT_GROUP_ID` used in template literal without guard
- **Fix**: Add null check or provide default value before using in template literal

#### File 2: `create-anything/_/apps/mobile/src/__create/fetch.ts`
- **Lines 5, 27, 37-38, 70-73**: Multiple env vars accessed directly
- **Fix**: Add guards for all `process.env.EXPO_PUBLIC_*` accesses, especially:
  - `EXPO_PUBLIC_PROJECT_GROUP_ID`
  - `EXPO_PUBLIC_BASE_URL`
  - `EXPO_PUBLIC_PROXY_BASE_URL`
  - `EXPO_PUBLIC_HOST`

#### File 3: `create-anything/_/apps/mobile/src/utils/auth/useAuthModal.jsx`
- **Lines 37-38**: `EXPO_PUBLIC_PROXY_BASE_URL` and `EXPO_PUBLIC_BASE_URL` accessed without guards
- **Fix**: Add null/undefined checks before using these URLs

#### File 4: `create-anything/_/apps/mobile/src/utils/useUpload.js`
- **Line 3**: `EXPO_PUBLIC_UPLOADCARE_PUBLIC_KEY` passed to UploadClient constructor
- **Line 36**: `EXPO_PUBLIC_BASE_CREATE_USER_CONTENT_URL` used in template literal
- **Fix**: Add guards and provide safe defaults or early returns if keys are missing

**Fix Pattern**:
```javascript
// Instead of: process.env.EXPO_PUBLIC_SOME_VAR
// Use: process.env.EXPO_PUBLIC_SOME_VAR || 'default-value'

// For template literals:
const projectGroupId = process.env.EXPO_PUBLIC_PROJECT_GROUP_ID || '';
const authKey = `${projectGroupId}-jwt`;
```

---

### 3. SecureStore Error Handling

**File**: `create-anything/_/apps/mobile/src/app/_layout.jsx`

**Issue**: `initiate()` function (called in useEffect on line 34) accesses SecureStore without error handling. If SecureStore fails on iOS, it could cause a crash.

**Fix**: Wrap SecureStore access in try-catch block:
```javascript
const initiate = useCallback(() => {
  SecureStore.getItemAsync(authKey)
    .then((auth) => {
      useAuthStore.setState({
        auth: auth ? JSON.parse(auth) : null,
        isReady: true,
      });
    })
    .catch((error) => {
      console.error('SecureStore error:', error);
      useAuthStore.setState({
        auth: null,
        isReady: true, // Still mark as ready to prevent blocking
      });
    });
}, []);
```

---

## Testing Checklist

After fixes are applied:
1. Verify app doesn't crash on iOS native (use iOS simulator or device)
2. Verify web version still works correctly
3. Check that environment variables are properly guarded
4. Test authentication flow to ensure SecureStore works
5. Verify no console errors related to undefined variables

## Priority Order

1. **FIRST**: Fix `App.tsx` web-specific code (this is most likely causing immediate crash)
2. **SECOND**: Add environment variable guards in all listed files
3. **THIRD**: Add SecureStore error handling

---

## Additional Notes

- EAS handles bundling, so environment variables should be configured in EAS build settings
- However, code must still guard against undefined values to prevent runtime crashes
- All `window` object access must be guarded for native platforms
- Use `Platform.OS === 'web'` checks consistently throughout the codebase

