import React, { useEffect, useState } from 'react';
// FIX: Import `Space` from antd to resolve reference errors.
import { App, Button, Card, Form, Input, Spin, Select, Row, Col, Affix, DatePicker, Typography, Alert, Space } from 'antd';
import { SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import { warehouseAPI, inventoryAPI } from '../../../utils/apiClient';
import { transactionsClient } from '../../../lib/supabase';
import { Database } from '../../../types/supabase';
import { useUserProfile } from '../../../hooks/useUserProfile';
import dayjs from 'dayjs';

type ICHeaderInsert = Database['transactions']['Tables']['ic_header']['Insert'];
type ICLineInsert = Database['transactions']['Tables']['ic_lines']['Insert'];
type Warehouse = Database['master']['Tables']['warehouses']['Row'];

const ICCreatePage: React.FC = () => {
    const [form] = Form.useForm();
    const navigate = useNavigate();
    const { notification } = App.useApp();
    const { profile, loading: profileLoading } = useUserProfile();

    const [loading, setLoading] = useState(false);
    const [warehouses, setWarehouses] = useState<Warehouse[]>([]);
    
    useEffect(() => {
        const fetchWarehouses = async () => {
            setLoading(true);
            try {
                const whRes = await warehouseAPI.list();
                setWarehouses(whRes || []);
                form.setFieldsValue({ count_date: dayjs() });
            } catch (error: any) {
                notification.error({ message: 'Error fetching warehouses', description: error.message });
            } finally {
                setLoading(false);
            }
        };
        fetchWarehouses();
    }, [form, notification]);

    const handleSubmit = async () => {
        if (!profile?.organization_uuid || !profile.id) {
            notification.error({ message: 'Error', description: 'User profile and organization are required.' });
            return;
        }

        try {
            const values = await form.validateFields();
            setLoading(true);

            // Step A: Create the Inventory Count Header
            // FIX: Added the required 'code' property to the header payload.
            // A temporary code is generated; the backend might have a trigger to override it with a sequential one.
            const headerPayload: ICHeaderInsert = {
                code: `IC-${Date.now()}`,
                warehouse_id: values.warehouse_id,
                count_date: dayjs(values.count_date).toISOString(),
                notes: values.notes,
                status: 'CREATED',
                organization_id: profile.organization_uuid,
                created_by: profile.id,
            };
            
            const { data: header, error: headerError } = await transactionsClient
                .from('ic_header')
                .insert(headerPayload)
                .select()
                .single();
            
            if (headerError) throw new Error(`Failed to create IC header: ${headerError.message}`);
            if (!header) throw new Error('Could not retrieve created IC header.');
            
            // Step B: Get a snapshot of all onhand inventory for the warehouse
            // FIX: Corrected the API call. `inventoryAPI.list()` returns the data array directly or throws an error.
            const stockSnapshot = await inventoryAPI.list();
            
            const warehouseStock = stockSnapshot.filter(s => s.warehouse_id === values.warehouse_id && s.quantity_onhand > 0);
            
            if (warehouseStock.length === 0) {
                 notification.warning({
                    message: 'No Stock Found',
                    description: 'Inventory Count created, but no on-hand stock was found in the selected warehouse to count.',
                });
                navigate('/operations/ic');
                return;
            }

            // Step C: Create the Inventory Count Lines from the snapshot
            const linesPayload: ICLineInsert[] = warehouseStock.map((item, index) => ({
                ic_header_id: header.id,
                location_id: item.location_id,
                goods_model_id: item.goods_model_id,
                lot_number: item.lot_number,
                serial_number: item.serial_number,
                system_quantity: item.quantity_onhand,
                line_number: index + 1,
            }));
            
            const { error: linesError } = await transactionsClient.from('ic_lines').insert(linesPayload);
            if (linesError) throw new Error(`Failed to create IC lines: ${linesError.message}`);

            notification.success({ message: 'Success', description: `Inventory Count ${header.code} created with ${linesPayload.length} lines.` });
            navigate('/operations/ic');

        } catch (error: any) {
            notification.error({ message: 'Operation Failed', description: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Spin spinning={loading || profileLoading}>
            <Form form={form} layout="vertical" onFinish={handleSubmit}>
                <Card title="Create Inventory Count" className="mb-4">
                    <Row gutter={16}>
                        <Col span={12}>
                            <Form.Item name="warehouse_id" label="Warehouse" rules={[{ required: true }]}>
                                <Select showSearch placeholder="Select Warehouse" options={warehouses.map(w => ({ value: w.id, label: w.name }))} />
                            </Form.Item>
                        </Col>
                        <Col span={12}>
                            <Form.Item name="count_date" label="Count Date" rules={[{ required: true }]}>
                                <DatePicker style={{ width: '100%' }} />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Row gutter={16}>
                        <Col span={24}>
                            <Form.Item name="notes" label="Notes">
                                <Input.TextArea rows={3} placeholder="Enter any notes for this count" />
                            </Form.Item>
                        </Col>
                    </Row>
                    <Alert
                        message="Full Warehouse Count"
                        description="This action will create an inventory count task for all items currently in stock at the selected warehouse."
                        type="info"
                        showIcon
                    />
                </Card>
                
                <Affix offsetBottom={0}>
                    <Card className="mt-4 p-0 border-t">
                        <Row justify="end">
                            <Col>
                                <Space>
                                    <Button danger icon={<CloseOutlined />} onClick={() => navigate('/operations/ic')}>
                                        Cancel
                                    </Button>
                                    <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                                        Create Inventory Count
                                    </Button>
                                </Space>
                            </Col>
                        </Row>
                    </Card>
                </Affix>
            </Form>
        </Spin>
    );
};

const ICCreatePageWrapper: React.FC = () => (
    <App><ICCreatePage /></App>
);

export default ICCreatePageWrapper;