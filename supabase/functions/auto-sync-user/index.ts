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

    console.log('🔄 Auto-syncing Clerk user to Supabase:', { 
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

    // Check if user already exists
    const { data: existingUser, error: checkError } = await supabaseClient
      .from('users')
      .select('id')
      .eq('clerk_id', clerk_id)
      .maybeSingle()

    if (checkError) {
      console.error('Error checking existing user:', checkError)
      throw checkError
    }

    let result
    if (existingUser) {
      // User exists - UPDATE
      console.log('✏️ Updating existing user:', clerk_id)
      const { data, error } = await supabaseClient
        .from('users')
        .update({
          username: cleanUsername,
          email: email || null,
          avatar_url: avatar_url || image_url || `https://api.dicebear.com/7.x/initials/svg?seed=${cleanUsername}`,
          is_online: false,
          last_seen: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .eq('clerk_id', clerk_id)
        .select()
        .single()

      if (error) {
        console.error('Error updating user:', error)
        throw error
      }

      result = data
      console.log('✅ User updated successfully:', result.id)
    } else {
      // User doesn't exist - INSERT (let Supabase generate UUID)
      console.log('➕ Creating new user:', clerk_id)
      const { data, error } = await supabaseClient
        .from('users')
        .insert({
          clerk_id,
          username: cleanUsername,
          email: email || null,
          avatar_url: avatar_url || image_url || `https://api.dicebear.com/7.x/initials/svg?seed=${cleanUsername}`,
          is_online: false,
          last_seen: new Date().toISOString(),
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        })
        .select()
        .single()

      if (error) {
        console.error('Error creating user:', error)
        throw error
      }

      result = data
      console.log('✅ User created successfully:', result.id)
    }

    return new Response(
      JSON.stringify({ 
        success: true, 
        message: 'User synced successfully',
        user: {
          id: result.id,
          clerk_id: result.clerk_id,
          username: result.username,
          email: result.email
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
