import React, { useState } from 'react';
import { App, Card, Col, Row, Select, Form, Button, Table, Space, DatePicker } from 'antd';
import PageHeader from '../../components/layout/PageHeader';
import { SearchOutlined, ExportOutlined } from '@ant-design/icons';

const { Option } = Select;

const availableReports = [
  { 
    code: 'RPT_ONHAND_SUMMARY',
    name: 'Onhand Inventory Summary',
    parameters: [
      { name: 'warehouse_id', type: 'select', label: 'Warehouse', required: false, options: 'warehouses' },
      { name: 'goods_type_id', type: 'select', label: 'Goods Type', required: false, options: 'goods_types' },
      { name: 'as_of_date', type: 'date', label: 'As of Date', required: false }
    ]
  },
  {
    code: 'RPT_GR_VARIANCE',
    name: 'GR Variance Report',
    parameters: [
      { name: 'date_range', type: 'date_range', label: 'Date Range', required: true },
      { name: 'warehouse_id', type: 'select', label: 'Warehouse', required: false, options: 'warehouses' }
    ]
  },
  {
    code: 'RPT_TRANSACTION_HISTORY',
    name: 'Transaction History',
    parameters: [
        { name: 'transaction_type', type: 'multiselect', label: 'Types', options: [{label: 'GR', value: 'GR'}, {label: 'GI', value: 'GI'}] },
        { name: 'date_range', type: 'date_range', label: 'Date Range', required: true },
    ]
  }
];


const ReportsPage: React.FC = () => {
    const [selectedReport, setSelectedReport] = useState<any>(null);
    const [result, setResult] = useState<{ columns: any[], rows: any[] } | null>(null);
    const [loading, setLoading] = useState(false);
    const [form] = Form.useForm();
    const { notification } = App.useApp();
  
    const handleReportChange = (code: string) => {
        const report = availableReports.find(r => r.code === code);
        setSelectedReport(report);
        setResult(null);
        form.resetFields();
    };

    const handleRunReport = async () => {
        setLoading(true);
        setResult(null);
        notification.info({ message: `Running report: ${selectedReport.name}...` });
        // Mock data for now
        setTimeout(() => {
            const mockColumns = [{title: 'Column 1', dataIndex: 'col1'}, {title: 'Column 2', dataIndex: 'col2'}];
            const mockRows = [{key: '1', col1: 'Data A', col2: 'Data B'}, {key: '2', col1: 'Data C', col2: 'Data D'}];
            setResult({ columns: mockColumns, rows: mockRows });
            setLoading(false);
            notification.success({ message: 'Report generated successfully!' });
        }, 1500);
    };

    const renderParameterFields = () => {
        if (!selectedReport) return null;
        return selectedReport.parameters.map((param: any) => (
            <Form.Item key={param.name} name={param.name} label={param.label} rules={[{ required: param.required }]}>
                {param.type === 'date' && <DatePicker style={{width: '100%'}} />}
                {param.type === 'date_range' && <DatePicker.RangePicker style={{width: '100%'}} />}
                {param.type === 'select' && <Select placeholder={`Select ${param.label}`} allowClear>
                    {/* Options would be fetched dynamically */}
                    <Option value="1">Dummy Warehouse 1</Option>
                    <Option value="2">Dummy Goods Type 2</Option>
                </Select>}
                 {param.type === 'multiselect' && <Select mode="multiple" placeholder={`Select ${param.label}`} allowClear options={param.options} />}
            </Form.Item>
        ));
    }

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <PageHeader title="Reports" description="Generate and view system reports." />
            <Card>
                <Form form={form} onFinish={handleRunReport} layout="vertical">
                    <Row gutter={24}>
                        <Col span={24}>
                            <Form.Item label="Select Report" name="report_code" rules={[{required: true, message: "Please select a report to run."}]}>
                                <Select placeholder="Choose a report..." onChange={handleReportChange}>
                                    {availableReports.map(r => (
                                        <Option key={r.code} value={r.code}>{r.name}</Option>
                                    ))}
                                </Select>
                            </Form.Item>
                        </Col>
                        {selectedReport && (
                            <Col span={24}>
                                <Card type="inner" title="Parameters">
                                    <Row gutter={16}>
                                        {renderParameterFields().map((field, index) => <Col span={8} key={index}>{field}</Col>)}
                                    </Row>
                                    <Form.Item>
                                        <Button type="primary" htmlType="submit" loading={loading} icon={<SearchOutlined />}>
                                            Run Report
                                        </Button>
                                    </Form.Item>
                                </Card>
                            </Col>
                        )}
                    </Row>
                </Form>
            </Card>
            {result && (
                <Card title="Results" extra={<Button icon={<ExportOutlined/>}>Export CSV</Button>}>
                    <Table
                        columns={result.columns}
                        dataSource={result.rows}
                        loading={loading}
                        size="small"
                        bordered
                        pagination={{ pageSize: 50 }}
                        scroll={{ x: 'max-content' }}
                    />
                </Card>
            )}
        </Space>
    );
};

const ReportsPageWrapper: React.FC = () => (
    <App><ReportsPage /></App>
);

export default ReportsPageWrapper;
