import { supabase } from "@/libs/supabaseClient";

export async function getUserRole(userId) {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('role')
      .eq('id', userId)
      .single();

    if (error) {
      console.error('Error fetching user role:', error);
      return 'fallback to undefined'; 
    }

    return data?.role || 'fallback to undefined';
  } catch (error) {
    console.error('Error getting user role:', error);
    return 'fallback to undefined'; 
  }
}