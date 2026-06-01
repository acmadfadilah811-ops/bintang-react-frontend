# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: auth.spec.js >> Autentikasi & Login Page >> Harus menampilkan elemen-elemen halaman login dengan benar
- Location: tests\e2e\auth.spec.js:9:3

# Error details

```
Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/
Call log:
  - navigating to "http://localhost:5173/", waiting until "load"

```

# Page snapshot

```yaml
- generic [ref=e3]:
  - generic [ref=e6]:
    - heading "This site can’t be reached" [level=1] [ref=e7]
    - paragraph [ref=e8]:
      - strong [ref=e9]: localhost
      - text: refused to connect.
    - generic [ref=e10]:
      - paragraph [ref=e11]: "Try:"
      - list [ref=e12]:
        - listitem [ref=e13]: Checking the connection
        - listitem [ref=e14]:
          - link "Checking the proxy and the firewall" [ref=e15] [cursor=pointer]:
            - /url: "#buttons"
    - generic [ref=e16]: ERR_CONNECTION_REFUSED
  - generic [ref=e17]:
    - button "Reload" [ref=e19] [cursor=pointer]
    - button "Details" [ref=e20] [cursor=pointer]
```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | test.describe('Autentikasi & Login Page', () => {
  4  |   test.beforeEach(async ({ page }) => {
  5  |     // Navigasi ke halaman login sebelum setiap pengujian
> 6  |     await page.goto('/');
     |                ^ Error: page.goto: net::ERR_CONNECTION_REFUSED at http://localhost:5173/
  7  |   });
  8  | 
  9  |   test('Harus menampilkan elemen-elemen halaman login dengan benar', async ({ page }) => {
  10 |     // Memastikan input username dan password ada di halaman
  11 |     const usernameInput = page.locator('input#username');
  12 |     const passwordInput = page.locator('input#password');
  13 |     const loginButton = page.locator('button[type="submit"]');
  14 | 
  15 |     await expect(usernameInput).toBeVisible();
  16 |     await expect(passwordInput).toBeVisible();
  17 |     await expect(loginButton).toBeVisible();
  18 |     await expect(loginButton).toHaveText('LOG IN');
  19 |   });
  20 | 
  21 |   test('Harus menampilkan error jika login gagal dengan kredensial salah', async ({ page }) => {
  22 |     // Mengisi data kredensial yang salah
  23 |     await page.fill('input#username', 'salah_user');
  24 |     await page.fill('input#password', 'salah_password');
  25 | 
  26 |     // Klik tombol submit login
  27 |     await page.click('button[type="submit"]');
  28 | 
  29 |     // Memastikan pesan kesalahan muncul di layar
  30 |     const errorAlert = page.locator('text=Username atau password salah.');
  31 |     await expect(errorAlert).toBeVisible();
  32 |   });
  33 | });
  34 | 
```