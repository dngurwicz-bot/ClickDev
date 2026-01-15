# יצירת Super Admin חדש

## דרך 1: דרך Supabase Dashboard (מומלץ)

1. היכנס ל-[Supabase Dashboard](https://supabase.com/dashboard)
2. בחר את הפרויקט שלך
3. לך ל-**Authentication** → **Users**
4. לחץ על **Add User** → **Create new user**
5. מלא את הפרטים:
   - **Email**: `dngurwicz@gmail.com`
   - **Password**: `Spni2025!`
   - סמן **Auto Confirm User**
6. לחץ **Create User**

## דרך 2: הוספת Role דרך SQL

לאחר יצירת המשתמש דרך Dashboard, הרץ את השאילתה הבאה ב-SQL Editor:

```sql
-- הוסף Super Admin role למשתמש
INSERT INTO user_roles (user_id, organization_id, role)
SELECT id, NULL, 'super_admin'::user_role_enum
FROM auth.users
WHERE email = 'dngurwicz@gmail.com'
ON CONFLICT (user_id, organization_id) DO UPDATE SET role = 'super_admin'::user_role_enum;

-- צור profile
INSERT INTO profiles (id, email, full_name, is_super_admin)
SELECT id, email, 'Super Admin', true
FROM auth.users
WHERE email = 'dngurwicz@gmail.com'
ON CONFLICT (id) DO UPDATE SET is_super_admin = true;
```

## בדיקה

לאחר יצירת המשתמש והוספת ה-role, בדוק:

```sql
-- בדוק שהמשתמש קיים עם Super Admin role
SELECT 
  u.email,
  ur.role,
  p.is_super_admin
FROM auth.users u
LEFT JOIN user_roles ur ON ur.user_id = u.id
LEFT JOIN profiles p ON p.id = u.id
WHERE u.email = 'dngurwicz@gmail.com';
```

## התחברות

לאחר היצירה, תוכל להתחבר ב:
- **URL**: http://localhost:3000/login
- **Email**: dngurwicz@gmail.com
- **Password**: Spni2025!
