import React, { useEffect, useState } from 'react';
import { App, Button, Card, Form, Input, Spin, Switch, Space, Select, Row, Col, Affix } from 'antd';
import { SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { warehouseAPI, branchAPI } from '../../../utils/apiClient';
import { Database } from '../../../types/supabase';

type WarehouseInsert = Database['master']['Tables']['warehouses']['Insert'];
type WarehouseUpdate = Database['master']['Tables']['warehouses']['Update'];
type Branch = Database['master']['Tables']['branches']['Row'];

const WarehouseFormPage: React.FC = () => {
    const [form] = Form.useForm();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { notification } = App.useApp();

    const [loading, setLoading] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [branches, setBranches] = useState<Pick<Branch, 'id' | 'name'>[]>([]);

    useEffect(() => {
        setIsEdit(!!id);
        const fetchData = async () => {
            setLoading(true);
            try {
                const branchList = await branchAPI.list();
                setBranches(branchList || []);
                
                if (id) {
                    const data = await warehouseAPI.get(id);
                    if (data) {
                      form.setFieldsValue(data);
                    }
                } else {
                    form.resetFields();
                    form.setFieldsValue({ is_active: true });
                }
            } catch (error: any) {
                notification.error({ message: 'Error fetching data', description: error.message });
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [id, form, notification]);

    const onFinish = async (values: any) => {
        setLoading(true);
        try {
            if (isEdit) {
                await warehouseAPI.update(id!, values as WarehouseUpdate);
                notification.success({ message: 'Success', description: 'Warehouse updated successfully.' });
            } else {
                await warehouseAPI.create(values as WarehouseInsert);
                notification.success({ message: 'Success', description: 'Warehouse created successfully.' });
            }
            navigate('/master-data/warehouses');
        } catch (error: any) {
            notification.error({ message: 'Operation Failed', description: error.message });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Spin spinning={loading}>
            <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ is_active: true }}>
                <Card title={isEdit ? 'Edit Warehouse' : 'Create Warehouse'}>
                     {isEdit && (
                        <Row gutter={16}>
                            <Col xs={24} sm={12}>
                                <Form.Item name="code" label="Warehouse Code">
                                    <Input disabled style={{ cursor: 'not-allowed', backgroundColor: '#f5f5f5' }} />
                                </Form.Item>
                            </Col>
                        </Row>
                    )}

                    <Form.Item name="branch_id" label="Branch" rules={[{ required: true, message: 'Please select a branch' }]}>
                        <Select
                            showSearch
                            placeholder="Select a branch"
                            optionFilterProp="children"
                            filterOption={(input, option) => (option?.label ?? '').toLowerCase().includes(input.toLowerCase())}
                            options={branches.map(b => ({ value: b.id, label: b.name }))}
                        />
                    </Form.Item>

                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item name="name" label="Warehouse Name (Vietnamese)" rules={[{ required: true, message: 'Please enter the warehouse name' }]}>
                                <Input placeholder="e.g., Kho Trung tâm Sóng Thần" />
                            </Form.Item>
                        </Col>
                        <Col xs={24} sm={12}>
                             <Form.Item name="name_en" label="Warehouse Name (English)">
                                <Input placeholder="e.g., Song Than Central Warehouse" />
                            </Form.Item>
                        </Col>
                    </Row>
                    
                     <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item name="manager_name" label="Manager Name">
                                <Input placeholder="e.g., Nguyễn Văn A" />
                            </Form.Item>
                        </Col>
                         <Col xs={24} sm={12}>
                            <Form.Item name="phone" label="Warehouse Phone">
                                <Input placeholder="e.g., (+84) 909 123 456" />
                            </Form.Item>
                        </Col>
                    </Row>
                    
                    <Row gutter={16}>
                        <Col xs={24} sm={12}>
                            <Form.Item name="email" label="Warehouse Email" rules={[{ type: 'email' }]}>
                                <Input placeholder="e.g., kho.st@abccorp.vn" />
                            </Form.Item>
                        </Col>
                    </Row>

                    <Row gutter={16}>
                        <Col span={24}>
                             <Form.Item name="address" label="Address">
                                <Input.TextArea rows={3} placeholder="Full address of the warehouse" />
                            </Form.Item>
                        </Col>
                    </Row>
                    
                    <Row gutter={16}>
                        <Col span={24}>
                             <Form.Item name="description" label="Description / Notes">
                                <Input.TextArea rows={3} placeholder="Any additional notes about the warehouse" />
                            </Form.Item>
                        </Col>
                    </Row>

                    {isEdit && (
                        <Form.Item name="is_active" label="Status" valuePropName="checked">
                            <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                        </Form.Item>
                    )}
                </Card>

                <Affix offsetBottom={0}>
                    <Card className="mt-4 p-0 border-t">
                        <Row justify="end">
                            <Col>
                                <Space>
                                    <Button icon={<CloseOutlined />} onClick={() => navigate('/master-data/warehouses')}>
                                        Cancel
                                    </Button>
                                    <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                                        {isEdit ? 'Save Changes' : 'Create Warehouse'}
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

const WarehouseFormPageWrapper: React.FC = () => (
    <App><WarehouseFormPage /></App>
);

export default WarehouseFormPageWrapper;