import React, { useState } from 'react';
import { supabase } from '../../lib/supabase';
import { Form, Input, Button, Alert, Typography, Card as AntdCard, Row, Col, Checkbox } from 'antd';
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
        <div className="min-h-screen bg-[#344054] flex items-center justify-center p-4">
            <div className="w-full max-w-5xl">
                <Row align="middle" justify="center" className="bg-white rounded-lg shadow-2xl overflow-hidden">
                    <Col xs={0} md={12} className="p-12 bg-gray-50 flex flex-col justify-center items-center">
                        <div className="text-center">
                            <h1 className="text-4xl font-bold text-blue-500">
                                Inventory
                                <span className="text-gray-700"> XCloud</span>
                            </h1>
                            <p className="text-gray-500 mt-2">Warehouse Management System</p>
                            <img src="https://img.freepik.com/free-vector/delivery-service-with-masks-concept_23-2148509518.jpg?w=826&t=st=1709695120~exp=1709695720~hmac=6212b1a8d003b0c51152a5c2d3d2217743135c341395b879c50a049d10e3d550" alt="Warehouse Illustration" className="mt-8 mx-auto" style={{ maxWidth: '300px' }}/>
                        </div>
                    </Col>
                    <Col xs={24} md={12} className="p-12">
                        <div className="text-left mb-8">
                            <Typography.Title level={2} className="text-gray-800">Welcome back!</Typography.Title>
                            <Typography.Text type="secondary">Sign in to continue</Typography.Text>
                        </div>
                        
                        {error && <Alert message={error} type="error" showIcon closable className="mb-4" />}

                        <Form
                            name="login"
                            initialValues={{ email: 'nguyenmanhtri2907@gmail.com', password: 'nmt29072002', remember: true }}
                            onFinish={handleLogin}
                            layout="vertical"
                        >
                            <Form.Item
                                label="Email"
                                name="email"
                                rules={[{ required: true, type: 'email', message: 'Please input a valid Email!' }]}
                            >
                                <Input prefix={<MailOutlined />} placeholder="your.email@example.com" size="large" />
                            </Form.Item>

                            <Form.Item
                                label="Password"
                                name="password"
                                rules={[{ required: true, message: 'Please input your Password!' }]}
                            >
                                <Input.Password prefix={<LockOutlined />} placeholder="Password" size="large" />
                            </Form.Item>

                            <Form.Item>
                                <Form.Item name="remember" valuePropName="checked" noStyle>
                                    <Checkbox>Remember me</Checkbox>
                                </Form.Item>
                                <a className="float-right text-sm" href="">
                                    Forgot password?
                                </a>
                            </Form.Item>
                            
                            <Form.Item>
                                <Button type="primary" htmlType="submit" loading={isLoading} className="w-full" size="large">
                                    Sign In
                                </Button>
                            </Form.Item>
                        </Form>
                    </Col>
                </Row>
            </div>
        </div>
    );
};

export default LoginPage;