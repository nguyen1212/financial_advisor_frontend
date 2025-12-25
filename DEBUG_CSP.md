# CSP Debug Guide 🕵️

## 1. Check Backend CSP Headers

**Open browser dev tools:**
1. Go to Network tab
2. Reload the page
3. Look for the main document request (usually first one)
4. Click on it → Headers tab
5. Check Response Headers for: `Content-Security-Policy`

**Expected:** You should see:
```
Content-Security-Policy: frame-ancestors 'none'; img-src 'self' data:
```

## 2. Check if CSP is Being Applied

**In Console tab, look for CSP violation errors:**
- If CSP is working, you should see errors like:
```
Refused to load the image 'https://example.com/image.jpg' because it violates the following Content Security Policy directive: "img-src 'self' data:".
```

## 3. Test Different Scenarios

### A) Test with external image:
Open console and run:
```javascript
const img = new Image();
img.src = 'https://picsum.photos/200/300';
document.body.appendChild(img);
```

**Expected result with CSP:** Should show CSP violation error and not load

### B) Test with data URL:
```javascript
const img = new Image();
img.src = 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mP8/5+hHgAHggJ/PchI7wAAAABJRU5ErkJggg==';
document.body.appendChild(img);
```

**Expected result:** Should load (data: is allowed)

## 4. Possible Issues

### Issue 1: Backend Not Sending CSP
- Headers missing in Network tab
- **Fix:** Check backend CSP middleware

### Issue 2: Frontend Override (shouldn't happen now)
- CSP in Response headers but different in browser
- **Fix:** Already removed from next.config.ts

### Issue 3: CSP Syntax Error
- `img-src 'self' data:` should be valid
- **Test:** Try `img-src 'self'` only

### Issue 4: Development Mode Issues
- Some dev tools might bypass CSP
- **Test:** Try production build

### Issue 5: Cached Headers
- Browser might cache old headers
- **Fix:** Hard refresh (Ctrl+Shift+R) or incognito mode

## 5. Quick Test Commands

Run in browser console:
```javascript
// Check if CSP header exists
fetch('/', {method: 'HEAD'}).then(r => console.log(r.headers.get('Content-Security-Policy')));

// Test image loading directly
const testImg = new Image();
testImg.onload = () => console.log('✅ Image loaded');
testImg.onerror = () => console.log('❌ Image blocked');
testImg.src = 'https://httpbin.org/image/png';
```