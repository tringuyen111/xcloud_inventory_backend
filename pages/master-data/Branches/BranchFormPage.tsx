


import React, { useEffect, useState, useCallback } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import {
    App,
    Button,
    Card,
    Col,
    Form,
    Input,
    Row,
    Spin,
    Typography,
    Space,
    Select,
} from 'antd';
import { SaveOutlined, PlusOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import { useDebounce } from '../../../hooks/useDebounce';

const { Title } = Typography;

interface OrgOption {
    label: string;
    value: string;
}

const BranchFormPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const { notification } = App.useApp();
    const { user } = useAuth();

    const [loading, setLoading] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [pageTitle, setPageTitle] = useState<string>('Tạo mới Chi nhánh');
    
    const [orgOptions, setOrgOptions] = useState<OrgOption[]>([]);
    const [orgSearchText, setOrgSearchText] = useState('');
    const [isSearchingOrgs, setIsSearchingOrgs] = useState(false);
    const debouncedOrgSearch = useDebounce(orgSearchText, 500);

    const isEditMode = !!id;

    const fetchOrganizations = useCallback(async (searchText: string) => {
        setIsSearchingOrgs(true);
        try {
            const { data, error } = await supabase.rpc('get_organizations_list', {
                p_search_text: searchText,
                p_page_number: 1,
                p_page_size: 20
            });

            if (error) throw error;
            
            const orgs = (data as any)?.data || [];
            const newOptions = orgs.map((org: { id: number; name: string }) => ({
                label: org.name,
                value: org.id.toString(),
            }));
            
            // Use functional update to intelligently merge new search results 
            // with any existing important options (like the one selected in edit mode).
            setOrgOptions(currentOptions => {
                const combined = [...currentOptions, ...newOptions];
                // Remove duplicates by creating a Map. The last item with a given key (value) is kept.
                const uniqueOptions = Array.from(new Map(combined.map(item => [item.value, item])).values());
                return uniqueOptions;
            });

        } catch (error: any) {
            notification.error({ message: 'Lỗi tải danh sách tổ chức', description: error.message });
        } finally {
            setIsSearchingOrgs(false);
        }
    }, [notification]);

    // This single useEffect now handles both the initial data load (when debouncedOrgSearch is '')
    // and subsequent searches.
    useEffect(() => {
        fetchOrganizations(debouncedOrgSearch);
    }, [debouncedOrgSearch, fetchOrganizations]);

    useEffect(() => {
        if (isEditMode) {
            setPageTitle('Chỉnh sửa Chi nhánh');
            const fetchBranch = async () => {
                setLoading(true);
                const { data, error } = await supabase
                    .from('branches')
                    .select('*, organization:organizations(id, name)')
                    .eq('id', id)
                    .single();
                
                if (error) {
                    notification.error({
                        message: 'Error Fetching Branch',
                        description: error.message,
                    });
                    navigate('/master-data/branches');
                } else if (data) {
                    const formData = {
                        ...data,
                        organization_id: data.organization_id?.toString(),
                    };
                    form.setFieldsValue(formData);
                    
                    // Pre-populate the options with the current organization to ensure it's
                    // available in the dropdown, even before the full list loads.
                    if (data.organization) {
                        const selectedOrgOption = { label: data.organization.name, value: data.organization.id.toString() };
                        setOrgOptions([selectedOrgOption]);
                    }
                    setPageTitle(`Chỉnh sửa Chi nhánh: ${data.code}`);
                }
                setLoading(false);
            };
            fetchBranch();
        }
    }, [id, isEditMode, navigate, form, notification]);

    const onFinish = async (values: any) => {
        setSubmitting(true);
        const payload = {
            ...values,
            organization_id: parseInt(values.organization_id, 10),
            ...(isEditMode 
                ? { updated_by: user?.id, updated_at: new Date().toISOString() } 
                : { created_by: user?.id })
        };
        
        try {
            if (isEditMode) {
                const { error } = await supabase
                    .from('branches')
                    .update(payload)
                    .eq('id', id);
                if (error) throw error;
            } else {
                const { error } = await supabase
                    .from('branches')
                    .insert(payload);
                if (error) throw error;
            }
            
            notification.success({
                message: `Chi nhánh đã được ${isEditMode ? 'cập nhật' : 'tạo'} thành công`,
            });
            navigate('/master-data/branches');

        } catch (error: any) {
            if (error.code === '23505' && error.message.includes('branches_organization_id_code_key')) {
               form.setFields([
                   {
                       name: 'code',
                       errors: ['Mã chi nhánh này đã tồn tại trong tổ chức đã chọn.'],
                   },
               ]);
           } else {
               notification.error({
                   message: `Lỗi ${isEditMode ? 'cập nhật' : 'tạo'} chi nhánh`,
                   description: error.message,
               });
           }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="pb-24">
            <Spin spinning={loading}>
                <Form
                    id="branch-form"
                    form={form}
                    layout="vertical"
                    onFinish={onFinish}
                >
                    <Card
                        title={<Title level={4} style={{ margin: 0 }}>{pageTitle}</Title>}
                    >
                        <Row gutter={24}>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    name="organization_id"
                                    label="Tổ chức"
                                    rules={[{ required: true, message: 'Tổ chức là bắt buộc' }]}
                                >
                                    <Select
                                        showSearch
                                        placeholder="Chọn hoặc tìm kiếm tổ chức..."
                                        defaultActiveFirstOption={false}
                                        filterOption={false}
                                        onSearch={(value) => setOrgSearchText(value)}
                                        loading={isSearchingOrgs}
                                        notFoundContent={isSearchingOrgs ? <Spin size="small" /> : null}
                                        options={orgOptions}
                                        disabled={isEditMode}
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item
                                    name="code"
                                    label="Mã chi nhánh"
                                    rules={[
                                        { required: true, message: 'Mã là bắt buộc' },
                                        { min: 2, message: 'Mã phải có ít nhất 2 ký tự' }
                                    ]}
                                >
                                    <Input placeholder="e.g., HCM-01" disabled={isEditMode} />
                                </Form.Item>
                            </Col>
                             <Col xs={24} md={12}>
                                 <Form.Item
                                    name="name"
                                    label="Tên chi nhánh"
                                    rules={[
                                        { required: true, message: 'Tên là bắt buộc' },
                                        { min: 2, message: 'Tên phải có ít nhất 2 ký tự' }
                                    ]}
                                >
                                    <Input placeholder="e.g., Chi nhánh Hồ Chí Minh" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item name="phone" label="Số điện thoại">
                                    <Input placeholder="e.g., (123) 456-7890" />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item name="address" label="Địa chỉ">
                                    <Input.TextArea rows={2} placeholder="Nhập địa chỉ đầy đủ" />
                                </Form.Item>
                            </Col>
                             <Col span={24}>
                                <Form.Item name="notes" label="Ghi chú">
                                    <Input.TextArea rows={3} placeholder="Ghi chú bổ sung" />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Card>
                </Form>
            </Spin>

            <div className="fixed bottom-6 right-6 z-50">
                <Space>
                    <Button
                        size="large"
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate('/master-data/branches')}
                    >
                        Hủy
                    </Button>
                    <Button
                        size="large"
                        type="primary"
                        icon={isEditMode ? <SaveOutlined /> : <PlusOutlined />}
                        htmlType="submit"
                        loading={submitting}
                        form="branch-form"
                    >
                        {isEditMode ? 'Lưu' : 'Tạo mới'}
                    </Button>
                </Space>
            </div>
        </div>
    );
};

const BranchFormPageWrapper: React.FC = () => (
    <App>
        <BranchFormPage />
    </App>
);

export default BranchFormPageWrapper;