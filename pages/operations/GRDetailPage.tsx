
import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { GoodsReceipt, GRLine } from '../../types/supabase';
import {
    Button, Card, Row, Col, Typography, Space, App, Spin, Descriptions, Tag, Alert, Table
} from 'antd';
import { EditOutlined, DeleteOutlined, RollbackOutlined } from '@ant-design/icons';
import { format } from 'date-fns';
import PageHeader from '../../components/layout/PageHeader';

const { Text } = Typography;

type GRWithDetails = GoodsReceipt & {
    warehouse: { name: string } | null;
    gr_lines: (GRLine & {
        goods_model: {
            name: string;
            code: string;
            base_uom: { name: string } | null;
        } | null;
    })[];
};

const GRDetailPageContent: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { notification, modal } = App.useApp();

    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const [goodsReceipt, setGoodsReceipt] = useState<GRWithDetails | null>(null);

    const fetchData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const { data, error } = await supabase
                .from('goods_receipts')
                .select(`
                    *,
                    warehouse:warehouses(name),
                    gr_lines(*, goods_model:goods_models(name, code, base_uom:uoms(name)))
                `)
                .eq('id', id)
                .single();
            if (error) throw error;
            if (data) {
                setGoodsReceipt(data as GRWithDetails);
            } else {
                throw new Error("Goods Receipt not found");
            }
        } catch (err: any) {
            setError(err.message);
            notification.error({ message: "Error fetching data", description: err.message });
        } finally {
            setLoading(false);
        }
    }, [id, notification]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);
    
    const handleDelete = () => {
        if (!id) return;
        modal.confirm({
            title: 'Are you sure?',
            content: 'This will delete the goods receipt and all its lines. This action cannot be undone.',
            okText: 'Yes, delete it',
            okType: 'danger',
            onOk: async () => {
                try {
                    const { error } = await supabase.from('goods_receipts').delete().eq('id', id);
                    if (error) throw error;
                    notification.success({ message: 'Goods Receipt deleted successfully' });
                    navigate('/operations/gr');
                } catch (error: any) {
                    notification.error({ message: 'Failed to delete', description: error.message });
                }
            },
        });
    };

    const lineColumns = [
        { title: 'No.', dataIndex: 'index', render: (_:any, __:any, index: number) => index + 1, width: 50 },
        { title: 'Goods Model', dataIndex: ['goods_model', 'name'], key: 'goods_model' },
        { title: 'Expected Qty', dataIndex: 'expected_qty', key: 'expected_qty', align: 'right' as const },
        { title: 'Received Qty', dataIndex: 'received_qty', key: 'received_qty', align: 'right' as const, render: (qty: number) => qty || 0 },
        { title: 'UoM', dataIndex: ['goods_model', 'base_uom', 'name'], key: 'uom' },
        { title: 'Lot/Serial', key: 'lot_serial', render: (_: any, record: GRLine) => record.lot_number || record.serial_number || '-' },
    ];
    
    if (loading) {
        return <div className="flex justify-center items-center h-full"><Spin size="large" /></div>;
    }

    if (error) {
        return <Alert message="Error" description={error} type="error" showIcon />;
    }
    
    const pageActions = (
        <Space>
            <Button icon={<RollbackOutlined />} onClick={() => navigate('/operations/gr')}>Back to List</Button>
            <Button icon={<EditOutlined />} onClick={() => navigate(`/operations/gr/${id}/edit`)}>Edit</Button>
            <Button icon={<DeleteOutlined />} danger onClick={handleDelete}>Delete</Button>
        </Space>
    );

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <PageHeader 
                title={goodsReceipt?.reference_number || 'Goods Receipt Details'}
                description={`Details for GR ID: ${id}`}
                actions={pageActions}
            />
            <Card>
                <Descriptions bordered column={2}>
                    <Descriptions.Item label="Reference Number">{goodsReceipt?.reference_number}</Descriptions.Item>
                    <Descriptions.Item label="Partner">{goodsReceipt?.partner_name || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Warehouse">{goodsReceipt?.warehouse?.name || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Status">
                        <Tag>{goodsReceipt?.status}</Tag>
                    </Descriptions.Item>
                    <Descriptions.Item label="Notes" span={2}>{goodsReceipt?.notes || '-'}</Descriptions.Item>
                </Descriptions>
            </Card>
            <Card title="Line Items">
                <Table
                    columns={lineColumns}
                    dataSource={goodsReceipt?.gr_lines}
                    rowKey="id"
                    pagination={false}
                    bordered
                    size="small"
                />
            </Card>
        </Space>
    );
};

const GRDetailPage: React.FC = () => (
    <App><GRDetailPageContent /></App>
);

export default GRDetailPage;