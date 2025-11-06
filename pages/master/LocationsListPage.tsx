import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { Location, Warehouse } from '../../types/supabase';
import {
  Paper, Typography, Stack, TextField, FormControl, InputLabel, Select, MenuItem, Button, Menu, Grid,
  CircularProgress, Alert, TableContainer, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, FileDownload as FileDownloadIcon, ViewColumn as ViewColumnIcon } from '@mui/icons-material';
import { format } from 'date-fns';

const LocationsListPage: React.FC = () => {
  // FIX: Updated state type to correctly include the joined 'warehouse' object. This resolves a destructuring error in handleSave.
  const [locations, setLocations] = useState<(Location & { warehouse?: { name: string } })[]>([]);
  const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  // FIX: Updated state type to correctly include the joined 'warehouse' object.
  const [editingLocation, setEditingLocation] = useState<(Location & { warehouse?: { name: string } }) | null>(null);
  // FIX: Updated state type to correctly include the joined 'warehouse' object.
  const [formData, setFormData] = useState<Partial<Location & { warehouse?: { name: string } }>>({});

  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  const [columnAnchorEl, setColumnAnchorEl] = useState<null | HTMLElement>(null);
  const [visibleColumns, setVisibleColumns] = useState({
    code: true,
    warehouse: true,
    aisle: true,
    rack: true,
    shelf: true,
    bin: true,
    status: true,
    updated_at: true,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: whData, error: whError } = await supabase.from('warehouses').select('id, name').eq('is_active', true);
      if (whError) throw whError;
      setWarehouses(whData || []);

      let query = supabase.from('locations').select('*, warehouse:warehouses(name)');

      if (searchTerm) query = query.ilike('code', `%${searchTerm}%`);
      if (statusFilter !== 'all') query = query.eq('is_active', statusFilter === 'active');

      const { data, error: queryError } = await query.order('id', { ascending: true });
      if (queryError) throw queryError;
      setLocations(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [searchTerm, statusFilter]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // FIX: Updated parameter type to correctly include the joined 'warehouse' object.
  const handleOpenDialog = (loc: (Location & { warehouse?: { name: string } }) | null = null) => {
    setEditingLocation(loc);
    setFormData(loc ? { ...loc } : { code: '', is_active: true });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingLocation(null);
    setFormData({});
  };

  const handleSave = async () => {
    if (!formData.code || !formData.warehouse_id) {
      setError("Warehouse and Code are required.");
      return;
    }

    try {
      // FIX: Added default value to destructuring to handle cases where 'warehouse' is not in formData, resolving a potential error.
      const { warehouse, ...dataToSave } = {
        ...formData,
        updated_at: new Date().toISOString(),
      };

      if (editingLocation) {
        const { error: updateError } = await supabase.from('locations').update(dataToSave).eq('id', editingLocation.id);
        if (updateError) throw updateError;
      } else {
        const { error: createError } = await supabase.from('locations').insert(dataToSave);
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
      <Typography variant="h5" gutterBottom component="h1">Locations</Typography>
      <Typography color="text.secondary" paragraph>Manage storage location information</Typography>

       <Stack direction="row" spacing={2} mb={3} alignItems="center" flexWrap="wrap">
        <TextField label="Search by Code" variant="outlined" size="small" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} sx={{ flexGrow: 1, minWidth: '200px' }} />
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
                {visibleColumns.warehouse && <TableCell>Warehouse</TableCell>}
                {visibleColumns.aisle && <TableCell>Aisle</TableCell>}
                {visibleColumns.rack && <TableCell>Rack</TableCell>}
                {visibleColumns.shelf && <TableCell>Shelf</TableCell>}
                {visibleColumns.bin && <TableCell>Bin</TableCell>}
                {visibleColumns.status && <TableCell>Status</TableCell>}
                {visibleColumns.updated_at && <TableCell>Updated At</TableCell>}
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {locations.map((loc) => (
                <TableRow key={loc.id} hover>
                  {visibleColumns.code && <TableCell>{loc.code}</TableCell>}
                  {visibleColumns.warehouse && <TableCell>{loc.warehouse?.name || 'N/A'}</TableCell>}
                  {visibleColumns.aisle && <TableCell>{loc.aisle}</TableCell>}
                  {visibleColumns.rack && <TableCell>{loc.rack}</TableCell>}
                  {visibleColumns.shelf && <TableCell>{loc.shelf}</TableCell>}
                  {visibleColumns.bin && <TableCell>{loc.bin}</TableCell>}
                  {visibleColumns.status && <TableCell>
                    <Chip 
                      label={loc.is_active ? 'Active' : 'Inactive'} 
                      color={loc.is_active ? 'primary' : 'default'}
                      variant={loc.is_active ? 'filled' : 'outlined'}
                      size="small"
                    />
                  </TableCell>}
                  {visibleColumns.updated_at && <TableCell>{format(new Date(loc.updated_at || loc.created_at), 'yyyy-MM-dd HH:mm')}</TableCell>}
                  <TableCell>
                    <IconButton onClick={() => handleOpenDialog(loc)} size="small"><EditIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingLocation ? 'Edit Location' : 'Add New Location'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Warehouse</InputLabel>
                <Select value={formData.warehouse_id || ''} label="Warehouse" onChange={(e) => setFormData({ ...formData, warehouse_id: Number(e.target.value) })}>
                  {warehouses.map(w => <MenuItem key={w.id} value={w.id}>{w.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Location Code" fullWidth value={formData.code || ''} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required disabled={!!editingLocation} />
            </Grid>
            <Grid item xs={12} sm={6} md={3}><TextField label="Aisle" fullWidth value={formData.aisle || ''} onChange={(e) => setFormData({ ...formData, aisle: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6} md={3}><TextField label="Rack" fullWidth value={formData.rack || ''} onChange={(e) => setFormData({ ...formData, rack: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6} md={3}><TextField label="Shelf" fullWidth value={formData.shelf || ''} onChange={(e) => setFormData({ ...formData, shelf: e.target.value })} /></Grid>
            <Grid item xs={12} sm={6} md={3}><TextField label="Bin" fullWidth value={formData.bin || ''} onChange={(e) => setFormData({ ...formData, bin: e.target.value })} /></Grid>
            <Grid item xs={12}>
              {editingLocation && (
                <FormControl fullWidth>
                  <InputLabel>Status</InputLabel>
                  <Select value={formData.is_active ? 'true' : 'false'} label="Status" onChange={(e) => setFormData({ ...formData, is_active: e.target.value === 'true' })}>
                    <MenuItem value="true">Active</MenuItem>
                    <MenuItem value="false">Inactive</MenuItem>
                  </Select>
                </FormControl>
              )}
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

export default LocationsListPage;