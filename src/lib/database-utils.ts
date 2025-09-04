import { supabase } from '@/integrations/supabase/client';
import type { Database } from '@/integrations/supabase/types';

/**
 * Interface for table information
 */
export interface TableInfo {
  table_name: string;
  table_schema: string;
  table_type: string;
  table_comment?: string;
}

/**
 * Interface for column information
 */
export interface ColumnInfo {
  column_name: string;
  data_type: string;
  is_nullable: string;
  column_default: string | null;
  table_name: string;
}

/**
 * Lists all tables within the specified schema
 * @param schema - The schema name (default: 'public')
 * @returns Promise<TableInfo[]> - Array of table information
 */
export async function listTables(schema: string = 'public'): Promise<TableInfo[]> {
  try {
    const { data, error } = await supabase
      .from('information_schema.tables')
      .select('table_name, table_schema, table_type')
      .eq('table_schema', schema)
      .order('table_name');

    if (error) {
      console.error('Error fetching tables:', error);
      throw new Error(`Failed to fetch tables: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error in listTables:', error);
    throw error;
  }
}

/**
 * Alternative method using raw SQL query to list tables
 * @param schema - The schema name (default: 'public')
 * @returns Promise<TableInfo[]> - Array of table information
 */
export async function listTablesWithSQL(schema: string = 'public'): Promise<TableInfo[]> {
  try {
    const { data, error } = await supabase.rpc('exec_sql', {
      sql: `
        SELECT 
          table_name,
          table_schema,
          table_type,
          obj_description(c.oid) as table_comment
        FROM information_schema.tables t
        LEFT JOIN pg_class c ON c.relname = t.table_name
        LEFT JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE t.table_schema = $1
        ORDER BY t.table_name;
      `,
      params: [schema]
    });

    if (error) {
      console.error('Error executing SQL:', error);
      throw new Error(`Failed to execute SQL: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error in listTablesWithSQL:', error);
    // Fallback to the first method if SQL execution fails
    return listTables(schema);
  }
}

/**
 * Get detailed information about table columns
 * @param tableName - The table name
 * @param schema - The schema name (default: 'public')
 * @returns Promise<ColumnInfo[]> - Array of column information
 */
export async function getTableColumns(tableName: string, schema: string = 'public'): Promise<ColumnInfo[]> {
  try {
    const { data, error } = await supabase
      .from('information_schema.columns')
      .select('column_name, data_type, is_nullable, column_default, table_name')
      .eq('table_schema', schema)
      .eq('table_name', tableName)
      .order('ordinal_position');

    if (error) {
      console.error('Error fetching columns:', error);
      throw new Error(`Failed to fetch columns: ${error.message}`);
    }

    return data || [];
  } catch (error) {
    console.error('Error in getTableColumns:', error);
    throw error;
  }
}

/**
 * Get tables from TypeScript types (offline method)
 * This extracts table names from the Database type definition
 * @returns string[] - Array of table names from types
 */
export function getTablesFromTypes(): string[] {
  // Extract table names from the Database type
  const tableNames: (keyof Database['public']['Tables'])[] = [
    'blog_posts',
    'blogs_draft', 
    'project_posts',
    'user_roles'
  ];
  
  return tableNames as string[];
}

/**
 * Get all available schemas
 * @returns Promise<string[]> - Array of schema names
 */
export async function listSchemas(): Promise<string[]> {
  try {
    const { data, error } = await supabase
      .from('information_schema.schemata')
      .select('schema_name')
      .not('schema_name', 'like', 'pg_%')
      .not('schema_name', 'eq', 'information_schema')
      .order('schema_name');

    if (error) {
      console.error('Error fetching schemas:', error);
      throw new Error(`Failed to fetch schemas: ${error.message}`);
    }

    return data?.map(row => row.schema_name) || [];
  } catch (error) {
    console.error('Error in listSchemas:', error);
    throw error;
  }
}

/**
 * Comprehensive database structure information
 * @param schema - The schema name (default: 'public')
 * @returns Promise<{tables: TableInfo[], schemas: string[]}> - Complete database info
 */
export async function getDatabaseInfo(schema: string = 'public') {
  try {
    const [tables, schemas] = await Promise.all([
      listTables(schema),
      listSchemas()
    ]);

    return {
      tables,
      schemas,
      currentSchema: schema,
      tablesFromTypes: getTablesFromTypes()
    };
  } catch (error) {
    console.error('Error getting database info:', error);
    throw error;
  }
}