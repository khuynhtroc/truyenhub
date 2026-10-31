import { createAdminSupabaseClient } from '@/lib/supabase/admin';

export const db = {
  async getSetting<T = any>(key: string): Promise<T | null> {
    try {
      const supabase = createAdminSupabaseClient();
      const { data, error } = await supabase
        .from('settings')
        .select('value')
        .eq('key', key)
        .single();

      if (!error && data?.value) {
        return data.value as T;
      }

      // Check if it's stored in site_config
      const { data: configData } = await supabase
        .from('settings')
        .select('value')
        .eq('key', 'site_config')
        .single();

      if (configData?.value?.[key]) {
        return configData.value[key] as T;
      }
    } catch (err) {
      console.warn(`[db] getSetting error for key ${key}:`, err);
    }
    return null;
  },

  async setSetting(key: string, value: any): Promise<void> {
    try {
      const supabase = createAdminSupabaseClient();
      await supabase.from('settings').upsert({
        key,
        value,
        updated_at: new Date().toISOString(),
      });
    } catch (err) {
      console.warn(`[db] setSetting error for key ${key}:`, err);
    }
  },

  async findOne(table: string, query?: Record<string, any>) {
    try {
      if (table === 'settings' || table === 'social_settings') {
        const key = query?.key || 'social_settings';
        return await this.getSetting(key);
      }
      const supabase = createAdminSupabaseClient();
      const targetTable = table;
      let q = supabase.from(targetTable).select('*');
      if (query) {
        Object.entries(query).forEach(([k, v]) => {
          q = q.eq(k, v);
        });
      }
      const { data, error } = await q.limit(1).single();
      if (!error) return data;
    } catch (err) {
      console.warn(`[db] findOne error in table ${table}:`, err);
    }
    return null;
  },

  async find(table: string, query?: any) {
    try {
      const supabase = createAdminSupabaseClient();
      const targetTable = table;
      let q = supabase.from(targetTable).select(query?.select || '*', { count: 'exact' });
      if (query?.eq) {
        Object.entries(query.eq).forEach(([k, v]) => {
          q = q.eq(k, v);
        });
      }
      if (query?.neq) {
        Object.entries(query.neq).forEach(([k, v]) => {
          q = q.neq(k, v);
        });
      }
      if (query?.order && Array.isArray(query.order)) {
        for (const ord of query.order) {
          q = q.order(ord.field, { ascending: ord.asc ?? true });
        }
      } else {
        q = q.order('created_at', { ascending: false });
      }
      if (query?.limit) {
        q = q.limit(query.limit);
      }
      const { data, error, count } = await q;

      if (!error && data) {
        return { rows: data, total: count || data.length };
      }
    } catch (err) {
      console.warn(`[db] find error in table ${table}:`, err);
    }
    return { rows: [], total: 0 };
  },

  async insert(table: string, data: any) {
    try {
      const supabase = createAdminSupabaseClient();
      const targetTable = table;
      const { data: res, error } = await supabase.from(targetTable).insert(data).select().single();
      return { success: !error, data: res };
    } catch (err) {
      console.warn(`[db] insert error in ${table}:`, err);
      return { success: false };
    }
  },

  async update(table: string, idOrQuery: any, data: any) {
    try {
      if (table === 'settings' || table === 'social_settings') {
        const key = typeof idOrQuery === 'string' ? idOrQuery : idOrQuery?.key || 'social_settings';
        await this.setSetting(key, data);
        return { success: true };
      }
      const supabase = createAdminSupabaseClient();
      const targetTable = table;
      const id = typeof idOrQuery === 'string' ? idOrQuery : idOrQuery?.id;
      const { error } = await supabase.from(targetTable).update(data).eq('id', id);
      return { success: !error };
    } catch (err) {
      console.warn(`[db] update error in table ${table}:`, err);
      return { success: false };
    }
  },
};
