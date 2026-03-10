import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  try {
    // Handle CORS preflight
    if (req.method === 'OPTIONS') {
      return new Response('ok', { headers: corsHeaders })
    }

    // Only accept POST requests
    if (req.method !== 'POST') {
      throw new Error('Method not allowed')
    }

    const body = await req.json()
    const { clerk_id, username, email, avatar_url, first_name, last_name, image_url } = body

    console.log('🔄 Syncing Clerk user to Supabase:', { 
      clerk_id, 
      username, 
      email,
      first_name,
      last_name 
    })

    // Validate required fields
    if (!clerk_id) {
      throw new Error('clerk_id is required')
    }

    // Create Supabase client with service role key for admin access
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? '',
      {
        global: {
          headers: { Authorization: req.headers.get('Authorization')! },
        },
      }
    )

    // Generate username if not provided
    const generatedUsername = username || 
                              `${first_name || ''} ${last_name || ''}`.toLowerCase().trim().replace(/\s+/g, '_') ||
                              email?.split('@')[0] ||
                              `user_${clerk_id.slice(-6)}`

    // Clean username for database
    const cleanUsername = generatedUsername.replace(/[^a-zA-Z0-9_]/g, '')

    // Insert or update user using upsert
    const { data, error } = await supabaseClient
      .from('users')
      .upsert({
        clerk_id,
        username: cleanUsername,
        email: email || null,
        avatar_url: avatar_url || image_url || `https://api.dicebear.com/7.x/initials/svg?seed=${cleanUsername}`,
        is_online: false,
        last_seen: new Date().toISOString(),
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      }, {
        onConflict: 'clerk_id'
      })
      .select()
      .single()

    if (error) {
      console.error('❌ Error syncing user:', error.message)
      throw new Error(`Failed to sync user: ${error.message}`)
    }

    console.log('✅ User synced successfully to Supabase:', {
      id: data.id,
      clerk_id: data.clerk_id,
      username: data.username,
      email: data.email
    })

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User synced successfully',
        user: {
          id: data.id,
          clerk_id: data.clerk_id,
          username: data.username,
          email: data.email
        }
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 200 
      }
    )
  } catch (error) {
    console.error('❌ Edge function error:', error.message)
    console.error('Stack trace:', error.stack)
    
    return new Response(
      JSON.stringify({ 
        success: false,
        error: error.message 
      }),
      { 
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400 
      }
    )
  }
})
