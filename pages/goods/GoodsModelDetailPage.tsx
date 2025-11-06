import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { supabase } from '../../services/supabase';
import { GoodsModel, GoodsType, Uom } from '../../types/supabase';
import {
  Button, Card, Form, Input, Row, Col, Space, App, Spin, Select, Descriptions, Tag, Alert, Upload, Carousel, Image
} from 'antd';
import { EditOutlined, UploadOutlined, DeleteOutlined, LeftOutlined, RightOutlined } from '@ant-design/icons';
import { format } from 'date-fns';
import useAuthStore from '../../stores/authStore';
import PageHeader from '../../components/layout/PageHeader';
import { processImage } from '../../utils/imageHelper';
import type { UploadFile, UploadProps } from 'antd/es/upload/interface';

const TRACKING_TYPES: GoodsModel['tracking_type'][] = ['NONE', 'LOT', 'SERIAL'];
type GoodsModelWithDetails = GoodsModel & { 
    goods_type?: { name: string };
    base_uom?: { name: string };
};

const GoodsModelDetailPageContent: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [form] = Form.useForm();
    const { notification, modal } = App.useApp();

    const [loading, setLoading] = useState(true);
    const [isEditing, setIsEditing] = useState(false);
    const [isSaving, setIsSaving] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [goodsModel, setGoodsModel] = useState<GoodsModelWithDetails | null>(null);
    const [goodsTypes, setGoodsTypes] = useState<GoodsType[]>([]);
    const [uoms, setUoms] = useState<Uom[]>([]);
    const user = useAuthStore((state) => state.user);
    
    const [fileList, setFileList] = useState<UploadFile[]>([]);
    const [activeSlide, setActiveSlide] = useState(0);
    const carouselRef = React.useRef<any>(null);


    const sanitizeFileName = (fileName: string) => {
        const cleaned = fileName
            .toLowerCase()
            .normalize("NFD") // Decompose accented characters
            .replace(/[\u0300-\u036f]/g, "") // Remove diacritics
            .replace(/đ/g, "d") // Special case for Vietnamese 'đ'
            .replace(/[^a-z0-9.]/g, '-') // Replace non-alphanumeric chars with hyphens
            .replace(/-+/g, '-') // Replace multiple hyphens with a single one
            .replace(/^-|-$/g, ''); // Trim leading/trailing hyphens
        
        const parts = cleaned.split('.');
        const ext = parts.pop();
        const name = parts.join('.');
        // Ensure name is not too long to avoid storage issues
        return `${name.substring(0, 50)}.${ext}`;
    };

    const fetchData = useCallback(async () => {
        if (!id) return;
        setLoading(true);
        setError(null);
        try {
            const typesPromise = supabase.from('goods_types').select('id, name').eq('is_active', true);
            const uomsPromise = supabase.from('uoms').select('id, name').eq('is_active', true);
            const modelPromise = supabase
                .from('goods_models')
                .select('*, goods_type:goods_types(name), base_uom:uoms(name)')
                .eq('id', id)
                .single();
            
            const [{ data: typesData, error: typesError }, { data: uomsData, error: uomsError }, { data: modelData, error: modelError }] = await Promise.all([typesPromise, uomsPromise, modelPromise]);

            if (typesError || uomsError || modelError) throw typesError || uomsError || modelError;
            
            setGoodsTypes(typesData || []);
            setUoms(uomsData || []);
            if (modelData) {
                setGoodsModel(modelData);
                form.setFieldsValue(modelData);
                const imageUrls = modelData.image_urls || [];
                const currentFileList: UploadFile[] = imageUrls.map((url, index) => ({
                    uid: `${-index}`, // Negative uid for existing files
                    name: url.split('/').pop() || 'image.png',
                    status: 'done',
                    url: supabase.storage.from('product_images').getPublicUrl(url).data.publicUrl,
                    response: url, // Store the path for deletion
                }));
                setFileList(currentFileList);

            } else {
                throw new Error("Goods Model not found");
            }
        } catch (err: any) {
            setError(err.message);
            notification.error({ message: "Error fetching data", description: err.message });
        } finally {
            setLoading(false);
        }
    }, [id, form, notification]);

    useEffect(() => {
        fetchData();
    }, [fetchData]);

    const handleSave = async () => {
        try {
            setIsSaving(true);
            const values = await form.validateFields();
            const imageUrls = fileList.map(file => file.response as string).filter(Boolean);

            const { error } = await supabase.from('goods_models').update({ ...values, image_urls: imageUrls, updated_at: new Date().toISOString(), updated_by: user?.id }).eq('id', id);
            if (error) throw error;
            notification.success({ message: 'Goods Model updated successfully' });
            setIsEditing(false);
            fetchData();
        } catch (err: any) {
            notification.error({ message: 'Update failed', description: err.message });
        } finally {
            setIsSaving(false);
        }
    };

    const handleCancel = () => {
        if (goodsModel) form.setFieldsValue(goodsModel);
        setIsEditing(false);
        fetchData(); // Reset file list
    };

    const customRequest: UploadProps['customRequest'] = async ({ file, onSuccess, onError }) => {
        if (!user) {
            onError?.(new Error("User not authenticated"));
            return;
        }
        
        const f = file as File;
        
        try {
            const processedFile = await processImage(f);
            const cleanFileName = sanitizeFileName(processedFile.name);
            const filePath = `${user.id}/${id}/${Date.now()}-${cleanFileName}`;

            const { data, error } = await supabase.storage
                .from('product_images')
                .upload(filePath, processedFile);

            if (error) throw error;

            onSuccess?.(filePath); // Pass the path as response
        } catch (error: any) {
            console.error('Upload failed:', error);
            notification.error({ message: 'Upload failed', description: error.message });
            onError?.(error);
        }
    };

    const handleUploadChange: UploadProps['onChange'] = ({ file, fileList: newFileList }) => {
        if (file.status === 'done') {
            notification.success({ message: `${file.name} uploaded successfully.` });
        } else if (file.status === 'error') {
            notification.error({ message: `${file.name} upload failed.` });
        }
        setFileList(newFileList);
    };
    
    const handleRemove: UploadProps['onRemove'] = async (file) => {
        const filePath = file.response as string;
        if (!filePath) return true; // File was not yet uploaded

        const confirm = await new Promise((resolve) => {
             modal.confirm({
                title: 'Are you sure you want to delete this image?',
                okText: 'Yes, delete',
                okType: 'danger',
                onOk: () => resolve(true),
                onCancel: () => resolve(false)
            });
        });

        if (!confirm) return false;

        try {
            const { error } = await supabase.storage.from('product_images').remove([filePath]);
            if (error) throw error;
            notification.success({message: "Image deleted successfully."});
            return true;
        } catch (error: any) {
            notification.error({message: "Failed to delete image", description: error.message});
            return false;
        }
    };

    const getUserEmail = (userId: string | null | undefined) => {
        if (!userId) return '-';
        if (userId === user?.id) return user?.email;
        return 'Another User';
    };

    if (loading) return <div className="flex justify-center items-center h-full"><Spin size="large" /></div>;
    if (error) return <Alert message="Error" description={error} type="error" showIcon />;
    
    const pageActions = (
        <Space>
            <Button onClick={() => navigate(-1)}>Back</Button>
            {isEditing ? (
                <>
                <Button onClick={handleCancel}>Cancel</Button>
                <Button type="primary" onClick={handleSave} loading={isSaving}>Save</Button>
                </>
            ) : (
                <Button type="primary" icon={<EditOutlined />} onClick={() => setIsEditing(true)}>Edit</Button>
            )}
        </Space>
    );

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <PageHeader 
                title={goodsModel?.name || 'Goods Model Details'}
                description={`Details for goods model code: ${goodsModel?.code}`}
                actions={pageActions}
            />
            <Row gutter={24}>
                <Col xs={24} lg={10}>
                     <Card title="Product Images">
                        {fileList.length > 0 ? (
                             <Image.PreviewGroup>
                                <Carousel ref={carouselRef} afterChange={setActiveSlide} arrows prevArrow={<LeftOutlined />} nextArrow={<RightOutlined />}>
                                    {fileList.map(file => (
                                        <div key={file.uid} className="flex justify-center items-center bg-gray-100 h-80">
                                            <Image src={file.url} alt={file.name} className="max-h-full max-w-full object-contain" />
                                        </div>
                                    ))}
                                </Carousel>
                             </Image.PreviewGroup>
                        ) : (
                            <div className="flex justify-center items-center bg-gray-100 h-80 text-gray-400">No images</div>
                        )}
                        <div className="flex justify-center mt-4 space-x-2">
                            {fileList.map((file, index) => (
                                <img
                                    key={file.uid}
                                    src={file.url}
                                    alt={file.name}
                                    className={`h-16 w-16 object-cover rounded-md cursor-pointer border-2 ${activeSlide === index ? 'border-blue-500' : 'border-transparent'}`}
                                    onClick={() => carouselRef.current?.goTo(index)}
                                />
                            ))}
                        </div>
                        {isEditing && (
                             <Upload
                                listType="picture"
                                fileList={fileList}
                                customRequest={customRequest}
                                onChange={handleUploadChange}
                                onRemove={handleRemove}
                                multiple
                                beforeUpload={(file) => {
                                    if (fileList.length >= 5) {
                                        notification.error({ message: 'You can only upload a maximum of 5 images.' });
                                        return Upload.LIST_IGNORE;
                                    }
                                    return true;
                                }}
                                className="mt-4"
                            >
                                <Button icon={<UploadOutlined />} disabled={fileList.length >= 5}>
                                    Upload (Max: 5)
                                </Button>
                            </Upload>
                        )}
                    </Card>
                </Col>
                <Col xs={24} lg={14}>
                    <Card title="Information">
                        {isEditing ? (
                            <Form form={form} layout="vertical" name="goods_model_form">
                                <Row gutter={16}>
                                <Col span={12}><Form.Item name="code" label="Code" rules={[{ required: true }]}><Input disabled /></Form.Item></Col>
                                <Col span={12}><Form.Item name="name" label="Name" rules={[{ required: true }]}><Input /></Form.Item></Col>
                                <Col span={12}><Form.Item name="goods_type_id" label="Goods Type" rules={[{ required: true }]}><Select options={goodsTypes.map(gt => ({label: gt.name, value: gt.id}))} /></Form.Item></Col>
                                <Col span={12}><Form.Item name="base_uom_id" label="Base UoM" rules={[{ required: true }]}><Select options={uoms.map(uom => ({label: uom.name, value: uom.id}))} /></Form.Item></Col>
                                <Col span={12}><Form.Item name="tracking_type" label="Tracking Type" rules={[{ required: true }]}><Select options={TRACKING_TYPES.map(t => ({label: t, value: t}))} /></Form.Item></Col>
                                <Col span={12}><Form.Item name="is_active" label="Status" rules={[{ required: true }]}><Select><Select.Option value={true}>Active</Select.Option><Select.Option value={false}>Inactive</Select.Option></Select></Form.Item></Col>
                                <Col span={24}><Form.Item name="description" label="Notes"><Input.TextArea rows={4} /></Form.Item></Col>
                                </Row>
                            </Form>
                        ) : (
                            <Descriptions bordered column={2}>
                                <Descriptions.Item label="Code">{goodsModel?.code}</Descriptions.Item>
                                <Descriptions.Item label="Name">{goodsModel?.name}</Descriptions.Item>
                                <Descriptions.Item label="Goods Type">{goodsModel?.goods_type?.name}</Descriptions.Item>
                                <Descriptions.Item label="Base UoM">{goodsModel?.base_uom?.name}</Descriptions.Item>
                                <Descriptions.Item label="Tracking Type"><Tag>{goodsModel?.tracking_type}</Tag></Descriptions.Item>
                                <Descriptions.Item label="Status"><Tag color={goodsModel?.is_active ? 'green' : 'red'}>{goodsModel?.is_active ? 'Active' : 'Inactive'}</Tag></Descriptions.Item>
                                <Descriptions.Item label="Notes" span={2}>{goodsModel?.description}</Descriptions.Item>
                                <Descriptions.Item label="Created At">{goodsModel?.created_at ? format(new Date(goodsModel.created_at), 'yyyy-MM-dd HH:mm') : '-'}</Descriptions.Item>
                                <Descriptions.Item label="Created By">{getUserEmail(goodsModel?.created_by)}</Descriptions.Item>
                                <Descriptions.Item label="Updated At">{goodsModel?.updated_at ? format(new Date(goodsModel.updated_at), 'yyyy-MM-dd HH:mm') : '-'}</Descriptions.Item>
                                <Descriptions.Item label="Updated By">{getUserEmail(goodsModel?.updated_by)}</Descriptions.Item>
                            </Descriptions>
                        )}
                    </Card>
                </Col>
            </Row>
        </Space>
    );
};

const GoodsModelDetailPage: React.FC = () => (
    <App><GoodsModelDetailPageContent /></App>
);

export default GoodsModelDetailPage;