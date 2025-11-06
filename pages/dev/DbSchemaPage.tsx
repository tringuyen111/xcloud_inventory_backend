import React, { useState, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import {
  Button, Box, Typography, CircularProgress, Alert, Paper,
  Table, TableBody, TableCell, TableContainer, TableHead, TableRow,
  Tabs, Tab, Chip, Stack,
} from '@mui/material';
import FileDownloadIcon from '@mui/icons-material/FileDownload';

// --- Type Definitions for Schema Details ---

interface ColumnDetail {
  name: string;
  type: string;
  is_nullable: boolean;
  default: string | null;
}

interface TableDetail {
  schema: string;
  name: string;
  columns: ColumnDetail[];
}

interface FunctionDetail {
    schema: string;
    name: string;
    return_type: string;
    definition: string;
}

interface TriggerDetail {
    name: string;
    table: string;
    event: string;
    timing: string;
    orientation: string;
    statement: string;
}

interface PolicyDetail {
    schema: string;
    table: string;
    name: string;
    command: string;
    roles: string[];
    qualifier: string;
    with_check: string;
}

interface SchemaDetails {
  tables: TableDetail[];
  functions: FunctionDetail[];
  triggers: TriggerDetail[];
  policies: PolicyDetail[];
}

// --- Main Component ---

const DbSchemaPage: React.FC = () => {
  const [schema, setSchema] = useState<SchemaDetails | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [mainTab, setMainTab] = useState(0);
  const [selectedTable, setSelectedTable] = useState(0);

  const fetchSchema = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSchema(null);

    const { data, error: rpcError } = await supabase.rpc('get_schema_details');

    if (rpcError) {
      console.error('Error fetching schema:', rpcError);
      setError(`Failed to fetch schema. Make sure you have created/updated the 'get_schema_details' function in your Supabase SQL Editor. Error: ${rpcError.message}`);
      setLoading(false);
      return;
    }

    if (data) {
      setSchema(data);
    }
    
    setLoading(false);
  }, []);

  const handleExport = () => {
    if (!schema) return;

    const jsonString = JSON.stringify(schema, null, 2);
    const blob = new Blob([jsonString], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    
    const a = document.createElement('a');
    a.href = url;
    a.download = `db_schema_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    
    URL.revokeObjectURL(url);
  };

  const handleMainTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setMainTab(newValue);
  };
  
  const handleTableTabChange = (event: React.SyntheticEvent, newValue: number) => {
    setSelectedTable(newValue);
  };

  const renderContent = () => {
    if (!schema) return null;

    // Tables Panel
    if (mainTab === 0 && schema.tables) {
      const currentTable = schema.tables[selectedTable];
      return (
        <>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs 
              value={selectedTable} 
              onChange={handleTableTabChange} 
              variant="scrollable"
              scrollButtons="auto"
            >
              {schema.tables.map((table) => (
                <Tab label={table.name} key={table.name} />
              ))}
            </Tabs>
          </Box>
          {currentTable && (
            <Box p={2}>
                <Typography variant="h6" gutterBottom>Table: {currentTable.schema}.{currentTable.name}</Typography>
                <TableContainer>
                    <Table>
                        <TableHead>
                            <TableRow sx={{ '& th': { fontWeight: 'bold' } }}>
                                <TableCell>Column Name</TableCell>
                                <TableCell>Data Type</TableCell>
                                <TableCell>Nullable</TableCell>
                                <TableCell>Default Value</TableCell>
                            </TableRow>
                        </TableHead>
                        <TableBody>
                        {currentTable.columns.map((col) => (
                            <TableRow key={col.name} hover>
                                <TableCell><strong>{col.name}</strong></TableCell>
                                <TableCell>{col.type}</TableCell>
                                <TableCell>{col.is_nullable ? 'Yes' : 'No'}</TableCell>
                                <TableCell><code>{col.default || 'NULL'}</code></TableCell>
                            </TableRow>
                        ))}
                        </TableBody>
                    </Table>
                </TableContainer>
            </Box>
          )}
        </>
      )
    }

    // Functions Panel
    if (mainTab === 1 && schema.functions) {
        return (
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ '& th': { fontWeight: 'bold' } }}>
                            <TableCell>Function Name</TableCell>
                            <TableCell>Return Type</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {schema.functions.map(func => (
                            <TableRow key={func.name} hover>
                                <TableCell><strong>{func.name}</strong></TableCell>
                                <TableCell><code>{func.return_type}</code></TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        )
    }

    // Triggers Panel
    if (mainTab === 2 && schema.triggers) {
        return (
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ '& th': { fontWeight: 'bold' } }}>
                            <TableCell>Trigger Name</TableCell>
                            <TableCell>Table</TableCell>
                            <TableCell>Event</TableCell>
                            <TableCell>Timing</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {schema.triggers.map(trg => (
                            <TableRow key={trg.name} hover>
                                <TableCell><strong>{trg.name}</strong></TableCell>
                                <TableCell>{trg.table}</TableCell>
                                <TableCell><Chip label={trg.event} size="small" color={trg.event === 'INSERT' ? 'success' : trg.event === 'UPDATE' ? 'info' : 'error'} /></TableCell>
                                <TableCell>{trg.timing}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        )
    }

    // Policies Panel
    if (mainTab === 3 && schema.policies) {
        return (
            <TableContainer component={Paper}>
                <Table>
                    <TableHead>
                        <TableRow sx={{ '& th': { fontWeight: 'bold' } }}>
                            <TableCell>Policy Name</TableCell>
                            <TableCell>Table</TableCell>
                            <TableCell>Command</TableCell>
                            <TableCell>Roles</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {schema.policies.map(pol => (
                            <TableRow key={`${pol.table}-${pol.name}`} hover>
                                <TableCell><strong>{pol.name}</strong></TableCell>
                                <TableCell>{pol.table}</TableCell>
                                <TableCell><Chip label={pol.command} size="small" /></TableCell>
                                <TableCell>{pol.roles.join(', ')}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </TableContainer>
        )
    }

    return null;
  }

  return (
    <Box>
      <Paper sx={{ p: 3, mb: 3 }}>
        <Typography variant="h5" gutterBottom component="h1">
          Database Schema Inspector
        </Typography>
        <Typography paragraph color="text.secondary">
          This tool inspects the database schema using an RPC function to visualize Tables, Functions, Triggers, and RLS Policies. You can also export the results to a JSON file for offline analysis.
        </Typography>
        
        <Stack direction="row" spacing={2}>
          <Button variant="contained" onClick={fetchSchema} disabled={loading} size="large">
            {loading ? <CircularProgress size={24} color="inherit" /> : 'Load Database Schema'}
          </Button>
          <Button 
              variant="outlined" 
              onClick={handleExport} 
              disabled={!schema || loading} 
              size="large"
              startIcon={<FileDownloadIcon />}
          >
              Export as JSON
          </Button>
        </Stack>
      </Paper>

      {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}

      {schema && (
        <Paper sx={{ mt: 2, overflow: 'hidden' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider' }}>
            <Tabs value={mainTab} onChange={handleMainTabChange}>
                <Tab label={`Tables (${schema.tables?.length || 0})`} />
                <Tab label={`Functions (${schema.functions?.length || 0})`} />
                <Tab label={`Triggers (${schema.triggers?.length || 0})`} />
                <Tab label={`Policies (${schema.policies?.length || 0})`} />
            </Tabs>
          </Box>
          <Box mt={2}>
            {renderContent()}
          </Box>
        </Paper>
      )}
    </Box>
  );
};

export default DbSchemaPage;