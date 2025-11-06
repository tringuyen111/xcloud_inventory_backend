import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { Organization } from '../../types/supabase';
import {
  Box, Button, Paper, TextField, Typography, Table, TableBody, TableCell, TableContainer,
  TableHead, TableRow, IconButton, Dialog, DialogActions, DialogContent, DialogTitle,
  CircularProgress, Alert, Chip, Stack, Grid, Select, MenuItem, FormControl, InputLabel, Menu
} from '@mui/material';
import {
  Add as AddIcon, Edit as EditIcon, FilterList as FilterListIcon,
  FileDownload as FileDownloadIcon, ViewColumn as ViewColumnIcon
} from '@mui/icons-material';
import { format } from 'date-fns';

const OrganizationsListPage: React.FC = () => {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingOrg, setEditingOrg] = useState<Organization | null>(null);
  const [formData, setFormData] = useState<Partial<Organization>>({});
  
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [columnAnchorEl, setColumnAnchorEl] = useState<null | HTMLElement>(null);
  const [visibleColumns, setVisibleColumns] = useState({
    code: true,
    name: true,
    tax_id: true,
    phone: true,
    email: true,
    status: true,
    updated_at: true,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('organizations').select('*');

      if (searchTerm) {
        query = query.ilike('name', `%${searchTerm}%`);
      }
      if (statusFilter !== 'all') {
        query = query.eq('is_active', statusFilter === 'active');
      }

      const { data, error: queryError } = await query.order('id', { ascending: true });

      if (queryError) throw queryError;
      setOrganizations(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenDialog = (org: Organization | null = null) => {
    setEditingOrg(org);
    setFormData(org ? { ...org } : { code: '', name: '', is_active: true });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingOrg(null);
    setFormData({});
  };

  const handleSave = async () => {
    if (!formData.code || !formData.name) {
      setError("Code and Name are required.");
      return;
    }
    
    try {
      const dataToSave = {
        ...formData,
        updated_at: new Date().toISOString(),
      };

      if (editingOrg) {
        // Update
        const { error: updateError } = await supabase
          .from('organizations')
          .update(dataToSave)
          .eq('id', editingOrg.id);
        if (updateError) throw updateError;
      } else {
        // Create
        const { error: createError } = await supabase
          .from('organizations')
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
        Organizations
      </Typography>
      <Typography color="text.secondary" paragraph>
        Manage organization information
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
                {visibleColumns.tax_id && <TableCell>Tax ID</TableCell>}
                {visibleColumns.phone && <TableCell>Phone</TableCell>}
                {visibleColumns.email && <TableCell>Email</TableCell>}
                {visibleColumns.status && <TableCell>Status</TableCell>}
                {visibleColumns.updated_at && <TableCell>Updated At</TableCell>}
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {organizations.map((org) => (
                <TableRow key={org.id} hover>
                  {visibleColumns.code && <TableCell>{org.code}</TableCell>}
                  {visibleColumns.name && <TableCell>{org.name}</TableCell>}
                  {visibleColumns.tax_id && <TableCell>{org.tax_id}</TableCell>}
                  {visibleColumns.phone && <TableCell>{org.phone}</TableCell>}
                  {visibleColumns.email && <TableCell>{org.email}</TableCell>}
                  {visibleColumns.status && <TableCell>
                    <Chip 
                      label={org.is_active ? 'Active' : 'Inactive'} 
                      color={org.is_active ? 'primary' : 'default'}
                      variant={org.is_active ? 'filled' : 'outlined'}
                      size="small"
                    />
                  </TableCell>}
                  {visibleColumns.updated_at && <TableCell>{format(new Date(org.updated_at || org.created_at), 'yyyy-MM-dd HH:mm')}</TableCell>}
                  <TableCell>
                    <IconButton onClick={() => handleOpenDialog(org)} size="small">
                      <EditIcon />
                    </IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingOrg ? 'Edit Organization' : 'Add New Organization'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Code"
                fullWidth
                value={formData.code || ''}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                required
                disabled={!!editingOrg}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Name"
                fullWidth
                value={formData.name || ''}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Tax ID"
                fullWidth
                value={formData.tax_id || ''}
                onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Phone"
                fullWidth
                value={formData.phone || ''}
                onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
              />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField
                label="Email"
                type="email"
                fullWidth
                value={formData.email || ''}
                onChange={(e) => setFormData({ ...formData, email: e.target.value })}
              />
            </Grid>
             <Grid item xs={12} sm={6}>
               {editingOrg && (
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
            </Grid>
            <Grid item xs={12}>
              <TextField
                label="Address"
                fullWidth
                multiline
                rows={3}
                value={formData.address || ''}
                onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              />
            </Grid>
             <Grid item xs={12}>
              <TextField
                label="Notes"
                fullWidth
                multiline
                rows={3}
                value={formData.notes || ''}
                onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions sx={{ p: '16px 24px' }}>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSave} variant="contained">Save</Button>
        </DialogActions>
      </Dialog>
    </Paper>
  );
};

export default OrganizationsListPage;
