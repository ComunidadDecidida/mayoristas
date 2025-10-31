import "jsr:@supabase/functions-js/edge-runtime.d.ts";
import { createClient } from "npm:@supabase/supabase-js@2";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization, X-Client-Info, Apikey",
};

async function getMySQLCredentials(supabaseClient: any) {
  const credentialsKeys = ['DB_HOST', 'DB_PORT', 'DB_USER', 'DB_PASSWORD', 'DB_NAME'];
  const credentials: Record<string, string> = {};

  for (const key of credentialsKeys) {
    const { data, error } = await supabaseClient
      .from('system_config')
      .select('value')
      .eq('key', key)
      .maybeSingle();

    if (error || !data) {
      throw new Error(`Missing MySQL credential: ${key}`);
    }

    credentials[key] = typeof data.value === 'string' ? data.value : String(data.value);
  }

  return credentials;
}

async function executeQuery(credentials: Record<string, string>, query: string, params: any[] = []) {
  const connectionString = `mysql://${credentials.DB_USER}:${credentials.DB_PASSWORD}@${credentials.DB_HOST}:${credentials.DB_PORT}/${credentials.DB_NAME}`;

  const mysqlModule = await import("npm:mysql2@3.6.5/promise");

  let connection;
  try {
    connection = await mysqlModule.createConnection({
      host: credentials.DB_HOST,
      port: parseInt(credentials.DB_PORT),
      user: credentials.DB_USER,
      password: credentials.DB_PASSWORD,
      database: credentials.DB_NAME,
      ssl: {
        rejectUnauthorized: false
      }
    });

    const [rows] = await connection.execute(query, params);
    await connection.end();

    return rows;
  } catch (error) {
    if (connection) {
      await connection.end();
    }
    throw error;
  }
}

function buildSelectQuery(table: string, options: any): { query: string; params: any[] } {
  let query = `SELECT ${options.select || '*'} FROM ${table}`;
  const params: any[] = [];
  const conditions: string[] = [];

  if (options.eq) {
    Object.entries(options.eq).forEach(([key, value]) => {
      conditions.push(`${key} = ?`);
      params.push(value);
    });
  }

  if (conditions.length > 0) {
    query += ` WHERE ${conditions.join(' AND ')}`;
  }

  if (options.order) {
    const direction = options.order.ascending ? 'ASC' : 'DESC';
    query += ` ORDER BY ${options.order.column} ${direction}`;
  }

  if (options.limit) {
    query += ` LIMIT ${options.limit}`;
  }

  if (options.range) {
    const offset = options.range.from;
    const limit = options.range.to - options.range.from + 1;
    query += ` LIMIT ${limit} OFFSET ${offset}`;
  }

  return { query, params };
}

Deno.serve(async (req: Request) => {
  if (req.method === "OPTIONS") {
    return new Response(null, { status: 200, headers: corsHeaders });
  }

  try {
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    const body = await req.json();
    const { action } = body;

    const credentials = await getMySQLCredentials(supabaseClient);

    switch (action) {
      case 'ping': {
        try {
          await executeQuery(credentials, 'SELECT 1 as ping');
          return new Response(
            JSON.stringify({ success: true, message: 'Connected to MySQL' }),
            { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        } catch (error: any) {
          return new Response(
            JSON.stringify({ success: false, error: error.message }),
            { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }
      }

      case 'query': {
        const { table, options = {} } = body;

        if (!table) {
          return new Response(
            JSON.stringify({ error: 'Table name is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const { query, params } = buildSelectQuery(table, options);

        const countQuery = `SELECT COUNT(*) as total FROM ${table}`;
        const [countResult] = await executeQuery(credentials, countQuery) as any[];
        const total = countResult.total;

        const rows = await executeQuery(credentials, query, params);

        return new Response(
          JSON.stringify({
            data: rows,
            count: total,
            success: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'insert': {
        const { table, data } = body;

        if (!table || !data) {
          return new Response(
            JSON.stringify({ error: 'Table and data are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const keys = Object.keys(data);
        const values = Object.values(data);
        const placeholders = keys.map(() => '?').join(', ');

        const query = `INSERT INTO ${table} (${keys.join(', ')}) VALUES (${placeholders})`;
        const result = await executeQuery(credentials, query, values) as any;

        const selectQuery = `SELECT * FROM ${table} WHERE id = ?`;
        const [inserted] = await executeQuery(credentials, selectQuery, [result.insertId]);

        return new Response(
          JSON.stringify({
            data: inserted,
            success: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'update': {
        const { table, id, updates } = body;

        if (!table || !id || !updates) {
          return new Response(
            JSON.stringify({ error: 'Table, id and updates are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        updates.updated_at = new Date().toISOString();

        const keys = Object.keys(updates);
        const values = Object.values(updates);
        const setClause = keys.map(key => `${key} = ?`).join(', ');

        const query = `UPDATE ${table} SET ${setClause} WHERE id = ?`;
        await executeQuery(credentials, query, [...values, id]);

        const selectQuery = `SELECT * FROM ${table} WHERE id = ?`;
        const [updated] = await executeQuery(credentials, selectQuery, [id]);

        return new Response(
          JSON.stringify({
            data: updated,
            success: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'delete': {
        const { table, id } = body;

        if (!table || !id) {
          return new Response(
            JSON.stringify({ error: 'Table and id are required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const query = `DELETE FROM ${table} WHERE id = ?`;
        await executeQuery(credentials, query, [id]);

        return new Response(
          JSON.stringify({ success: true }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      case 'raw': {
        const { query, params = [] } = body;

        if (!query) {
          return new Response(
            JSON.stringify({ error: 'Query is required' }),
            { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
          );
        }

        const rows = await executeQuery(credentials, query, params);

        return new Response(
          JSON.stringify({
            data: rows,
            success: true
          }),
          { headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
      }

      default:
        return new Response(
          JSON.stringify({ error: 'Invalid action' }),
          { status: 400, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
        );
    }

  } catch (error: any) {
    console.error('Error in mysql_bd_mayorista:', error);
    return new Response(
      JSON.stringify({
        error: error.message,
        details: error.stack
      }),
      { status: 500, headers: { ...corsHeaders, 'Content-Type': 'application/json' } }
    );
  }
});
