# Manual Supabase setup for the new login flow

The refactored `LoginScreen` uses real Supabase Auth
(`supabase.auth.signInWithPassword`) instead of comparing a password
to an environment variable in the browser. None of this code change
works until you do the following **once**, in the Supabase dashboard.

## 1. Enable the Email provider
Supabase Dashboard → **Authentication → Providers → Email** → make
sure it's enabled. This is usually on by default.

## 2. Turn off public sign-ups
Supabase Dashboard → **Authentication → Settings** → disable
**"Allow new users to sign up"** (or equivalent, wording varies by
Supabase version). This is a physician-only portal — nobody should be
able to create their own account from the login screen. Doctor
accounts should only be created manually by you (next step).

## 3. Create the doctor account(s)
Supabase Dashboard → **Authentication → Users → Add user** → create
one user per doctor with their real email and a strong password.
This replaces the old shared `VITE_DOCTOR_ID` / `VITE_DOCTOR_PASSWORD`
— each doctor now has their own real login instead of one shared
password baked into the app.

## 4. Lock down the `patients` table with Row Level Security
If RLS isn't already enabled and enforced on the `patients` table,
turn it on and add a policy that only allows access to signed-in
users, for example:

```sql
alter table patients enable row level security;

create policy "Authenticated staff can read patients"
on patients for select
to authenticated
using (true);

create policy "Authenticated staff can update patients"
on patients for update
to authenticated
using (true);
```

Without this, even after the login screen is fixed, the Supabase
anon key still has whatever access your current table policies grant
it — auth on the login screen doesn't help if the database itself
still hands out patient data to anyone with the public anon key.

## 5. Remove the old credentials
- Delete `VITE_DOCTOR_ID` and `VITE_DOCTOR_PASSWORD` from your `.env`
  file and from your hosting provider's environment variables (e.g.
  Vercel project settings). They're no longer read anywhere in the
  code, and leaving them in your deployment config just leaves the
  old password sitting around.
- Your existing `VITE_SUPABASE_URL` and `VITE_SUPABASE_ANON_KEY`
  stay exactly as they are — those are meant to be public-facing and
  aren't the problem.

## 6. Give your demo judges the real login
Since there's no more shared demo password printed on the login
screen, communicate the doctor email/password you created in step 3
to whoever needs to log in during your SIH presentation, separately
from the app itself (not in the UI).
