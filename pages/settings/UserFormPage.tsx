

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
import { supabase } from '../../lib/supabase';
import { useAuth } from '../../hooks/useAuth';
import { useDebounce } from '../../hooks/useDebounce';

const { Title } = Typography;

interface SelectOption {
    label: string;
    value: string;
}

const UserFormPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const { notification } = App.useApp();
    const { session } = useAuth();

    const [loading, setLoading] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [pageTitle, setPageTitle] = useState<string>('Tạo mới Người dùng');
    
    // State for Async Selects
    const [roleOptions, setRoleOptions] = useState<SelectOption[]>([]);
    const [orgOptions, setOrgOptions] = useState<SelectOption[]>([]);
    const [warehouseOptions, setWarehouseOptions] = useState<SelectOption[]>([]);

    const [isSearchingRoles, setIsSearchingRoles] = useState(false);
    const [isSearchingOrgs, setIsSearchingOrgs] = useState(false);
    const [isSearchingWarehouses, setIsSearchingWarehouses] = useState(false);
    
    const [roleSearchText, setRoleSearchText] = useState('');
    const [orgSearchText, setOrgSearchText] = useState('');
    const [warehouseSearchText, setWarehouseSearchText] = useState('');

    const debouncedRoleSearch = useDebounce(roleSearchText, 500);
    const debouncedOrgSearch = useDebounce(orgSearchText, 500);
    const debouncedWarehouseSearch = useDebounce(warehouseSearchText, 500);

    const isEditMode = !!id;

    // Generic RPC fetcher for dropdowns
    const fetchDropdownData = useCallback(async (
        rpcName: 'get_roles_list' | 'get_organizations_list' | 'get_warehouses_list' | 'get_branches_list',
        searchText: string,
        setOptions: React.Dispatch<React.SetStateAction<SelectOption[]>>,
        setIsSearching: React.Dispatch<React.SetStateAction<boolean>>
    ) => {
        setIsSearching(true);
        try {
            const { data, error } = await supabase.rpc(rpcName as any, {
                p_search_text: searchText || null,
                p_page_number: 1,
                p_page_size: 50,
            });

            if (error) throw error;
            
            const items = (data as any)?.data || [];
            const newOptions = items.map((item: { id: number | string; name: string }) => ({
                label: item.name,
                value: item.id.toString(),
            }));
            
            setOptions(currentOptions => {
                const combined = [...currentOptions, ...newOptions];
                return Array.from(new Map(combined.map(item => [item.value, item])).values());
            });

        } catch (error: any) {
            notification.error({ message: `Lỗi tải danh sách cho ${rpcName}`, description: error.message });
        } finally {
            setIsSearching(false);
        }
    }, [notification]);

    // Effects for dropdown searching
    useEffect(() => { fetchDropdownData('get_roles_list', debouncedRoleSearch, setRoleOptions, setIsSearchingRoles); }, [debouncedRoleSearch, fetchDropdownData]);
    useEffect(() => { fetchDropdownData('get_organizations_list', debouncedOrgSearch, setOrgOptions, setIsSearchingOrgs); }, [debouncedOrgSearch, fetchDropdownData]);
    useEffect(() => { fetchDropdownData('get_warehouses_list', debouncedWarehouseSearch, setWarehouseOptions, setIsSearchingWarehouses); }, [debouncedWarehouseSearch, fetchDropdownData]);

    // Effect for fetching user details in edit mode
    useEffect(() => {
        if (isEditMode) {
            setPageTitle('Chỉnh sửa Người dùng');
            const fetchUserDetails = async () => {
                setLoading(true);
                try {
                    const { data: userData, error: userError } = await supabase.from('users').select('*').eq('id', id).single();
                    if(userError) throw userError;
                    
                    const [roleRes, orgRes, whRes] = await Promise.all([
                         supabase.from('user_roles').select('role_id, roles(name)').eq('user_id', id).single(),
                         supabase.from('user_organizations').select('organization_id, organizations(name)').eq('user_id', id).single(),
                         supabase.from('user_warehouses').select('warehouse_id, warehouses(name)').eq('user_id', id).single(),
                    ]);

                    const role_id = roleRes.data?.role_id;
                    const organization_id = orgRes.data?.organization_id;
                    const warehouse_id = whRes.data?.warehouse_id;

                    form.setFieldsValue({ ...userData, role_id: role_id?.toString(), organization_id: organization_id?.toString(), warehouse_id: warehouse_id?.toString() });

                     if (role_id && roleRes.data?.roles) setRoleOptions([{ value: role_id.toString(), label: roleRes.data.roles.name }]);
                     if (organization_id && orgRes.data?.organizations) setOrgOptions([{ value: organization_id.toString(), label: orgRes.data.organizations.name }]);
                     if (warehouse_id && whRes.data?.warehouses) setWarehouseOptions([{ value: warehouse_id.toString(), label: whRes.data.warehouses.name }]);

                    setPageTitle(`Chỉnh sửa: ${userData.full_name}`);
                } catch (fallbackError: any) {
                    notification.error({ message: 'Lỗi tải thông tin người dùng', description: fallbackError.message });
                    navigate('/settings/users');
                } finally {
                    setLoading(false);
                }
            };
            fetchUserDetails();
        }
    }, [id, isEditMode, navigate, form, notification]);

    // Form submission handler
    const onFinish = async (values: any) => {
        setSubmitting(true);
        
        if (!session) {
            notification.error({ message: 'Authentication Error', description: 'No active session found. Please log in again.' });
            setSubmitting(false);
            return;
        }

        try {
            if (isEditMode) {
                // Call update Edge Function for existing users
                const { error } = await supabase.functions.invoke('update-user-details', {
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                    },
                    body: {
                        user_id: id,
                        full_name: values.full_name,
                        phone: values.phone || null,
                        role_id: values.role_id ? parseInt(values.role_id, 10) : null,
                        organization_id: values.organization_id ? parseInt(values.organization_id, 10) : null,
                        warehouse_id: values.warehouse_id ? parseInt(values.warehouse_id, 10) : null,
                    }
                });
                if (error) throw error;

            } else {
                // Call create Edge Function for new users
                const { data, error } = await supabase.functions.invoke('create-auth-user', {
                    headers: {
                        Authorization: `Bearer ${session.access_token}`,
                    },
                    body: { 
                        email: values.email,
                        password: values.password,
                        full_name: values.full_name,
                        phone: values.phone || null,
                        role_id: values.role_id ? parseInt(values.role_id, 10) : null,
                        organization_id: values.organization_id ? parseInt(values.organization_id, 10) : null,
                        warehouse_id: values.warehouse_id ? parseInt(values.warehouse_id, 10) : null,
                    },
                });

                if (error) throw error;
                if (data.error) throw new Error(data.error);
            }
            
            notification.success({ message: `Người dùng đã được ${isEditMode ? 'cập nhật' : 'tạo'} thành công` });
            navigate('/settings/users');

        } catch (error: any) {
             const errorMessage = error.message || (error.details ? JSON.stringify(error.details) : 'An unknown error occurred.');
             if (errorMessage.includes('User already registered') || errorMessage.includes('duplicate key value violates unique constraint "users_email_key"') || errorMessage.includes('Email có thể đã tồn tại')) {
                form.setFields([{ name: 'email', errors: ['Email này đã tồn tại.'] }]);
            } else {
               notification.error({ message: `Lỗi ${isEditMode ? 'cập nhật' : 'tạo'} người dùng`, description: errorMessage });
           }
        } finally {
            setSubmitting(false);
        }
    };
    
    return (
        <div className="pb-24">
            <Spin spinning={loading}>
                <Form id="user-form" form={form} layout="vertical" onFinish={onFinish}>
                    <Card title={<Title level={4} style={{ margin: 0 }}>{pageTitle}</Title>}>
                        <Row gutter={24}>
                            <Col xs={24} md={12}>
                                <Form.Item name="full_name" label="Họ và Tên" rules={[{ required: true, message: 'Tên là bắt buộc', min: 2 }]}>
                                    <Input placeholder="e.g., John Doe" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item name="email" label="Email đăng nhập" rules={[{ required: true, type: 'email', message: 'Email không hợp lệ' }]}>
                                    <Input placeholder="e.g., user@example.com" disabled={isEditMode} />
                                </Form.Item>
                            </Col>
                            
                            {!isEditMode && (
                                <Col xs={24} md={12}>
                                    <Form.Item name="password" label="Mật khẩu" rules={[{ required: true, message: 'Mật khẩu phải ít nhất 8 ký tự', min: 8 }]}>
                                        <Input.Password placeholder="Ít nhất 8 ký tự" />
                                    </Form.Item>
                                </Col>
                            )}

                            <Col xs={24} md={12}>
                                <Form.Item name="phone" label="Số điện thoại">
                                    <Input placeholder="e.g., 0987654321" />
                                </Form.Item>
                            </Col>

                            <Col xs={24} md={12}>
                                <Form.Item name="role_id" label="Vai trò" rules={[{ required: true, message: 'Vai trò là bắt buộc' }]}>
                                    <Select
                                        showSearch placeholder="Chọn vai trò..." onSearch={setRoleSearchText}
                                        loading={isSearchingRoles} filterOption={false} options={roleOptions}
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item name="organization_id" label="Tổ chức">
                                    <Select
                                        showSearch allowClear placeholder="Chọn tổ chức..." onSearch={setOrgSearchText}
                                        loading={isSearchingOrgs} filterOption={false} options={orgOptions}
                                    />
                                </Form.Item>
                            </Col>
                             <Col xs={24} md={12}>
                                <Form.Item name="branch_id" label="Chi nhánh (Nếu có)">
                                    <Select
                                        showSearch allowClear placeholder="Chọn chi nhánh..." onSearch={() => {}} // Placeholder
                                        loading={false} filterOption={false} options={[]}
                                    />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item name="warehouse_id" label="Kho (Nếu có)">
                                    <Select
                                        showSearch allowClear placeholder="Chọn kho..." onSearch={setWarehouseSearchText}
                                        loading={isSearchingWarehouses} filterOption={false} options={warehouseOptions}
                                    />
                                </Form.Item>
                            </Col>
                        </Row>
                    </Card>
                </Form>
            </Spin>

            <div className="fixed bottom-0 right-0 p-6 bg-transparent z-50">
                <Space>
                    <Button icon={<ArrowLeftOutlined />} onClick={() => navigate('/settings/users')}>
                        Hủy
                    </Button>
                    <Button
                        type="primary"
                        icon={isEditMode ? <SaveOutlined /> : <PlusOutlined />}
                        htmlType="submit"
                        loading={submitting}
                        form="user-form"
                    >
                        {isEditMode ? 'Lưu' : 'Tạo mới'}
                    </Button>
                </Space>
            </div>
        </div>
    );
};

const UserFormPageWrapper: React.FC = () => (
    <App>
        <UserFormPage />
    </App>
);

export default UserFormPageWrapper;