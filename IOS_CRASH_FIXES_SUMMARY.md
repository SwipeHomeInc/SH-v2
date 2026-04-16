# iOS TestFlight Crash Fixes - Exact Changes

## Summary
These 7 files were modified to fix the iOS TestFlight crash. Copy these changes into your CA codebase.

---

## File 1: `App.tsx`

**Location**: `create-anything/_/apps/mobile/App.tsx`

### Changes:
1. **Added Platform import** (line 4):
   ```typescript
   import { Platform } from 'react-native';
   ```

2. **Replaced SafeAreaProvider initialMetrics** (lines 36-60):
   - OLD: Direct `window.innerWidth/innerHeight` access
   - NEW: Added `getInitialMetrics()` function with Platform check

3. **Added Platform check to GlobalErrorReporter** (line 66):
   ```typescript
   {Platform.OS === 'web' && <GlobalErrorReporter />}
   ```

4. **Added Platform guards to useHandshakeParent hook** (lines 77-95):
   - Added early return if not web platform

5. **Added Platform guards to CreateApp component** (lines 98-143):
   - Added `isWeb` constant
   - Added Platform checks before all `window` access
   - Made AlertModal conditional on web platform

**Full file content**: See attached App.tsx above

---

## File 2: `store.js`

**Location**: `create-anything/_/apps/mobile/src/utils/auth/store.js`

### Changes:
**Line 4-6**: Added guard for undefined environment variable
```javascript
// Guard against undefined environment variable
const projectGroupId = process.env.EXPO_PUBLIC_PROJECT_GROUP_ID || '';
export const authKey = `${projectGroupId}-jwt`;
```

**Before**:
```javascript
export const authKey = `${process.env.EXPO_PUBLIC_PROJECT_GROUP_ID}-jwt`;
```

---

## File 3: `fetch.ts`

**Location**: `create-anything/_/apps/mobile/src/__create/fetch.ts`

### Changes:
1. **Line 5-7**: Added guard for authKey
```typescript
// Guard against undefined environment variable
const projectGroupId = process.env.EXPO_PUBLIC_PROJECT_GROUP_ID || '';
const authKey = `${projectGroupId}-jwt`;
```

2. **Line 27-31**: Added guard in isFirstPartyURL function
```typescript
const isFirstPartyURL = (url: string) => {
  const baseURL = process.env.EXPO_PUBLIC_BASE_URL || '';
  return (
    url.startsWith('/') ||
    (baseURL && url.startsWith(baseURL))
  );
};
```

3. **Lines 72-81**: Added guards for headers
```typescript
// Guard against undefined environment variables
const projectGroupId = process.env.EXPO_PUBLIC_PROJECT_GROUP_ID || '';
const host = process.env.EXPO_PUBLIC_HOST || '';

const headers = {
  'x-createxyz-project-group-id': projectGroupId,
  host: host,
  'x-forwarded-host': host,
  'x-createxyz-host': host,
};
```

---

## File 4: `useAuthModal.jsx`

**Location**: `create-anything/_/apps/mobile/src/utils/auth/useAuthModal.jsx`

### Changes:
**Lines 37-39**: Added guards for environment variables
```javascript
// Guard against undefined environment variables
const proxyURL = process.env.EXPO_PUBLIC_PROXY_BASE_URL || '';
const baseURL = process.env.EXPO_PUBLIC_BASE_URL || '';
```

**Before**:
```javascript
const proxyURL = process.env.EXPO_PUBLIC_PROXY_BASE_URL;
const baseURL = process.env.EXPO_PUBLIC_BASE_URL;
```

---

## File 5: `useUpload.js`

**Location**: `create-anything/_/apps/mobile/src/utils/useUpload.js`

### Changes:
1. **Lines 4-6**: Added guard for UploadClient initialization
```javascript
// Guard against undefined environment variable - only create client if key exists
const uploadcarePublicKey = process.env.EXPO_PUBLIC_UPLOADCARE_PUBLIC_KEY || '';
const client = uploadcarePublicKey ? new UploadClient({ publicKey: uploadcarePublicKey }) : null;
```

2. **Line 28**: Added null check before using client
```javascript
if (!client) {
  throw new Error("Uploadcare client not configured");
}
```

3. **Line 43**: Added guard for baseContentURL
```javascript
// Guard against undefined environment variable
const baseContentURL = process.env.EXPO_PUBLIC_BASE_CREATE_USER_CONTENT_URL || '';
return { url: `${baseContentURL}/${result.uuid}/`, mimeType: result.mimeType || null };
```

---

## File 6: `useAuth.js`

**Location**: `create-anything/_/apps/mobile/src/utils/auth/useAuth.js`

### Changes:
**Lines 19-34**: Added error handling to SecureStore access
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
      // Still mark as ready to prevent blocking the app
      useAuthStore.setState({
        auth: null,
        isReady: true,
      });
    });
}, []);
```

**Before**:
```javascript
const initiate = useCallback(() => {
  SecureStore.getItemAsync(authKey).then((auth) => {
    useAuthStore.setState({
      auth: auth ? JSON.parse(auth) : null,
      isReady: true,
    });
  });
}, []);
```

---

## File 7: `AuthWebView.jsx`

**Location**: `create-anything/_/apps/mobile/src/utils/auth/AuthWebView.jsx`

### Changes:
1. **Line 41**: Added guard for proxyBaseURL
```javascript
const proxyBaseURL = process.env.EXPO_PUBLIC_PROXY_BASE_URL || '';
if (proxyBaseURL && event.origin !== proxyBaseURL) {
  return;
}
```

2. **Lines 77-79**: Added guards for headers
```javascript
// Guard against undefined environment variables
const projectGroupId = process.env.EXPO_PUBLIC_PROJECT_GROUP_ID || '';
const host = process.env.EXPO_PUBLIC_HOST || '';
```

3. **Lines 87-91**: Updated headers to use guarded variables
```javascript
headers={{
  "x-createxyz-project-group-id": projectGroupId,
  host: host,
  "x-forwarded-host": host,
  "x-createxyz-host": host,
}}
```

---

## Testing Checklist
After applying these changes:
- [ ] App should not crash on iOS TestFlight startup
- [ ] Web version should still work correctly
- [ ] Environment variables should be properly guarded
- [ ] Authentication flow should work
- [ ] No console errors related to undefined variables

