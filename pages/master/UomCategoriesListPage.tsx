import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from '../../services/supabase';
import { UomCategory } from '../../types/supabase';
import {
  Paper, Typography, Stack, TextField, Button, Menu, MenuItem,
  CircularProgress, Alert, TableContainer, Table, TableHead, TableRow, TableCell, TableBody,
  IconButton, Dialog, DialogTitle, DialogContent, DialogActions
} from '@mui/material';
import { Add as AddIcon, Edit as EditIcon, FileDownload as FileDownloadIcon, ViewColumn as ViewColumnIcon } from '@mui/icons-material';
import { format } from 'date-fns';

const UomCategoriesListPage: React.FC = () => {
  const [categories, setCategories] = useState<UomCategory[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingCategory, setEditingCategory] = useState<UomCategory | null>(null);
  const [formData, setFormData] = useState<Partial<UomCategory>>({});

  const [searchTerm, setSearchTerm] = useState('');

  const [columnAnchorEl, setColumnAnchorEl] = useState<null | HTMLElement>(null);
  const [visibleColumns, setVisibleColumns] = useState({
    code: true,
    name: true,
    description: true,
    updated_at: true,
  });

  const loadData = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let query = supabase.from('uom_categories').select('*');
      if (searchTerm) query = query.ilike('name', `%${searchTerm}%`);
      const { data, error: queryError } = await query.order('id', { ascending: true });
      if (queryError) throw queryError;
      setCategories(data || []);
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [searchTerm]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const handleOpenDialog = (cat: UomCategory | null = null) => {
    setEditingCategory(cat);
    setFormData(cat ? { ...cat } : { code: '', name: '' });
    setDialogOpen(true);
  };

  const handleCloseDialog = () => {
    setDialogOpen(false);
    setEditingCategory(null);
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

      if (editingCategory) {
        const { error: updateError } = await supabase.from('uom_categories').update(dataToSave).eq('id', editingCategory.id);
        if (updateError) throw updateError;
      } else {
        const { error: createError } = await supabase.from('uom_categories').insert(dataToSave);
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
      <Typography variant="h5" gutterBottom component="h1">UoM Categories</Typography>
      <Typography color="text.secondary" paragraph>Manage unit of measure categories</Typography>

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
                {visibleColumns.description && <TableCell>Description</TableCell>}
                {visibleColumns.updated_at && <TableCell>Updated At</TableCell>}
                <TableCell>Actions</TableCell>
              </TableRow>
            </TableHead>
            <TableBody>
              {categories.map((cat) => (
                <TableRow key={cat.id} hover>
                  {visibleColumns.code && <TableCell>{cat.code}</TableCell>}
                  {visibleColumns.name && <TableCell>{cat.name}</TableCell>}
                  {visibleColumns.description && <TableCell>{cat.description}</TableCell>}
                  {visibleColumns.updated_at && <TableCell>{format(new Date(cat.updated_at || cat.created_at!), 'yyyy-MM-dd HH:mm')}</TableCell>}
                  <TableCell>
                    <IconButton onClick={() => handleOpenDialog(cat)} size="small"><EditIcon /></IconButton>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </TableContainer>
      )}

      <Dialog open={dialogOpen} onClose={handleCloseDialog} maxWidth="sm" fullWidth>
        <DialogTitle>{editingCategory ? 'Edit UoM Category' : 'Add New UoM Category'}</DialogTitle>
        <DialogContent>
          <Stack spacing={2} sx={{ mt: 1 }}>
            <TextField label="Code" fullWidth value={formData.code || ''} onChange={(e) => setFormData({ ...formData, code: e.target.value })} required disabled={!!editingCategory} />
            <TextField label="Name" fullWidth value={formData.name || ''} onChange={(e) => setFormData({ ...formData, name: e.target.value })} required />
            <TextField label="Description" fullWidth multiline rows={3} value={formData.description || ''} onChange={(e) => setFormData({ ...formData, description: e.target.value })} />
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

export default UomCategoriesListPage;
