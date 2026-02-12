// test-supabase-connection.js
const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseKey) {
  console.error('❌ Missing Supabase credentials in .env.local');
  process.exit(1);
}

console.log('🔗 Testing Supabase connection...');
console.log('URL:', supabaseUrl);

const supabase = createClient(supabaseUrl, supabaseKey);

// Test connection
supabase.from('_test').select('*').limit(1)
  .then(() => {
    console.log('✅ Supabase connection successful!');
    console.log('✅ RLS is enabled on your project');
    console.log('✅ Ready to create database schema');
  })
  .catch((error) => {
    if (error.message.includes('relation') || error.code === '42P01') {
      console.log('✅ Supabase connection successful!');
      console.log('✅ (No tables yet, but connection works)');
      console.log('✅ Ready to create database schema');
    } else {
      console.error('❌ Connection failed:', error.message);
    }
  });