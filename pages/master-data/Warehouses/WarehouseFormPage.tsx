


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
    InputNumber,
} from 'antd';
import { SaveOutlined, PlusOutlined, ArrowLeftOutlined } from '@ant-design/icons';
import { supabase } from '../../../lib/supabase';
import { useAuth } from '../../../hooks/useAuth';
import { useDebounce } from '../../../hooks/useDebounce';
import { Database } from '../../../types/supabase';

const { Title } = Typography;

interface SelectOption {
    label: string;
    value: string;
}

// Define a type for the fetched warehouse data for clarity
type FetchedWarehouse = Database['public']['Tables']['warehouses']['Row'] & {
    branch: { id: number; name: string } | null;
    manager: { id: string; full_name: string } | null;
};


const WarehouseFormPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const { notification } = App.useApp();
    const { user } = useAuth();

    const [loading, setLoading] = useState<boolean>(false);
    const [submitting, setSubmitting] = useState<boolean>(false);
    const [pageTitle, setPageTitle] = useState<string>('Tạo mới Kho hàng');
    
    // State for Branches dropdown
    const [branchOptions, setBranchOptions] = useState<SelectOption[]>([]);
    const [branchSearchText, setBranchSearchText] = useState('');
    const [isSearchingBranches, setIsSearchingBranches] = useState(false);
    const debouncedBranchSearch = useDebounce(branchSearchText, 500);

    // State for Users (Managers) dropdown
    const [userOptions, setUserOptions] = useState<SelectOption[]>([]);
    const [userSearchText, setUserSearchText] = useState('');
    const [isSearchingUsers, setIsSearchingUsers] = useState(false);
    const debouncedUserSearch = useDebounce(userSearchText, 500);

    const isEditMode = !!id;

    // --- Data Fetching Callbacks ---
    const fetchDropdownData = useCallback(async (
        rpcName: 'get_branches_list' | 'get_users_list',
        searchText: string,
        setOptions: React.Dispatch<React.SetStateAction<SelectOption[]>>,
        setIsSearching: React.Dispatch<React.SetStateAction<boolean>>
    ) => {
        setIsSearching(true);
        try {
            const { data, error } = await supabase.rpc(rpcName, {
                p_search_text: searchText,
                p_page_number: 1,
                p_page_size: 20
            });

            if (error) throw error;
            
            const items = (data as any)?.data || [];
            const newOptions = items.map((item: { id: number | string; name?: string; full_name?: string }) => ({
                label: item.name || item.full_name || '',
                value: item.id.toString(),
            }));
            
            setOptions(currentOptions => {
                const combined = [...currentOptions, ...newOptions];
                const uniqueOptions = Array.from(new Map(combined.map(item => [item.value, item])).values());
                return uniqueOptions;
            });

        } catch (error: any) {
            notification.error({ message: `Lỗi tải danh sách cho ${rpcName}`, description: error.message });
        } finally {
            setIsSearching(false);
        }
    }, [notification]);

    // --- Effects for Async Dropdowns ---
    useEffect(() => {
        fetchDropdownData('get_branches_list', debouncedBranchSearch, setBranchOptions, setIsSearchingBranches);
    }, [debouncedBranchSearch, fetchDropdownData]);

    useEffect(() => {
        fetchDropdownData('get_users_list', debouncedUserSearch, setUserOptions, setIsSearchingUsers);
    }, [debouncedUserSearch, fetchDropdownData]);

    // --- Effect for Edit Mode ---
    useEffect(() => {
        if (isEditMode) {
            setPageTitle('Chỉnh sửa Kho hàng');
            const fetchWarehouse = async () => {
                setLoading(true);
                // FIX: Disambiguate the foreign key to the users table for the manager relationship to prevent query errors.
                const { data, error } = await supabase
                    .from('warehouses')
                    .select('*, branch:branches(id, name), manager:users!manager_id(id, full_name)')
                    .eq('id', id)
                    .single();
                
                // FIX: Removed navigation on error to prevent screen flashing and allow the user to see the error message.
                if (error) {
                    notification.error({ message: 'Error Fetching Warehouse', description: error.message });
                } else if (data) {
                    const warehouseData = data as FetchedWarehouse;
                    const formData = { 
                        ...warehouseData, 
                        branch_id: warehouseData.branch_id?.toString(), 
                        manager_id: warehouseData.manager_id?.toString() 
                    };
                    form.setFieldsValue(formData);
                    
                    if (warehouseData.branch) {
                        setBranchOptions([{ label: warehouseData.branch.name, value: warehouseData.branch.id.toString() }]);
                    }
                    if (warehouseData.manager) {
                        setUserOptions([{ label: warehouseData.manager.full_name, value: warehouseData.manager.id.toString() }]);
                    }
                    setPageTitle(`Chỉnh sửa Kho: ${warehouseData.code}`);
                }
                setLoading(false);
            };
            fetchWarehouse();
        }
    }, [id, isEditMode, navigate, form, notification]);


    // --- Form Submission ---
    const onFinish = async (values: any) => {
        setSubmitting(true);
        const payload = {
            ...values,
            branch_id: parseInt(values.branch_id, 10),
            manager_id: values.manager_id || null, // Ensure null if empty
            ...(isEditMode 
                ? { updated_by: user?.id, updated_at: new Date().toISOString() } 
                : { created_by: user?.id })
        };
        
        try {
            if (isEditMode) {
                const { error } = await supabase.from('warehouses').update(payload).eq('id', id);
                if (error) throw error;
            } else {
                const { error } = await supabase.from('warehouses').insert(payload);
                if (error) throw error;
            }
            
            notification.success({ message: `Kho đã được ${isEditMode ? 'cập nhật' : 'tạo'} thành công` });
            navigate('/master-data/warehouses');

        } catch (error: any) {
            if (error.code === '23505' && error.message.includes('warehouses_branch_id_code_key')) {
               form.setFields([{ name: 'code', errors: ['Mã kho này đã tồn tại trong chi nhánh đã chọn.'] }]);
           } else {
               notification.error({ message: `Lỗi ${isEditMode ? 'cập nhật' : 'tạo'} kho`, description: error.message });
           }
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <div className="pb-24">
            <Spin spinning={loading}>
                <Form id="warehouse-form" form={form} layout="vertical" onFinish={onFinish}>
                    <Card title={<Title level={4} style={{ margin: 0 }}>{pageTitle}</Title>}>
                        <Row gutter={24}>
                            <Col xs={24} md={12}>
                                <Form.Item name="branch_id" label="Chi nhánh" rules={[{ required: true, message: 'Chi nhánh là bắt buộc' }]}>
                                    <Select
                                        showSearch placeholder="Chọn hoặc tìm kiếm chi nhánh..."
                                        onSearch={setBranchSearchText}
                                        loading={isSearchingBranches}
                                        filterOption={false}
                                        options={branchOptions}
                                        disabled={isEditMode}
                                    />
                                </Form.Item>
                            </Col>
                             <Col xs={24} md={12}>
                                 <Form.Item name="name" label="Tên kho" rules={[{ required: true, message: 'Tên là bắt buộc' }, { min: 2, message: 'Tên phải có ít nhất 2 ký tự' }]}>
                                    <Input placeholder="e.g., Kho Chính HCM" />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item name="code" label="Mã kho" rules={[{ required: true, message: 'Mã là bắt buộc' }, { min: 2, message: 'Mã phải có ít nhất 2 ký tự' }]}>
                                    <Input placeholder="e.g., KHO-HCM-01" disabled={isEditMode} />
                                </Form.Item>
                            </Col>
                            <Col xs={24} md={12}>
                                <Form.Item name="manager_id" label="Người quản lý">
                                     <Select
                                        showSearch allowClear placeholder="Chọn hoặc tìm kiếm người quản lý..."
                                        onSearch={setUserSearchText}
                                        loading={isSearchingUsers}
                                        filterOption={false}
                                        options={userOptions}
                                    />
                                </Form.Item>
                            </Col>
                             <Col xs={24} md={12}>
                                <Form.Item name="total_capacity_cbm" label="Sức chứa (CBM)">
                                    <InputNumber min={0} style={{ width: '100%' }} placeholder="e.g., 1000" />
                                </Form.Item>
                            </Col>
                             <Col xs={24} md={12}>
                                <Form.Item name="total_capacity_weight_kg" label="Sức chứa (KG)">
                                    <InputNumber min={0} style={{ width: '100%' }} placeholder="e.g., 50000" />
                                </Form.Item>
                            </Col>
                            <Col span={24}>
                                <Form.Item name="address" label="Địa chỉ">
                                    <Input.TextArea rows={2} placeholder="Nhập địa chỉ đầy đủ của kho" />
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
                    <Button size="large" icon={<ArrowLeftOutlined />} onClick={() => navigate('/master-data/warehouses')}>Hủy</Button>
                    <Button size="large" type="primary" icon={isEditMode ? <SaveOutlined /> : <PlusOutlined />} htmlType="submit" loading={submitting} form="warehouse-form">
                        {isEditMode ? 'Lưu' : 'Tạo mới'}
                    </Button>
                </Space>
            </div>
        </div>
    );
};

const WarehouseFormPageWrapper: React.FC = () => (
    <App>
        <WarehouseFormPage />
    </App>
);

export default WarehouseFormPageWrapper;