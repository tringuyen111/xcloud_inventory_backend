// supabase/functions/create-auth-user/index.ts

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Add Deno declaration to fix "Cannot find name 'Deno'" errors for type checkers in non-Deno environments.
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
    const { data: { user: callingUser } } = await userSupabaseClient.auth.getUser();

    // 2. Check if the user is an admin
    if (!await isAdmin(userSupabaseClient)) {
        return new Response(JSON.stringify({ error: 'Forbidden: You do not have permission to perform this action.' }), {
            headers: { ...corsHeaders, 'Content-Type': 'application/json' },
            status: 403,
        });
    }

    // 3. User is an admin, get all user data from request
    const { email, password, full_name, phone, role_id, organization_id, warehouse_id } = await req.json();
    if (!email || !password || !full_name || !role_id) {
        throw new Error('Email, password, full name, and role are required.');
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
      email_confirm: true,
    });

    if (createError) throw createError;
    if (!newUserData) throw new Error('User creation returned no data.');

    // --- Start Transactional Inserts ---
    try {
        // 6. Insert into public.users table
        const { error: profileError } = await supabaseAdmin.from('users').insert({
            id: newUserData.id,
            email: email,
            full_name: full_name,
            phone: phone,
            created_by: callingUser?.id,
        });
        if (profileError) throw new Error(`Failed to create public user profile: ${profileError.message}`);

        // 7. Insert into public.user_roles
        const { error: roleError } = await supabaseAdmin.from('user_roles').insert({
            user_id: newUserData.id,
            role_id: role_id,
            assigned_by: callingUser?.id,
        });
        if (roleError) throw new Error(`Failed to assign role: ${roleError.message}`);

        // 8. Insert into public.user_organizations (if provided)
        if (organization_id) {
            const { error: orgError } = await supabaseAdmin.from('user_organizations').insert({
                user_id: newUserData.id,
                organization_id: organization_id,
                granted_by: callingUser?.id,
            });
            if (orgError) throw new Error(`Failed to assign organization: ${orgError.message}`);
        }

        // 9. Insert into public.user_warehouses (if provided)
        if (warehouse_id) {
            const { error: whError } = await supabaseAdmin.from('user_warehouses').insert({
                user_id: newUserData.id,
                warehouse_id: warehouse_id,
                granted_by: callingUser?.id,
            });
            if (whError) throw new Error(`Failed to assign warehouse: ${whError.message}`);
        }
    } catch (syncError) {
        // If any of the profile/permission inserts fail, delete the auth user to roll back
        await supabaseAdmin.auth.admin.deleteUser(newUserData.id);
        throw syncError; // Re-throw the error to be caught by the outer catch block
    }
    // --- End Transactional Inserts ---

    // 10. Return success
    return new Response(JSON.stringify({ user_id: newUserData.id, message: 'User created and configured successfully.' }), {
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
