import React, { useEffect, useState, useMemo } from 'react';
import { App, Button, Card, Form, Input, Spin, Switch, Space, Row, Col, Select } from 'antd';
import { SaveOutlined, CloseOutlined } from '@ant-design/icons';
import { useNavigate, useParams } from 'react-router-dom';
import { goodsTypeAPI } from '../../../utils/apiClient';
import { Database } from '../../../types/supabase';
import { useUserProfile } from '../../../hooks/useUserProfile';

type GoodsType = Database['master']['Tables']['goods_types']['Row'];
type GoodsTypeInsert = Database['master']['Tables']['goods_types']['Insert'];
type GoodsTypeUpdate = Database['master']['Tables']['goods_types']['Update'];

const GoodsTypeFormPage: React.FC = () => {
    const [form] = Form.useForm();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const { notification } = App.useApp();
    const { profile, loading: profileLoading } = useUserProfile();

    const [loading, setLoading] = useState(false);
    const [isEdit, setIsEdit] = useState(false);
    const [allGoodsTypes, setAllGoodsTypes] = useState<GoodsType[]>([]);

    useEffect(() => {
        setIsEdit(!!id);
        const fetchData = async () => {
            setLoading(true);
            try {
                const typesData = await goodsTypeAPI.list();
                setAllGoodsTypes(typesData as GoodsType[]);
                
                if (id) {
                    const data = await goodsTypeAPI.get(id);
                    form.setFieldsValue(data);
                } else {
                    form.resetFields();
                    form.setFieldsValue({ is_active: true });
                }
            } catch(error: any) {
                notification.error({ message: 'Error fetching data', description: error.message });
            } finally {
                setLoading(false);
            }
        };

        fetchData();
    }, [id, form, notification]);

    const onFinish = async (values: any) => {
        if (!profile?.organization_id) {
            notification.error({ message: 'Error', description: 'User organization not found.' });
            return;
        }
        setLoading(true);
        const payload = {
            ...values,
            organization_id: profile.organization_id.toString(),
        };
        try {
            if (isEdit) {
                await goodsTypeAPI.update(id!, payload as GoodsTypeUpdate);
                notification.success({ message: 'Success', description: 'Goods Type updated successfully.' });
            } else {
                await goodsTypeAPI.create(payload as GoodsTypeInsert);
                notification.success({ message: 'Success', description: 'Goods Type created successfully.' });
            }
            navigate('/master-data/goods-types');
        } catch (error: any) {
            notification.error({ message: 'Error', description: error.message });
        } finally {
            setLoading(false);
        }
    };
    
    const getDescendantIds = useMemo(() => {
        const map = new Map<string, string[]>();
        allGoodsTypes.forEach(gt => {
            if (gt.parent_id) {
                if (!map.has(gt.parent_id)) map.set(gt.parent_id, []);
                map.get(gt.parent_id)!.push(gt.id);
            }
        });

        return (parentId: string): string[] => {
            const descendants: string[] = [];
            const queue = [parentId];
            while (queue.length > 0) {
                const currentId = queue.shift()!;
                const children = map.get(currentId);
                if (children) {
                    descendants.push(...children);
                    queue.push(...children);
                }
            }
            return descendants;
        };
    }, [allGoodsTypes]);

    const potentialParents = useMemo(() => {
        if (!isEdit || !id) return allGoodsTypes;
        
        const descendantIds = getDescendantIds(id);
        const disabledIds = new Set([id, ...descendantIds]);
        return allGoodsTypes.filter(gt => !disabledIds.has(gt.id));
    }, [id, isEdit, allGoodsTypes, getDescendantIds]);

    const isReady = !profileLoading && (isEdit || !!profile);

    const ParentSelector = (
        <Form.Item name="parent_id" label="Parent Goods Type">
            <Select
                showSearch
                allowClear
                placeholder="Select a parent"
                optionFilterProp="label"
                options={potentialParents.map(gt => ({ value: gt.id, label: `${gt.name} (${gt.code})` }))}
            />
        </Form.Item>
    );

    return (
        <Card title={isEdit ? 'Edit Goods Type' : 'Create Goods Type'}>
            <Spin spinning={loading || profileLoading}>
                {isReady ? (
                    <Form form={form} layout="vertical" onFinish={onFinish} initialValues={{ is_active: true }}>
                        <Row gutter={16}>
                            {isEdit && (
                                <Col span={12}>
                                    <Form.Item name="code" label="Code">
                                        <Input disabled />
                                    </Form.Item>
                                </Col>
                            )}
                            <Col span={isEdit ? 12 : 12}>
                                <Form.Item name="name" label="Name" rules={[{ required: true }]}>
                                    <Input />
                                </Form.Item>
                            </Col>
                            {!isEdit && (
                                <Col span={12}>
                                    {ParentSelector}
                                </Col>
                            )}
                        </Row>

                        {isEdit && (
                             <Row gutter={16}>
                                <Col span={12}>
                                   {ParentSelector}
                                </Col>
                                <Col span={12}>
                                    <Form.Item name="is_active" label="Status" valuePropName="checked">
                                        <Switch checkedChildren="Active" unCheckedChildren="Inactive" />
                                    </Form.Item>
                                </Col>
                            </Row>
                        )}

                        <Form.Item name="description" label="Description">
                            <Input.TextArea rows={3} placeholder="Enter a description for the goods type" />
                        </Form.Item>

                        <Form.Item>
                            <Row justify="end">
                                <Col>
                                    <Space>
                                        <Button type="primary" htmlType="submit" icon={<SaveOutlined />} loading={loading}>
                                            {isEdit ? 'Save Changes' : 'Create'}
                                        </Button>
                                        <Button icon={<CloseOutlined />} onClick={() => navigate('/master-data/goods-types')}>
                                            Cancel
                                        </Button>
                                    </Space>
                                </Col>
                            </Row>
                        </Form.Item>
                    </Form>
                ) : (
                    <div>Loading user profile...</div>
                )}
            </Spin>
        </Card>
    );
};

const GoodsTypeFormPageWrapper: React.FC = () => (
    <App><GoodsTypeFormPage /></App>
);

export default GoodsTypeFormPageWrapper;