const { createClient } = require('@supabase/supabase-js');
const fs = require('fs');
const path = require('path');

// Manually parse .env.local if present
try {
  const envContent = fs.readFileSync(path.join(__dirname, '..', '.env.local'), 'utf8');
  envContent.split('\n').forEach(line => {
    const match = line.match(/^\s*([\w.-]+)\s*=\s*(.*)?\s*$/);
    if (match) {
      let val = (match[2] || '').trim();
      if (val.startsWith('"') && val.endsWith('"')) val = val.slice(1, -1);
      process.env[match[1]] = val;
    }
  });
} catch (_) {}

const SUPABASE_URL = process.env.NEXT_PUBLIC_SUPABASE_URL || 'https://bqvffeqjgjtzprouwshd.supabase.co';
const SERVICE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY || 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6ImJxdmZmZXFqZ2p0enByb3V3c2hkIiwicm9sZSI6InNlcnZpY2Vfcm9sZSIsImlhdCI6MTc5MTkwNTQxNywiZXhwIjoyMTA3NDgxNDE3fQ.JOX4r3s7OSsqImlnjRMHD4m4giOAYxN97yZq8a94Q1A';

const supabase = createClient(SUPABASE_URL, SERVICE_KEY);

async function run() {
  const { count: lockedCount, error: countErr } = await supabase
    .from('chapters')
    .select('id', { count: 'exact', head: true })
    .eq('is_locked', true);
    
  console.log('Current locked chapters count:', lockedCount, countErr || '');

  if (lockedCount && lockedCount > 0) {
    console.log(`Unlocking ${lockedCount} chapters...`);
    const { error: updateErr } = await supabase
      .from('chapters')
      .update({ is_locked: false, price_coins: 0 })
      .eq('is_locked', true);
      
    if (updateErr) {
      console.error('Error unlocking chapters:', updateErr);
    } else {
      console.log('Successfully unlocked all chapters in DB!');
    }
  } else {
    console.log('No locked chapters found.');
  }
}

run();
