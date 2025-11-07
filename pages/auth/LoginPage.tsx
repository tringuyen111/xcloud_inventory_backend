import React, { useState } from 'react';
import { supabase } from '../../services/supabaseClient';
import { Form, Input, Button, Alert, Typography, Card } from 'antd';
import { MailOutlined, LockOutlined } from '@ant-design/icons';

const LoginPage: React.FC = () => {
    const [error, setError] = useState('');
    const [isLoading, setIsLoading] = useState(false);

    const handleLogin = async (values: any) => {
        setIsLoading(true);
        setError('');
        
        const { error } = await supabase.auth.signInWithPassword({
            email: values.email,
            password: values.password,
        });

        if (error) {
            setError(error.message);
        }
        // On success, the onAuthStateChange listener in authStore will handle the redirect.
        setIsLoading(false);
    };

    return (
        <div className="min-h-screen bg-[#f5f7fb] flex items-center justify-center">
            <Card className="w-full max-w-md shadow-lg">
                <div className="text-center mb-8">
                    <Typography.Title level={2} className="text-gray-800">Inventory XCloud</Typography.Title>
                    <Typography.Text type="secondary">Sign in to your account</Typography.Text>
                </div>
                
                {error && <Alert message={error} type="error" showIcon closable className="mb-4" />}

                <Form
                    name="login"
                    initialValues={{ email: 'nguyenmanhtri2907@gmail.com', password: 'nmt29072002' }}
                    onFinish={handleLogin}
                    size="large"
                >
                    <Form.Item
                        name="email"
                        rules={[{ required: true, type: 'email', message: 'Please input a valid Email!' }]}
                    >
                        <Input prefix={<MailOutlined />} placeholder="Email" />
                    </Form.Item>

                    <Form.Item
                        name="password"
                        rules={[{ required: true, message: 'Please input your Password!' }]}
                    >
                        <Input.Password prefix={<LockOutlined />} placeholder="Password" />
                    </Form.Item>
                    
                    <Form.Item>
                        <Button type="primary" htmlType="submit" loading={isLoading} className="w-full">
                            Sign In
                        </Button>
                    </Form.Item>
                </Form>
            </Card>
        </div>
    );
};

export default LoginPage;
