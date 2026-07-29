# Inner Circle Savings Platform

## Publish to GitHub

Upload these files and folders to your GitHub repository:

- `index.html`, `register.html`, `login.html`, `dashboard.html`, `admin.html`
- `style.css`, `auth.js`, `supabase-config.js`
- `assets/`
- `supabase/`

Do not upload `work/`. It contains local preview and conversion files only.

## Connect Supabase

1. In Supabase, create a project.
2. Go to **SQL Editor**, create a new query, paste in `supabase/schema.sql`, and run it.
3. Go to **Project Settings > API** and copy the Project URL and publishable key.
4. Put those values into `supabase-config.js`. Never use a secret key in that file.
5. In **Authentication > URL Configuration**, add the live website address as the Site URL and an allowed Redirect URL.
6. Deploy `supabase/functions/delete-member/index.ts` as the `delete-member` Edge Function. It uses the secure server-side secret supplied by Supabase, not a key stored in your website.

## Assign an administrator

First register and confirm the administrator's account. In Supabase **SQL Editor**, run the following query, replacing the email address:

```sql
update public.profiles
set role = 'admin'
where id = (
  select id from auth.users where email = 'admin@example.com'
);
```

The administrator can then sign in and use `admin.html` to edit member details, change membership status, record contributions, and remove member accounts.

To make an administrator a normal member again, change `'admin'` to `'member'` in that query. The website does not offer role changes in the administrator panel, intentionally: only a Supabase project owner should be able to grant administrator rights.

## Rights

| User type | Allowed actions |
| --- | --- |
| Member | View only their own profile and contributions. |
| Administrator | View and edit all profiles, record and verify contributions, and delete member accounts. |

The database rules in `supabase/schema.sql` enforce these rights, not merely the website interface.
