import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { Branch, Organization } from '../../types/supabase';
import {
  Box, Button, Paper, TextField, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Dialog, DialogActions, DialogContent, DialogTitle,
  CircularProgress, Alert, Chip, Stack, Select, MenuItem, FormControl, InputLabel, Menu
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, FileDownload as FileDownloadIcon, ViewColumn as ViewColumnIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

const BranchesListPage: React.FC = () => {
  // FIX: Updated state type to correctly include the joined 'organization' object. This resolves a destructuring error in handleSave.
  const [branches, setBranches] = useState<(Branch & { organization?: { name: string } })[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  // FIX: Updated state type to correctly include the joined 'organization' object.
  const [editingBranch, setEditingBranch] = useState<(Branch & { organization?: { name: string } }) | null>(null);
  // FIX: Updated state type to correctly include the joined 'organization' object.
  const [formData, setFormData] = useState<Partial<Branch & { organization?: { name: string } }>>({});
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [columnAnchorEl, setColumnAnchorEl] = useState<null | HTMLElement>(null);
  const [visibleColumns, setVisibleColumns] = useState({
    code: true,
    name: true,
    organization: true,
    status: true,
    updated_at: true,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      // Fetch organizations for the dropdown
      const { data: orgData, error: orgError } = await supabase.from('organizations').select('id, name').eq('is_active', true);
      if (orgError) throw orgError;
      setOrganizations(orgData || []);

      let query = supabase.from('branches').select('*, organization:organizations(name)');

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }
      if (statusFilter !== 'all') {
        query = query.eq('is_active', statusFilter === 'active');
      }

      const { data, error: queryError } = await query.order('id', { ascending: true });

      if (queryError) throw queryError;
      setBranches(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // FIX: Updated parameter type to correctly include the joined 'organization' object.
  const handleOpenDialog = (branch: (Branch & { organization?: { name: string } }) | null = null) => {
    setEditingBranch(branch);
    setFormData(branch ? { ...branch } : { code: '', name: '', is_active: true });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingBranch(null);
    setFormData({});
  };

  const handleSave = async () => {
    if (!formData.code || !formData.name || !formData.org_id) {
      setError("Organization, Code and Name are required.");
      return;
    }
    
    try {
      // FIX: Added default value to destructuring to handle cases where 'organization' is not in formData, resolving a potential error.
      const { organization, ...dataToSave } = {
        ...formData,
        updated_at: new Date().toISOString(),
      };

      if (editingBranch) {
        const { error: updateError } = await supabase
          .from('branches')
          .update(dataToSave)
          .eq('id', editingBranch.id);
        if (updateError) throw updateError;
      } else {
        const { error: createError } = await supabase
          .from('branches')
          .insert(dataToSave);
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
      <Typography variant="h5" gutterBottom component="h1">
        Branches
      </Typography>
      <Typography color="text.secondary" paragraph>
        Manage branch information
      </Typography>

      <Stack direction="row" spacing={2} mb={3} alignItems="center" flexWrap="wrap">
        <TextField
          label="Search"
          variant="outlined"
          size="small"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          sx={{ flexGrow: 1, minWidth: '200px' }}
        />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Status</InputLabel>
          <Select
            value={statusFilter}
            label="Status"
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <MenuItem value="all">All Status</MenuItem>
            <MenuItem value="active">Active</MenuItem>
            <MenuItem value="inactive">Inactive</MenuItem>
          </Select>
        </FormControl>
        <Button variant="outlined" startIcon={<FileDownloadIcon />}>Export</Button>
        <Button
          variant="outlined"
          startIcon={<ViewColumnIcon />}
          onClick={(e) => setColumnAnchorEl(e.currentTarget)}
        >
          Columns
        </Button>
        <Menu
          anchorEl={columnAnchorEl}
          open={Boolean(columnAnchorEl)}
          onClose={() => setColumnAnchorEl(null)}
        >
          {Object.keys(visibleColumns).map((column) => (
            <MenuItem key={column} onClick={() => handleColumnToggle(column as keyof typeof visibleColumns)}>
               {column.replace(/_/g, ' ').toUpperCase()}
            </MenuItem>
          ))}
        </Menu>
        <Button variant="contained" startIcon={<AddIcon />} onClick={() => handleOpenDialog()}>
          Add New
        </Button>
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
                {visibleColumns.organization && <TableCell>Organization</TableCell>}
                {visibleColumns.status && <TableCell>Status</TableCell>}
                {visibleColumns.updated_at && <TableCell>Updated At</TableCell>}
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {branches.map((branch) => (
                <TableRow key={branch.id} hover>
                  {visibleColumns.code && <TableCell>{branch.code}</TableCell>}
                  {visibleColumns.name && <TableCell>{branch.name}</TableCell>}
                  {visibleColumns.organization && <TableCell>{branch.organization?.name || 'N/A'}</TableCell>}
                  {visibleColumns.status && <TableCell>
                    <Chip 
                      label={branch.is_active ? 'Active' : 'Inactive'} 
                      color={branch.is_active ? 'primary' : 'default'}
                      variant={branch.is_active ? 'filled' : 'outlined'}
                      size="small"
                    />
                  </TableCell>}
                  {visibleColumns.updated_at && <TableCell>{format(new Date(branch.updated_at || branch.created_at), 'yyyy-MM-dd HH:mm')}</TableCell>}
                  <TableCell>
                    <IconButton onClick={() => handleOpenDialog(branch)} size="small">
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingBranch ? 'Edit Branch' : 'Add New Branch'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <FormControl fullWidth required>
              <InputLabel>Organization</InputLabel>
              <Select
                value={formData.org_id || ''}
                label="Organization"
                onChange={(e) => setFormData({ ...formData, org_id: Number(e.target.value) })}
              >
                {organizations.map(org => (
                  <MenuItem key={org.id} value={org.id}>{org.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Code"
              fullWidth
              value={formData.code || ''}
              onChange={(e) => setFormData({ ...formData, code: e.target.value })}
              required
              disabled={!!editingBranch}
            />
            <TextField
              label="Name"
              fullWidth
              value={formData.name || ''}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
            />
            <TextField
              label="Address"
              fullWidth
              multiline
              rows={3}
              value={formData.address || ''}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
            />
            {editingBranch && (
              <FormControl fullWidth>
                <InputLabel>Status</InputLabel>
                <Select
                  value={formData.is_active ? 'true' : 'false'}
                  label="Status"
                  onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}
                >
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

export default BranchesListPage;