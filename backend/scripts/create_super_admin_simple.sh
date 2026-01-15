#!/bin/bash
# Simple script to create super admin via Supabase Admin API

EMAIL="dngurwicz@gmail.com"
PASSWORD="Spni2025!"
FULL_NAME="Super Admin"

SUPABASE_URL=$(grep NEXT_PUBLIC_SUPABASE_URL .env.local | cut -d '=' -f2)
SERVICE_KEY=$(grep SUPABASE_SERVICE_ROLE_KEY .env.local | cut -d '=' -f2)

echo "🚀 Creating Super Admin User..."
echo "Email: $EMAIL"

# Create user
RESPONSE=$(curl -s -X POST "${SUPABASE_URL}/auth/v1/admin/users" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -d "{
    \"email\": \"${EMAIL}\",
    \"password\": \"${PASSWORD}\",
    \"email_confirm\": true,
    \"user_metadata\": {
      \"full_name\": \"${FULL_NAME}\"
    }
  }")

echo "Response: $RESPONSE"

USER_ID=$(echo $RESPONSE | grep -o '"id":"[^"]*' | cut -d'"' -f4)

if [ -z "$USER_ID" ]; then
  echo "❌ Failed to create user"
  exit 1
fi

echo "✅ User created with ID: $USER_ID"

# Create profile
curl -s -X POST "${SUPABASE_URL}/rest/v1/profiles" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{
    \"id\": \"${USER_ID}\",
    \"email\": \"${EMAIL}\",
    \"full_name\": \"${FULL_NAME}\",
    \"is_super_admin\": true
  }" > /dev/null

# Create user_role
curl -s -X POST "${SUPABASE_URL}/rest/v1/user_roles" \
  -H "apikey: ${SERVICE_KEY}" \
  -H "Authorization: Bearer ${SERVICE_KEY}" \
  -H "Content-Type: application/json" \
  -H "Prefer: return=representation" \
  -d "{
    \"user_id\": \"${USER_ID}\",
    \"organization_id\": null,
    \"role\": \"super_admin\"
  }" > /dev/null

echo "✅ Super Admin created successfully!"
echo "📧 Email: $EMAIL"
echo "🔑 Password: $PASSWORD"
echo "🆔 User ID: $USER_ID"
echo ""
echo "✨ You can now login at: http://localhost:3000/login"
