import React, { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { supabase } from '../../../services/supabaseClient';
import {
    Warehouse,
    Location,
    Database
} from '../../../types/supabase';
import {
    Button,
    Card,
    Form,
    Input,
    Row,
    Col,
    Space,
    App,
    Spin,
    Select,
    Table,
    Popconfirm,
    InputNumber,
    Typography,
    Tag,
    DatePicker,
    AutoComplete
} from 'antd';
import {
    PlusOutlined,
    DeleteOutlined,
    SaveOutlined,
    CheckOutlined,
    RollbackOutlined
} from '@ant-design/icons';
import useAuthStore from '../../../stores/authStore';
import PageHeader from '../../../components/layout/PageHeader';
import dayjs from 'dayjs';

// --- Type Definitions ---
// FIX: Corrected typo in enum name from gr_transaction_type to gr_transaction_type_enum
type GRTransactionType = Database['public']['Enums']['gr_transaction_type_enum'];
type GoodsModelWithOptions = {
    id: number;
    code: string;
    name: string;
    tracking_type: 'NONE' | 'LOT' | 'SERIAL';
    base_uom: { id: number; name: string } | null;
};
type PartnerWithOptions = { id: number; name: string };

type EditableLine = {
    key: number;
    id?: number;
    goods_model_id?: number;
    location_id?: number | null;
    expected_qty?: number;
    actual_qty?: number | null;
    lot_number?: string | null;
    serial_number?: string | null;
    expiry_date?: string | null;
    uom_name?: string;
    tracking_type?: 'NONE' | 'LOT' | 'SERIAL';
};

const GR_TRANSACTION_TYPES: GRTransactionType[] = [
    "PURCHASE", "PRODUCTION", "RETURN_FROM_CUSTOMER", "TRANSFER_IN", "ADJUSTMENT_IN"
];

// --- Main Component ---
const GRCreateEditPage: React.FC = () => {
    const navigate = useNavigate();
    const { id: grId } = useParams<{ id: string }>();
    const [form] = Form.useForm();
    const { notification } = App.useApp();
    const user = useAuthStore((state) => state.user);
    const selectedWarehouseId = Form.useWatch('warehouse_id', form);
    
    const isEditMode = !!grId;

    // --- State Management ---
    const [loading, setLoading] = useState(true);
    const [isSaving, setIsSaving] = useState(false);
    
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    const [partners, setPartners] = useState<PartnerWithOptions[]>([]);
    const [goodsModels, setGoodsModels] = useState<GoodsModelWithOptions[]>([]);
    const [locations, setLocations] = useState<Location[]>([]);

    const [lines, setLines] = useState<EditableLine[]>([]);
    const [nextKey, setNextKey] = useState(1);
    const [linesToDelete, setLinesToDelete] = useState<number[]>([]);

    // --- Data Fetching ---
    const fetchDependencies = useCallback(async () => {
        try {
            const [whRes, partnerRes, gmRes] = await Promise.all([
                supabase.from('warehouses').select('id, name').eq('is_active', true),
                supabase.from('partners').select('id, name').eq('is_active', true),
                supabase.from('goods_models').select('id, code, name, tracking_type, base_uom:uoms(id, name)').eq('is_active', true)
            ]);
            if (whRes.error) throw whRes.error;
            if (partnerRes.error) throw partnerRes.error;
            if (gmRes.error) throw gmRes.error;
            
            const models = gmRes.data as any[] || [];
            setWarehouses(whRes.data || []);
            setPartners(partnerRes.data || []);
            setGoodsModels(models);
            return models;
        } catch (error) {
            notification.error({ message: 'Error fetching dependencies', description: (error as Error).message });
            throw error;
        }
    }, [notification]);

    const fetchGrForEdit = useCallback(async (currentGoodsModels: GoodsModelWithOptions[]) => {
        if (!grId) return;
        try {
            const { data, error } = await supabase.from('goods_receipts').select('*, gr_lines(*)').eq('id', grId).single();
            if (error) throw error;
            
            form.setFieldsValue({
                ...data,
                receipt_date: data.receipt_date ? dayjs(data.receipt_date) : null,
            });

            const loadedLines = data.gr_lines.map((line, index) => {
                const model = currentGoodsModels.find(m => m.id === line.goods_model_id);
                return {
                    ...line,
                    key: -(index + 1), // Use negative keys for existing items
                    uom_name: model?.base_uom?.name || '',
                    tracking_type: model?.tracking_type,
                    expiry_date: line.expiry_date ? dayjs(line.expiry_date) : null
                };
            });
            setLines(loadedLines);
            setNextKey(1);

        } catch (error) {
             notification.error({ message: 'Error fetching Goods Receipt data', description: (error as Error).message });
             throw error;
        }
    }, [grId, form, notification]);
    
    useEffect(() => {
        const initialize = async () => {
            setLoading(true);
            try {
                const fetchedModels = await fetchDependencies();
                if (isEditMode) {
                    await fetchGrForEdit(fetchedModels);
                }
            } catch (error) {
                // Errors are handled in the fetch functions
            } finally {
                setLoading(false);
            }
        };
        initialize();
    // eslint-disable-next-line react-hooks/exhaustive-deps
    }, [isEditMode]);

    useEffect(() => {
        if (selectedWarehouseId) {
            supabase.from('locations').select('id, name').eq('warehouse_id', selectedWarehouseId).eq('is_active', true)
                .then(({ data, error }) => {
                    if (error) notification.error({ message: 'Failed to fetch locations', description: error.message });
                    else setLocations(data || []);
                });
        } else {
            setLocations([]);
        }
    }, [selectedWarehouseId, notification]);

    // --- UI Handlers for Lines ---
    const handleAddLine = () => {
        setLines(prev => [...prev, { key: nextKey, expected_qty: 1 }]);
        setNextKey(p => p + 1);
    }

    const handleLineChange = (key: number, field: keyof EditableLine, value: any) => {
        if (field === 'goods_model_id' && value && lines.some(line => line.goods_model_id === value && line.key !== key)) {
            notification.warning({ message: "Model already added. Please edit the existing line." });
            return;
        }
        setLines(currentLines => currentLines.map(line => {
            if (line.key === key) {
                const updatedLine = { ...line, [field]: value };
                if (field === 'goods_model_id') {
                    const model = goodsModels.find(m => m.id === value);
                    updatedLine.uom_name = model?.base_uom?.name;
                    updatedLine.tracking_type = model?.tracking_type;
                }
                return updatedLine;
            }
            return line;
        }));
    };
    
    const handleRemoveLine = (key: number) => {
        const lineToRemove = lines.find(l => l.key === key);
        if (lineToRemove?.id) { 
            setLinesToDelete(prev => [...prev, lineToRemove.id!]);
        }
        setLines(currentLines => currentLines.filter(line => line.key !== key));
    };

    // --- Submission Logic ---
    const handleSubmit = async (isDraft: boolean) => {
        setIsSaving(true);
        try {
            if (!user) throw new Error('You must be logged in.');
            const headerValues = await form.validateFields();
            const status = isDraft ? 'DRAFT' : 'CREATED';
    
            if (!isDraft && lines.length === 0) {
                throw new Error('Please add at least one line item.');
            }
            
            const linesData = lines
                .filter(l => l.goods_model_id && l.expected_qty && l.expected_qty > 0)
                .map(l => ({
                    id: l.id,
                    goods_model_id: l.goods_model_id!,
                    location_id: l.location_id || null,
                    expected_qty: l.expected_qty!,
                    actual_qty: l.actual_qty ?? 0,
                    lot_number: l.lot_number || null,
                    serial_number: l.serial_number || null,
                    expiry_date: l.expiry_date ? dayjs(l.expiry_date).format('YYYY-MM-DD') : null,
                }));
            
            if (!isDraft && linesData.length === 0) {
                throw new Error('All line items must have a Goods Model and a valid Expected Quantity.');
            }
    
            if (