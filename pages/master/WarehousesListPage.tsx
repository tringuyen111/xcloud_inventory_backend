import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { Warehouse, Branch } from '../../types/supabase';
import {
  Paper, Typography, Stack, TextField, FormControl, InputLabel, Select, MenuItem, Button, Menu,
  CircularProgress, Alert, TableContainer, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, FileDownload as FileDownloadIcon, ViewColumn as ViewColumnIcon } from '@mui/icons-material';
import { format } from 'date-fns';

const WarehousesListPage: React.FC = () => {
  // FIX: Updated state type to correctly include the joined 'branch' object. This resolves a destructuring error in handleSave.
  const [warehouses, setWarehouses] = useState<(Warehouse & { branch?: { name: string } })[]>([]);
  const [branches, setBranches] = useState<Branch[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  // FIX: Updated state type to correctly include the joined 'branch' object.
  const [editingWarehouse, setEditingWarehouse] = useState<(Warehouse & { branch?: { name: string } }) | null>(null);
  // FIX: Updated state type to correctly include the joined 'branch' object.
  const [formData, setFormData] = useState<Partial<Warehouse & { branch?: { name: string } }>>({});

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const [columnAnchorEl, setColumnAnchorEl] = useState<null | HTMLElement>(null);
  const [visibleColumns, setVisibleColumns] = useState({
    code: true,
    name: true,
    branch: true,
    type: true,
    status: true,
    updated_at: true,
  });

  const WAREHOUSE_TYPES = ['NORMAL', 'QUARANTINE', 'DAMAGE'];

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: branchData, error: branchError } = await supabase.from('branches').select('id, name').eq('is_active', true);
      if (branchError) throw branchError;
      setBranches(branchData || []);

      let query = supabase.from('warehouses').select('*, branch:branches(name)');

      if (searchTerm) query = query.ilike('name', `%${searchTerm}%`);
      if (statusFilter !== 'all') query = query.eq('is_active', statusFilter === 'active');
      if (typeFilter !== 'all') query = query.eq('warehouse_type', typeFilter);

      const { data, error: queryError } = await query.order('id', { ascending: true });

      if (queryError) throw queryError;
      setWarehouses(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, typeFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // FIX: Updated parameter type to correctly include the joined 'branch' object.
  const handleOpenDialog = (wh: (Warehouse & { branch?: { name: string } }) | null = null) => {
    setEditingWarehouse(wh);
    setFormData(wh ? { ...wh } : { code: '', name: '', is_active: true, warehouse_type: 'NORMAL' });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingWarehouse(null);
    setFormData({});
  };

  const handleSave = async () => {
    if (!formData.code || !formData.name || !formData.branch_id) {
      setError("Branch, Code, and Name are required.");
      return;
    }

    try {
      // FIX: Added default value to destructuring to handle cases where 'branch' is not in formData, resolving a potential error.
      const { branch, ...dataToSave } = {
        ...formData,
        updated_at: new Date().toISOString(),
      };

      if (editingWarehouse) {
        const { error: updateError } = await supabase.from('warehouses').update(dataToSave).eq('id', editingWarehouse.id);
        if (updateError) throw updateError;
      } else {
        const { error: createError } = await supabase.from('warehouses').insert(dataToSave);
        if (createError) throw createError;
      }
      handleCloseDialog();
      loadData();
    } catch (err: any) {
      setError(err.message);
    }
  };

  const handleColumnToggle = (column: keyof typeof visibleColumns) => {
    setVisibleColumns(prev => ({ ...prev, [column]: !prev[column] }));
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom component="h1">Warehouses</Typography>
      <Typography color="text.secondary" paragraph>Manage warehouse information</Typography>

      <Stack direction="row" spacing={2} mb={3} alignItems="center" flexWrap="wrap">
        <TextField label="Search" variant="outlined" size="small" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} sx={{ flexGrow: 1, minWidth: '200px' }} />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Type</InputLabel>
          <Select value={typeFilter} label="Type" onChange={(e) => setTypeFilter(e.target.value)}>
            <MenuItem value="all">All Types</MenuItem>
            {WAREHOUSE_TYPES.map(type => <MenuItem key={type} value={type}>{type}</MenuItem>)}
          </Select>
        </FormControl>
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select value={statusFilter} label="Status" onChange={(e) => setStatusFilter(e.target.value)}>
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </Select>
        </FormControl>
        <Button variant="outlined" startIcon={<FileDownloadIcon />}>Export</Button>
        <Button variant="outlined" startIcon={<ViewColumnIcon />} onClick={(e) => setColumnAnchorEl(e.currentTarget)}>Columns</Button>
        <Menu anchorEl={columnAnchorEl} open={Boolean(columnAnchorEl)} onClose={() => setColumnAnchorEl(null)}>
          {Object.keys(visibleColumns).map((column) => (
            <MenuItem key={column} onClick={() => handleColumnToggle(column as keyof typeof visibleColumns)}>
               {column.replace(/_/g, ' ').toUpperCase()}
            </MenuItem>
          ))}
        </Menu>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>Add New</Button>
      </Stack>

      {loading && <CircularProgress />}
      {error && <Alert severity="error" sx={{ my: 2 }}>{error}</Alert>}

      {!loading && !error && (
        <TableContainer>
          <Table>
            <TableHead>
              <TableRow>
                {visibleColumns.code && <TableCell>Code</TableCell>}
                {visibleColumns.name && <TableCell>Name</TableCell>}
                {visibleColumns.branch && <TableCell>Branch</TableCell>}
                {visibleColumns.type && <TableCell>Type</TableCell>}
                {visibleColumns.status && <TableCell>Status</TableCell>}
                {visibleColumns.updated_at && <TableCell>Updated At</TableCell>}
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {warehouses.map((wh) => (
                <TableRow key={wh.id} hover>
                  {visibleColumns.code && <TableCell>{wh.code}</TableCell>}
                  {visibleColumns.name && <TableCell>{wh.name}</TableCell>}
                  {visibleColumns.branch && <TableCell>{wh.branch?.name || 'N/A'}</TableCell>}
                  {visibleColumns.type && <TableCell><Chip label={wh.warehouse_type} size="small" /></TableCell>}
                  {visibleColumns.status && <TableCell>
                    <Chip 
                      label={wh.is_active ? 'Active' : 'Inactive'} 
                      color={wh.is_active ? 'primary' : 'default'}
                      variant={wh.is_active ? 'filled' : 'outlined'}
                      size="small"
                    />
                  </TableCell>}
                  {visibleColumns.updated_at && <TableCell>{format(new Date(wh.updated_at || wh.created_at), 'yyyy-MM-dd HH:mm')}</TableCell>}
                  <TableCell>
                    <IconButton onClick={() => handleOpenDialog(wh)} size="small"><EditIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingWarehouse ? 'Edit Warehouse' : 'Add New Warehouse'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth required>
              <InputLabel>Branch</InputLabel>
              <Select value={formData.branch_id || ''} label="Branch" onChange={(e) => setFormData({ ...formData, branch_id: Number(e.target.value) })}>
                {branches.map(b => <MenuItem key={b.id} value={b.id}>{b.name}</MenuItem>)}
              </Select>
            </FormControl>
            <TextField label="Code" fullWidth value={formData.code || ''} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required disabled={!!editingWarehouse} />
            <TextField label="Name" fullWidth value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            <FormControl fullWidth>
              <InputLabel>Warehouse Type</InputLabel>
              <Select value={formData.warehouse_type || 'NORMAL'} label="Warehouse Type" onChange={(e) => setFormData({ ...formData, warehouse_type: e.target.value })}>
                {WAREHOUSE_TYPES.map(type => <MenuItem key={type} value={type}>{type}</MenuItem>)}
              </Select>
            </FormControl>
            {editingWarehouse && (
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select value={formData.is_active ? 'true' : 'false'} label="Status" onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}>
                  <MenuItem value="true">Active</MenuItem>
                  <MenuItem value="false">Inactive</MenuItem>
                </Select>
              </FormControl>
            )}
          </Stack>
        </DialogContent>
        <DialogActions sx={{ p: '16px 24px' }}>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default WarehousesListPage;