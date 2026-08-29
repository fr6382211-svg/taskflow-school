import { createClient } from '@supabase/supabase-js';

const url = process.env.SUPABASE_URL;
const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
const email = process.env.ADMIN_EMAIL || process.argv[2];
const password = process.env.ADMIN_PASSWORD || process.argv[3];

if (!url || !key || !email || !password) {
  console.error('Set SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, ADMIN_EMAIL, ADMIN_PASSWORD.');
  process.exit(1);
}

if (password.length < 8) {
  console.error('ADMIN_PASSWORD harus minimal 8 karakter.');
  process.exit(1);
}

const db = createClient(url, key, { auth: { persistSession: false } });

async function main() {
  const { data: existing, error: listError } = await db.auth.admin.listUsers({ page: 1, perPage: 1000 });
  if (listError) throw listError;
  const found = existing.users.find((u) => u.email?.toLowerCase() === email.toLowerCase());
  let userId = found?.id;

  if (!found) {
    const { data, error } = await db.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name: 'Administrator' },
    });
    if (error) throw error;
    userId = data.user?.id;
  } else {
    const { error } = await db.auth.admin.updateUserById(found.id, { password, email_confirm: true });
    if (error) throw error;
  }

  if (!userId) throw new Error('User ID tidak tersedia.');

  const { error: profileError } = await db.from('users').upsert({
    id: userId,
    name: 'Administrator',
    email: email.toLowerCase(),
    role: 'admin',
    status: 'active',
  }, { onConflict: 'id' });
  if (profileError) throw profileError;

  console.log(`Admin siap: ${email}`);
}

void main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});
