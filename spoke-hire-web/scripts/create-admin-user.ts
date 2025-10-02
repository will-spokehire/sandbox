/**
 * Create Admin User Script
 * 
 * Creates an admin user in both Supabase Auth and your Prisma database.
 * 
 * Usage:
 * ```bash
 * npm run create-admin-user
 * ```
 * 
 * You'll be prompted to enter:
 * - Email address
 * - First name
 * - Last name
 */

import { createClient } from '@supabase/supabase-js';
import { PrismaClient } from '@prisma/client';
import * as readline from 'readline';

const prisma = new PrismaClient();

interface AdminUserInput {
  email: string;
  firstName: string;
  lastName: string;
}

function createReadline() {
  return readline.createInterface({
    input: process.stdin,
    output: process.stdout,
  });
}

function question(rl: readline.Interface, prompt: string): Promise<string> {
  return new Promise((resolve) => {
    rl.question(prompt, (answer) => {
      resolve(answer);
    });
  });
}

async function promptUserDetails(): Promise<AdminUserInput> {
  const rl = createReadline();

  console.log('\n🔐 Create Admin User\n');
  console.log('This will create a new admin user in both Supabase Auth and your database.\n');

  const email = await question(rl, 'Email address: ');
  const firstName = await question(rl, 'First name: ');
  const lastName = await question(rl, 'Last name: ');

  rl.close();

  return { email, firstName, lastName };
}

async function createAdminUser(input: AdminUserInput) {
  const { email, firstName, lastName } = input;

  // Validate environment variables
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      'Missing required environment variables:\n' +
      '- NEXT_PUBLIC_SUPABASE_URL\n' +
      '- SUPABASE_SERVICE_ROLE_KEY\n' +
      'Please check your .env.local file.'
    );
  }

  console.log('\n📝 Creating admin user...\n');

  // Create Supabase admin client
  const supabase = createClient(supabaseUrl, serviceRoleKey, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });

  // Check if user already exists in database
  const existingUser = await prisma.user.findUnique({
    where: { email },
  });

  if (existingUser) {
    console.log('⚠️  User already exists in database');
    console.log('   Email:', existingUser.email);
    console.log('   User Type:', existingUser.userType);
    console.log('   Status:', existingUser.status);

    if (existingUser.userType === 'ADMIN') {
      console.log('\n✅ User is already an admin!');
      
      // Check if they have a supabaseId
      if (!existingUser.supabaseId) {
        console.log('\n⚠️  User does not have a Supabase account yet.');
        console.log('   They can sign in at /auth/login to link their account.');
      }
      
      return;
    } else {
      console.log('\n❌ User exists but is not an admin.');
      console.log('   Current user type:', existingUser.userType);
      console.log('\n   Would you like to promote this user to admin? (This will be implemented in a separate script)');
      return;
    }
  }

  // Create user in Supabase Auth
  console.log('1️⃣  Creating user in Supabase Auth...');
  const { data: authData, error: authError } = await supabase.auth.admin.createUser({
    email,
    email_confirm: true, // Skip email confirmation for admin users
  });

  if (authError) {
    console.error('\n❌ Failed to create user in Supabase Auth');
    console.error('   Error:', authError.message);
    throw authError;
  }

  if (!authData.user) {
    throw new Error('Failed to create user in Supabase Auth - no user returned');
  }

  console.log('   ✅ Supabase user created');
  console.log('   User ID:', authData.user.id);

  // Create user in database
  console.log('\n2️⃣  Creating user in database...');
  const dbUser = await prisma.user.create({
    data: {
      email,
      firstName,
      lastName,
      supabaseId: authData.user.id,
      userType: 'ADMIN',
      status: 'ACTIVE',
      profileCompleted: true,
    },
  });

  console.log('   ✅ Database user created');
  console.log('   User ID:', dbUser.id);

  console.log('\n✅ Admin user created successfully!\n');
  console.log('📧 Email:', email);
  console.log('👤 Name:', `${firstName} ${lastName}`);
  console.log('🔑 User Type: ADMIN');
  console.log('📊 Status: ACTIVE');
  console.log('\n🎉 The user can now sign in at /auth/login');
  console.log('   They will receive an OTP code via email.');
}

async function main() {
  try {
    const input = await promptUserDetails();

    // Validate email
    if (!input.email || !input.email.includes('@')) {
      throw new Error('Invalid email address');
    }

    // Validate names
    if (!input.firstName || !input.lastName) {
      throw new Error('First name and last name are required');
    }

    await createAdminUser(input);
  } catch (error) {
    console.error('\n❌ Error creating admin user:');
    console.error(error);
    process.exit(1);
  } finally {
    await prisma.$disconnect();
  }
}

main();

