import React, { useEffect, useState } from 'react';
import {
    App,
    Card,
    Row,
    Col,
    Avatar,
    Typography,
    Tag,
    Button,
    Tabs,
    Form,
    Input,
    Spin,
    Descriptions,
    Badge,
} from 'antd';
import { UserOutlined, EditOutlined } from '@ant-design/icons';
import { useAuth } from '../../hooks/useAuth';
import { supabase } from '../../lib/supabase';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const ProfileInfoForm: React.FC<{ profile: any; onFinish: (values: any) => Promise<void>; onCancel: () => void }> = ({ profile, onFinish, onCancel }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const { notification } = App.useApp();

    useEffect(() => {
        if (profile) {
            form.setFieldsValue({
                full_name: profile.full_name,
                email: profile.email,
                phone: profile.phone,
            });
        }
    }, [profile, form]);

    const handleFinish = async (values: any) => {
        setLoading(true);
        try {
            await onFinish(values);
            notification.success({
                message: 'Profile Updated',
                description: 'Your profile information has been successfully updated.',
            });
        } catch (error: any) {
            notification.error({
                message: 'Update Failed',
                description: error.message,
            });
        } finally {
            setLoading(false);
        }
    };

    return (
        <Form form={form} layout="vertical" onFinish={handleFinish}>
            <Form.Item
                name="full_name"
                label="Full Name"
                rules={[{ required: true, message: 'Please enter your full name' }]}
            >
                <Input />
            </Form.Item>
            <Form.Item
                name="email"
                label="Email"
            >
                <Input disabled />
            </Form.Item>
            <Form.Item
                name="phone"
                label="Phone Number"
            >
                <Input />
            </Form.Item>
            <Form.Item>
                <div className="flex items-center space-x-2">
                    <Button type="primary" htmlType="submit" loading={loading}>
                        Save Changes
                    </Button>
                    <Button onClick={onCancel}>Cancel</Button>
                </div>
            </Form.Item>
        </Form>
    );
};

const ChangePasswordForm: React.FC<{ onCancel: () => void }> = ({ onCancel }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const { notification } = App.useApp();
    const { user } = useAuth();

    const handleChangePassword = async (values: any) => {
        setLoading(true);
        if (!user || !user.email) {
            notification.error({
                message: 'Authentication Error',
                description: 'User session not found. Please log in again.',
            });
            setLoading(false);
            return;
        }

        // 1. Verify current password by attempting a sign-in
        const { error: signInError } = await supabase.auth.signInWithPassword({
            email: user.email,
            password: values.currentPassword,
        });

        if (signInError) {
            notification.error({
                message: 'Password Change Failed',
                description: 'Your current password is incorrect.',
            });
            setLoading(false);
            return;
        }

        // 2. If verification is successful, update to the new password
        const { error: updateError } = await supabase.auth.updateUser({ password: values.newPassword });

        if (updateError) {
            notification.error({
                message: 'Password Change Failed',
                description: updateError.message,
            });
        } else {
            notification.success({
                message: 'Password Changed Successfully',
                description: 'Your password has been updated.',
            });
            form.resetFields();
            onCancel(); // Hide form on success
        }
        setLoading(false);
    };

    return (
        <Form form={form} layout="vertical" onFinish={handleChangePassword}>
            <Form.Item
                name="currentPassword"
                label="Current Password"
                rules={[{ required: true, message: 'Please input your current password!' }]}
            >
                <Input.Password placeholder="Enter your current password" />
            </Form.Item>
            <Form.Item
                name="newPassword"
                label="New Password"
                rules={[
                    { required: true, message: 'Please input your new password!' },
                    { min: 6, message: 'Password must be at least 6 characters long.'}
                ]}
                hasFeedback
            >
                <Input.Password placeholder="Enter your new password" />
            </Form.Item>
            <Form.Item
                name="confirm"
                label="Confirm New Password"
                dependencies={['newPassword']}
                hasFeedback
                rules={[
                    { required: true, message: 'Please confirm your new password!' },
                    ({ getFieldValue }) => ({
                        validator(_, value) {
                            if (!value || getFieldValue('newPassword') === value) {
                                return Promise.resolve();
                            }
                            return Promise.reject(new Error('The two passwords that you entered do not match!'));
                        },
                    }),
                ]}
            >
                <Input.Password placeholder="Confirm your new password" />
            </Form.Item>
            <Form.Item>
                <div className="flex items-center space-x-2">
                    <Button type="primary" htmlType="submit" loading={loading}>
                        Save New Password
                    </Button>
                    <Button onClick={onCancel}>Cancel</Button>
                </div>
            </Form.Item>
        </Form>
    );
};


const ProfilePage: React.FC = () => {
    const { profile, isLoading, refetchUserProfile } = useAuth();
    const [isEditing, setIsEditing] = useState(false);
    const [isChangingPassword, setIsChangingPassword] = useState(false);
    const [activeTab, setActiveTab] = useState('1');

    const handleUpdateProfile = async (values: { full_name: string; phone: string }) => {
        if (!profile) return;
        const { error } = await supabase
            .from('users')
            .update({
                full_name: values.full_name,
                phone: values.phone,
                updated_at: new Date().toISOString(),
             })
            .eq('id', profile.id);

        if (error) {
            throw error;
        }
        
        setIsEditing(false);
        await refetchUserProfile();
    };

    if (isLoading || !profile) {
        return <div className="flex justify-center items-center h-full"><Spin size="large" /></div>;
    }
    
    const profileInfoContent = (
        <div className="relative pt-2">
            {isEditing ? (
                <ProfileInfoForm
                    profile={profile}
                    onFinish={handleUpdateProfile}
                    onCancel={() => setIsEditing(false)}
                />
            ) : (
                <Descriptions bordered column={1} size="small">
                    <Descriptions.Item label="Full Name">{profile.full_name}</Descriptions.Item>
                    <Descriptions.Item label="Email">{profile.email}</Descriptions.Item>
                    <Descriptions.Item label="Phone">{profile.phone || 'N/A'}</Descriptions.Item>
                </Descriptions>
            )}
        </div>
    );

    const securityContent = isChangingPassword ? (
        <ChangePasswordForm onCancel={() => setIsChangingPassword(false)} />
    ) : (
        <div className="text-left">
            <p className="mb-4 text-gray-600">Update your password regularly to keep your account secure.</p>
            <Button type="primary" onClick={() => setIsChangingPassword(true)}>
                Change Password
            </Button>
        </div>
    );
    
    const editProfileButton = activeTab === '1' && !isEditing ? (
        <Button
            type="text"
            shape="circle"
            icon={<EditOutlined />}
            onClick={() => setIsEditing(true)}
            aria-label="Edit Profile"
        />
    ) : null;

    const tabItems = [
        {
            key: '1',
            label: 'Profile Information',
            children: profileInfoContent,
        },
        {
            key: '2',
            label: 'Security',
            children: securityContent,
        },
        {
            key: '3',
            label: 'Account Settings',
            children: (
                <Descriptions bordered column={1}>
                    <Descriptions.Item label="Status">
                        <Badge status={profile.is_active ? 'success' : 'error'} text={profile.is_active ? 'Active' : 'Inactive'} />
                    </Descriptions.Item>
                    <Descriptions.Item label="Role">{profile.role || 'N/A'}</Descriptions.Item>
                    <Descriptions.Item label="Last Login">
                        {profile.last_login_at ? dayjs(profile.last_login_at).format('YYYY-MM-DD HH:mm:ss') : 'N/A'}
                    </Descriptions.Item>
                    <Descriptions.Item label="Member Since">
                        {profile.created_at ? dayjs(profile.created_at).format('YYYY-MM-DD') : 'N/A'}
                    </Descriptions.Item>
                </Descriptions>
            ),
        },
    ];

    return (
        <Card>
            <Row gutter={[32, 32]}>
                <Col xs={24} md={8} className="text-center">
                    <Avatar size={128} icon={<UserOutlined />} className="mb-4" />
                    <Title level={4}>{profile.full_name}</Title>
                    <Text type="secondary">{profile.email}</Text>
                    <div>
                        <Tag color="blue" className="mt-2">{profile.role}</Tag>
                    </div>
                </Col>
                <Col xs={24} md={16}>
                    <Tabs 
                        activeKey={activeTab}
                        onChange={setActiveTab}
                        items={tabItems}
                        tabBarExtraContent={editProfileButton}
                    />
                </Col>
            </Row>
        </Card>
    );
};

const ProfilePageWrapper: React.FC = () => (
    <App>
        <ProfilePage />
    </App>
);

export default ProfilePageWrapper;
