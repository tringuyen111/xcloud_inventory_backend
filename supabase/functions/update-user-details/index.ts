// supabase/functions/update-user-details/index.ts

import { createClient, SupabaseClient } from 'https://esm.sh/@supabase/supabase-js@2'
import { corsHeaders } from '../_shared/cors.ts'

// Add Deno declaration to fix "Cannot find name 'Deno'" errors
declare var Deno: any;

// Function to check if the calling user is an admin
async function isAdmin(userSupabaseClient: SupabaseClient): Promise<boolean> {
    const { data: { user } } = await userSupabaseClient.auth.getUser();
    if (!user) return false;

    const { data: roleData, error } = await userSupabaseClient
      .from('user_roles')
      .select('roles(code)')
      .eq('user_id', user.id)
      .single();
      
    if (error) return false;
    return (roleData as any)?.roles?.code === 'ADMIN';
}

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders, status: 200 });
  }

  try {
    // 1. Create a client with the user's JWT to verify permissions
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

    // 3. Get user details from request body
    const { user_id, full_name, phone, role_id, organization_id, warehouse_id } = await req.json();
    if (!user_id) throw new Error('User ID is required.');

    // 4. Create an admin client to perform updates
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // 5. Update public.users table
    const { error: profileError } = await supabaseAdmin
        .from('users')
        .update({ 
            full_name, 
            phone,
            updated_by: callingUser?.id,
            updated_at: new Date().toISOString(),
        })
        .eq('id', user_id);
    if (profileError) throw new Error(`Failed to update user profile: ${profileError.message}`);

    // 6. Update user_roles (upsert)
    if (role_id) {
        const { error: roleError } = await supabaseAdmin.from('user_roles').upsert(
            { user_id: user_id, role_id: role_id, assigned_by: callingUser?.id },
            { onConflict: 'user_id' }
        );
        if (roleError) throw new Error(`Failed to update role: ${roleError.message}`);
    }
    
    // 7. Update user_organizations (upsert)
    if (organization_id) {
         const { error: orgError } = await supabaseAdmin.from('user_organizations').upsert(
            { user_id: user_id, organization_id: organization_id, granted_by: callingUser?.id },
            { onConflict: 'user_id' }
        );
        if (orgError) throw new Error(`Failed to update organization: ${orgError.message}`);
    } else {
        // If org is null/undefined, remove existing assignment
        await supabaseAdmin.from('user_organizations').delete().eq('user_id', user_id);
    }
    
    // 8. Update user_warehouses (upsert)
    if (warehouse_id) {
         const { error: whError } = await supabaseAdmin.from('user_warehouses').upsert(
            { user_id: user_id, warehouse_id: warehouse_id, granted_by: callingUser?.id },
            { onConflict: 'user_id' }
        );
        if (whError) throw new Error(`Failed to update warehouse: ${whError.message}`);
    } else {
         await supabaseAdmin.from('user_warehouses').delete().eq('user_id', user_id);
    }


    return new Response(JSON.stringify({ message: 'User updated successfully.' }), {
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
