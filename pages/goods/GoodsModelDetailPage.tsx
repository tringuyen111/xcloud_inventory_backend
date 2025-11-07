import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
// FIX: Corrected supabase client import path
import { supabase } from '../../services/supabaseClient';
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
        return `${name.substring(0, 5