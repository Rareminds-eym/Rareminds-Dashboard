import { useState, useCallback } from 'react';
import { toast } from 'sonner';
import { 
  listTables, 
  listSchemas, 
  getTableColumns, 
  getDatabaseInfo,
  getTablesFromTypes,
  type TableInfo,
  type ColumnInfo 
} from '@/lib/database-utils';

/**
 * Custom hook for database operations
 */
export const useDatabase = () => {
  const [tables, setTables] = useState<TableInfo[]>([]);
  const [schemas, setSchemas] = useState<string[]>([]);
  const [columns, setColumns] = useState<ColumnInfo[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleError = useCallback((error: any, message: string) => {
    console.error(message, error);
    setError(message);
    toast.error(message);
  }, []);

  const loadSchemas = useCallback(async () => {
    setLoading(true);
    setError(null);
    
    try {
      const schemaList = await listSchemas();
      setSchemas(schemaList);
      toast.success(`Loaded ${schemaList.length} schemas`);
      return schemaList;
    } catch (error) {
      handleError(error, 'Failed to load schemas');
      return [];
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const loadTables = useCallback(async (schema: string = 'public') => {
    setLoading(true);
    setError(null);
    
    try {
      const tableList = await listTables(schema);
      setTables(tableList);
      toast.success(`Loaded ${tableList.length} tables from schema: ${schema}`);
      return tableList;
    } catch (error) {
      handleError(error, `Failed to load tables from schema: ${schema}`);
      
      // Fallback to TypeScript types for public schema
      if (schema === 'public') {
        const typeTables = getTablesFromTypes();
        const fallbackTables = typeTables.map(name => ({
          table_name: name,
          table_schema: 'public',
          table_type: 'BASE TABLE'
        }));
        setTables(fallbackTables);
        toast.info(`Loaded ${typeTables.length} tables from TypeScript types as fallback`);
        return fallbackTables;
      }
      return [];
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const loadColumns = useCallback(async (tableName: string, schema: string = 'public') => {
    setLoading(true);
    setError(null);
    
    try {
      const columnList = await getTableColumns(tableName, schema);
      setColumns(columnList);
      toast.success(`Loaded ${columnList.length} columns for table: ${tableName}`);
      return columnList;
    } catch (error) {
      handleError(error, `Failed to load columns for table: ${tableName}`);
      return [];
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const loadDatabaseInfo = useCallback(async (schema: string = 'public') => {
    setLoading(true);
    setError(null);
    
    try {
      const info = await getDatabaseInfo(schema);
      setTables(info.tables);
      setSchemas(info.schemas);
      toast.success(`Loaded database info: ${info.tables.length} tables, ${info.schemas.length} schemas`);
      return info;
    } catch (error) {
      handleError(error, 'Failed to load database information');
      
      // Fallback to TypeScript types
      const typeTables = getTablesFromTypes();
      const fallbackTables = typeTables.map(name => ({
        table_name: name,
        table_schema: 'public',
        table_type: 'BASE TABLE'
      }));
      
      const fallbackInfo = {
        tables: fallbackTables,
        schemas: ['public'],
        currentSchema: schema,
        tablesFromTypes: typeTables
      };
      
      setTables(fallbackTables);
      setSchemas(['public']);
      toast.info(`Loaded ${typeTables.length} tables from TypeScript types as fallback`);
      return fallbackInfo;
    } finally {
      setLoading(false);
    }
  }, [handleError]);

  const getTypeTables = useCallback(() => {
    const typeTables = getTablesFromTypes();
    toast.info(`Found ${typeTables.length} tables in TypeScript types`);
    return typeTables;
  }, []);

  const clearError = useCallback(() => {
    setError(null);
  }, []);

  const reset = useCallback(() => {
    setTables([]);
    setSchemas([]);
    setColumns([]);
    setError(null);
  }, []);

  return {
    // State
    tables,
    schemas,
    columns,
    loading,
    error,
    
    // Actions
    loadSchemas,
    loadTables,
    loadColumns,
    loadDatabaseInfo,
    getTypeTables,
    clearError,
    reset,
    
    // Computed
    hasData: tables.length > 0 || schemas.length > 0,
    tableCount: tables.length,
    schemaCount: schemas.length,
    columnCount: columns.length
  };
};