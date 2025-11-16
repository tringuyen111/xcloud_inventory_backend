// supabase/functions/create-auth-user/index.ts

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// FIX: Add Deno declaration to fix "Cannot find name 'Deno'" errors for type checkers in non-Deno environments.
declare var Deno: any;

// Function to check if the calling user is an admin
async function isAdmin(userSupabaseClient: SupabaseClient): Promise<boolean> {
    const { data: { user }, error: userError } = await userSupabaseClient.auth.getUser();
    if (userError || !user) {
        console.error("Auth error:", userError?.message);
        return false;
    }

    const { data: roleData, error: roleError } = await userSupabaseClient
      .from('user_roles')
      .select('roles(code)')
      .eq('user_id', user.id)
      .single();
      
    if (roleError) {
        console.error("Role check error:", roleError.message);
        return false;
    }
    
    // The type assertion is safe here because we've checked for errors.
    const userRole = (roleData as any)?.roles?.code;
    return userRole === 'ADMIN';
}


Deno.serve(async (req) => {
  // This is critical for handling CORS preflight requests.
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  try {
    // 1. Create a Supabase client with the user's JWT to verify permissions
    const authHeader = req.headers.get('Authorization')!;
    const userSupabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      { global: { headers: { Authorization: authHeader } } }
    );

    // 2. Check if the user is an admin
    if (!await isAdmin(userSupabaseClient)) {
        return new Response(JSON.stringify({ error: 'Forbidden: You do not have permission to perform this action.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 403,
        });
    }

    // 3. User is an admin, proceed to create the new user
    const { email, password } = await req.json();
    if (!email || !password) {
        throw new Error('Email and password are required.');
    }

    // 4. Create a Supabase client with the SERVICE_ROLE_KEY for admin actions
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );
    
    // 5. Create the new auth user
    const { data: { user: newUserData }, error: createError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true, // Auto-confirm email for simplicity
    });

    if (createError) throw createError;
    if (!newUserData) throw new Error('User creation returned no data.');

    // 6. Return the new user's ID
    return new Response(JSON.stringify({ user_id: newUserData.id }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    });
  }
});