'use client';

import { useEffect, useState } from 'react';
import { supabase } from '@/lib/supabase';
import { Save } from 'lucide-react';

interface StoreSettings {
  id: string;
  store_name: string;
  store_description: string;
  contact_email: string;
  contact_phone: string;
  address: string;
  currency: string;
  tax_rate: number;
  shipping_fee: number;
  free_shipping_threshold: number;
  business_hours: {
    monday: { open: string; close: string };
    tuesday: { open: string; close: string };
    wednesday: { open: string; close: string };
    thursday: { open: string; close: string };
    friday: { open: string; close: string };
    saturday: { open: string; close: string };
    sunday: { open: string; close: string };
  };
  social_media: {
    facebook: string;
    instagram: string;
    twitter: string;
  };
  notification_settings: {
    order_confirmation: boolean;
    shipping_updates: boolean;
    promotional_emails: boolean;
  };
}

const defaultSettings: StoreSettings = {
  id: 'default_settings',
  store_name: '',
  store_description: '',
  contact_email: '',
  contact_phone: '',
  address: '',
  currency: 'VND',
  tax_rate: 10,
  shipping_fee: 0,
  free_shipping_threshold: 0,
  business_hours: {
    monday: { open: '09:00', close: '18:00' },
    tuesday: { open: '09:00', close: '18:00' },
    wednesday: { open: '09:00', close: '18:00' },
    thursday: { open: '09:00', close: '18:00' },
    friday: { open: '09:00', close: '18:00' },
    saturday: { open: '09:00', close: '18:00' },
    sunday: { open: '09:00', close: '18:00' }
  },
  social_media: {
    facebook: '',
    instagram: '',
    twitter: ''
  },
  notification_settings: {
    order_confirmation: true,
    shipping_updates: true,
    promotional_emails: true
  }
};

export default function SettingsPage() {
  const [settings, setSettings] = useState<StoreSettings>(defaultSettings);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data, error } = await supabase
        .from('store_settings')
        .select('*')
        .eq('id', 'default_settings')
        .single();

      if (error) {
        console.error('Error fetching settings:', error);
        setSettings(defaultSettings);
      } else if (data) {
        setSettings(data);
      }
    } catch (error) {
      console.error('Error fetching settings:', error);
      setSettings(defaultSettings);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSaveSettings = async () => {
    setIsSaving(true);
    setSaveMessage('');

    try {
      // Đảm bảo tất cả các trường đều có giá trị hợp lệ
      const settingsToSave = {
        ...settings,
        store_name: settings.store_name || '',
        store_description: settings.store_description || '',
        contact_email: settings.contact_email || '',
        contact_phone: settings.contact_phone || '',
        address: settings.address || '',
        currency: settings.currency || 'VND',
        tax_rate: settings.tax_rate || 10,
        shipping_fee: settings.shipping_fee || 0,
        free_shipping_threshold: settings.free_shipping_threshold || 0,
        business_hours: settings.business_hours || defaultSettings.business_hours,
        social_media: settings.social_media || defaultSettings.social_media,
        notification_settings: settings.notification_settings || defaultSettings.notification_settings
      };

      console.log('Saving settings:', settingsToSave);

      const { data, error } = await supabase
        .from('store_settings')
        .upsert(settingsToSave, {
          onConflict: 'id'
        })
        .select();

      if (error) {
        console.error('Error saving settings:', error);
        throw error;
      }

      console.log('Settings saved successfully:', data);
      setSaveMessage('Đã lưu cài đặt thành công!');
      setTimeout(() => setSaveMessage(''), 3000);
    } catch (error) {
      console.error('Error saving settings:', error);
      setSaveMessage('Lỗi khi lưu cài đặt. Vui lòng thử lại.');
    } finally {
      setIsSaving(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('vi-VN', {
      style: 'currency',
      currency: 'VND'
    }).format(amount);
  };

  const handleInputChange = (field: keyof StoreSettings, value: any) => {
    setSettings(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleBusinessHoursChange = (day: string, field: 'open' | 'close', value: string) => {
    setSettings(prev => ({
      ...prev,
      business_hours: {
        ...prev.business_hours,
        [day]: {
          ...prev.business_hours[day as keyof typeof prev.business_hours],
          [field]: value
        }
      }
    }));
  };

  const handleSocialMediaChange = (platform: string, value: string) => {
    setSettings(prev => ({
      ...prev,
      social_media: {
        ...prev.social_media,
        [platform]: value
      }
    }));
  };

  const handleNotificationChange = (setting: string, value: boolean) => {
    setSettings(prev => ({
      ...prev,
      notification_settings: {
        ...prev.notification_settings,
        [setting]: value
      }
    }));
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">Cài đặt cửa hàng</h1>
        <button
          onClick={handleSaveSettings}
          disabled={isSaving}
          className="bg-red-600 text-white px-4 py-2 rounded-lg flex items-center space-x-2 hover:bg-red-700 transition-colors disabled:opacity-50"
        >
          <Save className="w-5 h-5" />
          <span>{isSaving ? 'Đang lưu...' : 'Lưu cài đặt'}</span>
        </button>
      </div>

      {saveMessage && (
        <div className={`p-4 rounded-lg ${
          saveMessage.includes('thành công') 
            ? 'bg-green-100 text-green-800' 
            : 'bg-red-100 text-red-800'
        }`}>
          {saveMessage}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Thông tin cơ bản */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold">Thông tin cơ bản</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700">Tên cửa hàng</label>
            <input
              type="text"
              value={settings.store_name || ''}
              onChange={(e) => handleInputChange('store_name', e.target.value)}
              className="mt-1 block w-full border rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Mô tả</label>
            <textarea
              value={settings.store_description || ''}
              onChange={(e) => handleInputChange('store_description', e.target.value)}
              rows={3}
              className="mt-1 block w-full border rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Email liên hệ</label>
            <input
              type="email"
              value={settings.contact_email || ''}
              onChange={(e) => handleInputChange('contact_email', e.target.value)}
              className="mt-1 block w-full border rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Số điện thoại</label>
            <input
              type="tel"
              value={settings.contact_phone || ''}
              onChange={(e) => handleInputChange('contact_phone', e.target.value)}
              className="mt-1 block w-full border rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Địa chỉ</label>
            <textarea
              value={settings.address || ''}
              onChange={(e) => handleInputChange('address', e.target.value)}
              rows={2}
              className="mt-1 block w-full border rounded-md px-3 py-2"
            />
          </div>
        </div>

        {/* Cài đặt bán hàng */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold">Cài đặt bán hàng</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700">Đơn vị tiền tệ</label>
            <select
              value={settings.currency || 'VND'}
              onChange={(e) => handleInputChange('currency', e.target.value)}
              className="mt-1 block w-full border rounded-md px-3 py-2"
            >
              <option value="VND">VND - Việt Nam Đồng</option>
              <option value="USD">USD - US Dollar</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Thuế VAT (%)</label>
            <input
              type="number"
              value={settings.tax_rate || 10}
              onChange={(e) => handleInputChange('tax_rate', Number(e.target.value))}
              className="mt-1 block w-full border rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phí vận chuyển</label>
            <input
              type="number"
              value={settings.shipping_fee || 0}
              onChange={(e) => handleInputChange('shipping_fee', Number(e.target.value))}
              className="mt-1 block w-full border rounded-md px-3 py-2"
            />
            <p className="mt-1 text-sm text-gray-500">
              Hiện tại: {formatCurrency(settings.shipping_fee || 0)}
            </p>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Miễn phí vận chuyển cho đơn hàng từ
            </label>
            <input
              type="number"
              value={settings.free_shipping_threshold || 0}
              onChange={(e) => handleInputChange('free_shipping_threshold', Number(e.target.value))}
              className="mt-1 block w-full border rounded-md px-3 py-2"
            />
            <p className="mt-1 text-sm text-gray-500">
              Hiện tại: {formatCurrency(settings.free_shipping_threshold || 0)}
            </p>
          </div>
        </div>

        {/* Giờ làm việc */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold">Giờ làm việc</h2>
          {Object.entries(settings.business_hours || defaultSettings.business_hours).map(([day, hours]) => (
            <div key={day} className="grid grid-cols-3 gap-4 items-center">
              <label className="text-sm font-medium text-gray-700 capitalize">
                {day === 'monday' ? 'Thứ 2' :
                 day === 'tuesday' ? 'Thứ 3' :
                 day === 'wednesday' ? 'Thứ 4' :
                 day === 'thursday' ? 'Thứ 5' :
                 day === 'friday' ? 'Thứ 6' :
                 day === 'saturday' ? 'Thứ 7' :
                 'Chủ nhật'}
              </label>
              <input
                type="time"
                value={hours.open || '09:00'}
                onChange={(e) => handleBusinessHoursChange(day, 'open', e.target.value)}
                className="border rounded-md px-3 py-2"
              />
              <input
                type="time"
                value={hours.close || '18:00'}
                onChange={(e) => handleBusinessHoursChange(day, 'close', e.target.value)}
                className="border rounded-md px-3 py-2"
              />
            </div>
          ))}
        </div>

        {/* Mạng xã hội */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4">
          <h2 className="text-lg font-semibold">Mạng xã hội</h2>
          <div>
            <label className="block text-sm font-medium text-gray-700">Facebook</label>
            <input
              type="url"
              value={settings.social_media?.facebook || ''}
              onChange={(e) => handleSocialMediaChange('facebook', e.target.value)}
              placeholder="https://facebook.com/..."
              className="mt-1 block w-full border rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Instagram</label>
            <input
              type="url"
              value={settings.social_media?.instagram || ''}
              onChange={(e) => handleSocialMediaChange('instagram', e.target.value)}
              placeholder="https://instagram.com/..."
              className="mt-1 block w-full border rounded-md px-3 py-2"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Twitter</label>
            <input
              type="url"
              value={settings.social_media?.twitter || ''}
              onChange={(e) => handleSocialMediaChange('twitter', e.target.value)}
              placeholder="https://twitter.com/..."
              className="mt-1 block w-full border rounded-md px-3 py-2"
            />
          </div>
        </div>

        {/* Cài đặt thông báo */}
        <div className="bg-white rounded-lg shadow p-6 space-y-4 md:col-span-2">
          <h2 className="text-lg font-semibold">Cài đặt thông báo</h2>
          <div className="space-y-4">
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={settings.notification_settings?.order_confirmation || true}
                onChange={(e) => handleNotificationChange('order_confirmation', e.target.checked)}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Gửi email xác nhận đơn hàng
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={settings.notification_settings?.shipping_updates || true}
                onChange={(e) => handleNotificationChange('shipping_updates', e.target.checked)}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Gửi cập nhật trạng thái vận chuyển
              </label>
            </div>
            <div className="flex items-center">
              <input
                type="checkbox"
                checked={settings.notification_settings?.promotional_emails || true}
                onChange={(e) => handleNotificationChange('promotional_emails', e.target.checked)}
                className="h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300 rounded"
              />
              <label className="ml-2 block text-sm text-gray-900">
                Gửi email quảng cáo và khuyến mãi
              </label>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 