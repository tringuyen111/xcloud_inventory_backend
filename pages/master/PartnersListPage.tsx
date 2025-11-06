import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { Partner, Organization } from '../../types/supabase';
import {
  Paper, Typography, Stack, TextField, FormControl, InputLabel, Select, MenuItem, Button, Menu, Grid, Chip,
  CircularProgress, Alert, TableContainer, Table, TableHead, TableRow, TableCell, TableBody,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, FileDownload as FileDownloadIcon, ViewColumn as ViewColumnIcon } from '@mui/icons-material';
import { format } from 'date-fns';

const PartnersListPage: React.FC = () => {
  // FIX: Updated state type to correctly include the joined 'organization' object. This resolves a destructuring error in handleSave.
  const [partners, setPartners] = useState<(Partner & { organization?: { name: string } })[]>([]);
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  // FIX: Updated state type to correctly include the joined 'organization' object.
  const [editingPartner, setEditingPartner] = useState<(Partner & { organization?: { name: string } }) | null>(null);
  // FIX: Updated state type to correctly include the joined 'organization' object.
  const [formData, setFormData] = useState<Partial<Partner & { organization?: { name: string } }>>({});

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [typeFilter, setTypeFilter] = useState('all');

  const [columnAnchorEl, setColumnAnchorEl] = useState<null | HTMLElement>(null);
  const [visibleColumns, setVisibleColumns] = useState({
    code: true,
    name: true,
    type: true,
    tax_id: true,
    phone: true,
    email: true,
    status: true,
    updated_at: true,
  });

  const PARTNER_TYPES: Partner['partner_type'][] = ['CUSTOMER', 'SUPPLIER', 'CARRIER', 'OTHER'];

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: orgData, error: orgError } = await supabase.from('organizations').select('id, name').eq('is_active', true);
      if (orgError) throw orgError;
      setOrganizations(orgData || []);

      let query = supabase.from('partners').select('*, organization:organizations(name)');

      if (searchTerm) query = query.ilike('name', `%${searchTerm}%`);
      if (statusFilter !== 'all') query = query.eq('is_active', statusFilter === 'active');
      if (typeFilter !== 'all') query = query.eq('partner_type', typeFilter);

      const { data, error: queryError } = await query.order('id', { ascending: true });
      if (queryError) throw queryError;
      setPartners(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter, typeFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // FIX: Updated parameter type to correctly include the joined 'organization' object.
  const handleOpenDialog = (p: (Partner & { organization?: { name: string } }) | null = null) => {
    setEditingPartner(p);
    setFormData(p ? { ...p } : { code: '', name: '', is_active: true, partner_type: 'CUSTOMER' });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingPartner(null);
    setFormData({});
  };

  const handleSave = async () => {
    if (!formData.code || !formData.name || !formData.org_id) {
      setError("Organization, Code, and Name are required.");
      return;
    }
    try {
      // FIX: Added default value to destructuring to handle cases where 'organization' is not in formData, resolving a potential error.
      const { organization, ...dataToSave } = {
        ...formData,
        updated_at: new Date().toISOString(),
      };

      if (editingPartner) {
        const { error: updateError } = await supabase.from('partners').update(dataToSave).eq('id', editingPartner.id);
        if (updateError) throw updateError;
      } else {
        const { error: createError } = await supabase.from('partners').insert(dataToSave);
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

  const getTypeChipColor = (type: Partner['partner_type']) => {
    switch(type) {
      case 'CUSTOMER': return 'info';
      case 'SUPPLIER': return 'warning';
      case 'CARRIER': return 'secondary';
      default: return 'default';
    }
  };

  return (
    <Paper sx={{ p: 3 }}>
      <Typography variant="h5" gutterBottom component="h1">Partners</Typography>
      <Typography color="text.secondary" paragraph>Manage all partner information</Typography>

      <Stack direction="row" spacing={2} mb={3} alignItems="center" flexWrap="wrap">
        <TextField label="Search" variant="outlined" size="small" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} sx={{ flexGrow: 1, minWidth: '200px' }} />
        <FormControl size="small" sx={{ minWidth: 120 }}>
          <InputLabel>Type</InputLabel>
          <Select value={typeFilter} label="Type" onChange={(e) => setTypeFilter(e.target.value)}>
            <MenuItem value="all">All Types</MenuItem>
            {PARTNER_TYPES.map(type => <MenuItem key={type} value={type}>{type}</MenuItem>)}
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
                {visibleColumns.code && <TableCell>Partner Code</TableCell>}
                {visibleColumns.name && <TableCell>Partner Name</TableCell>}
                {visibleColumns.type && <TableCell>Partner Type</TableCell>}
                {visibleColumns.tax_id && <TableCell>Tax Code</TableCell>}
                {visibleColumns.phone && <TableCell>Phone</TableCell>}
                {visibleColumns.email && <TableCell>Email</TableCell>}
                {visibleColumns.status && <TableCell>Status</TableCell>}
                {visibleColumns.updated_at && <TableCell>Updated At</TableCell>}
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {partners.map((p) => (
                <TableRow key={p.id} hover>
                  {visibleColumns.code && <TableCell>{p.code}</TableCell>}
                  {visibleColumns.name && <TableCell>{p.name}</TableCell>}
                  {visibleColumns.type && <TableCell><Chip label={p.partner_type} color={getTypeChipColor(p.partner_type)} size="small" /></TableCell>}
                  {visibleColumns.tax_id && <TableCell>{p.tax_id}</TableCell>}
                  {visibleColumns.phone && <TableCell>{p.phone}</TableCell>}
                  {visibleColumns.email && <TableCell>{p.email}</TableCell>}
                  {visibleColumns.status && <TableCell>
                    <Chip 
                      label={p.is_active ? 'Active' : 'Inactive'} 
                      color={p.is_active ? 'primary' : 'default'}
                      variant={p.is_active ? 'filled' : 'outlined'}
                      size="small"
                    />
                  </TableCell>}
                  {visibleColumns.updated_at && <TableCell>{format(new Date(p.updated_at || p.created_at), 'yyyy-MM-dd HH:mm')}</TableCell>}
                  <TableCell>
                    <IconButton onClick={() => handleOpenDialog(p)} size="small"><EditIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingPartner ? 'Edit Partner' : 'Add New Partner'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Organization</InputLabel>
                <Select value={formData.org_id || ''} label="Organization" onChange={(e) => setFormData({ ...formData, org_id: Number(e.target.value) })}>
                  {organizations.map(org => <MenuItem key={org.id} value={org.id}>{org.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Code" fullWidth value={formData.code || ''} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required disabled={!!editingPartner} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Name" fullWidth value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </Grid>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth>
                <InputLabel>Partner Type</InputLabel>
                <Select value={formData.partner_type || 'CUSTOMER'} label="Partner Type" onChange={(e) => setFormData({ ...formData, partner_type: e.target.value as Partner['partner_type'] })}>
                  {PARTNER_TYPES.map(type => <MenuItem key={type} value={type}>{type}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}><TextField label="Tax ID" fullWidth value={formData.tax_id || ''} onChange={(e) => setFormData({ ...formData, tax_id: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Phone" fullWidth value={formData.phone || ''} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}><TextField label="Email" type="email" fullWidth value={formData.email || ''} onChange={(e) => setFormData({ ...formData, email: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6}>
              {editingPartner && (
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select value={formData.is_active ? 'true' : 'false'} label="Status" onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}>
                    <MenuItem value="true">Active</MenuItem>
                    <MenuItem value="false">Inactive</MenuItem>
                  </Select>
                </FormControl>
              )}
            </Grid>
            <Grid item xs={12}><TextField label="Address" fullWidth multiline rows={3} value={formData.address || ''} onChange={(e) => setFormData({ ...formData, address: e.target.value })} /></Grid>
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

export default PartnersListPage;