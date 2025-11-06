import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { Uom, UomCategory } from '../../types/supabase';
import {
  Paper, Typography, Stack, TextField, FormControl, InputLabel, Select, MenuItem, Button, Menu, Grid,
  CircularProgress, Alert, TableContainer, Table, TableHead, TableRow, TableCell, TableBody,
  Chip, IconButton, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, FileDownload as FileDownloadIcon, ViewColumn as ViewColumnIcon } from '@mui/icons-material';
import { format } from 'date-fns';

const UomsListPage: React.FC = () => {
  // FIX: Updated state type to correctly include the joined 'category' object. This resolves a destructuring error in handleSave.
  const [uoms, setUoms] = useState<(Uom & { category?: { name: string } })[]>([]);
  const [categories, setCategories] = useState<UomCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  // FIX: Updated state type to correctly include the joined 'category' object.
  const [editingUom, setEditingUom] = useState<(Uom & { category?: { name: string } }) | null>(null);
  // FIX: Updated state type to correctly include the joined 'category' object.
  const [formData, setFormData] = useState<Partial<Uom & { category?: { name: string } }>>({});

  const [searchTerm, setSearchTerm] = useState('');

  const [columnAnchorEl, setColumnAnchorEl] = useState<null | HTMLElement>(null);
  const [visibleColumns, setVisibleColumns] = useState({
    code: true,
    name: true,
    category: true,
    is_base: true,
    ratio: true,
    updated_at: true,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const { data: catData, error: catError } = await supabase.from('uom_categories').select('id, name');
      if (catError) throw catError;
      setCategories(catData || []);

      let query = supabase.from('uoms').select('*, category:uom_categories(name)');

      if (searchTerm) query = query.ilike('name', `%${searchTerm}%`);
      
      const { data, error: queryError } = await query.order('id', { ascending: true });
      if (queryError) throw queryError;
      setUoms(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // FIX: Updated parameter type to correctly include the joined 'category' object.
  const handleOpenDialog = (uom: (Uom & { category?: { name: string } }) | null = null) => {
    setEditingUom(uom);
    setFormData(uom ? { ...uom } : { code: '', name: '', is_base: false, ratio_to_base: 1 });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingUom(null);
    setFormData({});
  };

  const handleSave = async () => {
    if (!formData.code || !formData.name || !formData.category_id) {
      setError("Category, Code, and Name are required.");
      return;
    }

    try {
      // FIX: Added default value to destructuring to handle cases where 'category' is not in formData, resolving a potential error.
      const { category, ...dataToSave } = {
        ...formData,
        updated_at: new Date().toISOString(),
      };

      if (editingUom) {
        const { error: updateError } = await supabase.from('uoms').update(dataToSave).eq('id', editingUom.id);
        if (updateError) throw updateError;
      } else {
        const { error: createError } = await supabase.from('uoms').insert(dataToSave);
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
      <Typography variant="h5" gutterBottom component="h1">Units of Measure</Typography>
      <Typography color="text.secondary" paragraph>Manage UoMs for all products</Typography>

      <Stack direction="row" spacing={2} mb={3} alignItems="center" flexWrap="wrap">
        <TextField label="Search" variant="outlined" size="small" value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} sx={{ flexGrow: 1, minWidth: '200px' }} />
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
                {visibleColumns.category && <TableCell>Category</TableCell>}
                {visibleColumns.is_base && <TableCell>Is Base Unit</TableCell>}
                {visibleColumns.ratio && <TableCell>Ratio to Base</TableCell>}
                {visibleColumns.updated_at && <TableCell>Updated At</TableCell>}
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {uoms.map((uom) => (
                <TableRow key={uom.id} hover>
                  {visibleColumns.code && <TableCell>{uom.code}</TableCell>}
                  {visibleColumns.name && <TableCell>{uom.name}</TableCell>}
                  {visibleColumns.category && <TableCell>{uom.category?.name || 'N/A'}</TableCell>}
                  {visibleColumns.is_base && <TableCell>{uom.is_base && <Chip label="Base" color="primary" size="small" />}</TableCell>}
                  {visibleColumns.ratio && <TableCell>{uom.ratio_to_base}</TableCell>}
                  {visibleColumns.updated_at && <TableCell>{format(new Date(uom.updated_at || uom.created_at), 'yyyy-MM-dd HH:mm')}</TableCell>}
                  <TableCell>
                    <IconButton onClick={() => handleOpenDialog(uom)} size="small"><EditIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>{editingUom ? 'Edit UoM' : 'Add New UoM'}</DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12} sm={6}>
              <FormControl fullWidth required>
                <InputLabel>Category</InputLabel>
                <Select value={formData.category_id || ''} label="Category" onChange={(e) => setFormData({ ...formData, category_id: Number(e.target.value) })}>
                  {categories.map(c => <MenuItem key={c.id} value={c.id}>{c.name}</MenuItem>)}
                </Select>
              </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Code" fullWidth value={formData.code || ''} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required disabled={!!editingUom} />
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField label="Name" fullWidth value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            </Grid>
            <Grid item xs={12} sm={6}>
                <FormControl fullWidth>
                  <InputLabel>Is Base Unit</InputLabel>
                  <Select
                    value={formData.is_base ? 'true' : 'false'}
                    label="Is Base Unit"
                    onChange={(e) => {
                        const isBase = e.target.value === 'true';
                        setFormData({ ...formData, is_base: isBase, ratio_to_base: isBase ? 1 : formData.ratio_to_base });
                    }}
                  >
                    <MenuItem value="true">Yes</MenuItem>
                    <MenuItem value="false">No</MenuItem>
                  </Select>
                </FormControl>
            </Grid>
            <Grid item xs={12} sm={6}>
              <TextField 
                label="Ratio to Base" 
                type="number" 
                fullWidth 
                value={formData.ratio_to_base || 1} 
                onChange={(e) => setFormData({ ...formData, ratio_to_base: Number(e.target.value) })} 
                disabled={formData.is_base}
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

export default UomsListPage;