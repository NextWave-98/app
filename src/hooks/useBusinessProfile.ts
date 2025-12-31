import { useState, useCallback } from 'react';
import useFetch from './useFetch';

export interface BusinessProfileData {
  id?: string;
  name: string;
  logo: string;
  address: string;
  telephone: string;
  email: string;
  createdAt?: string;
  updatedAt?: string;
}

const useBusinessProfile = () => {
  const [businessData, setBusinessData] = useState<BusinessProfileData | null>(null);
  const [loading, setLoading] = useState(true);

  const { fetchData: fetchBusiness } = useFetch('/business');
  const { fetchData: updateBusinessFetch, loading: updatingBusiness } = useFetch();

  // Load business profile data
  const loadBusinessProfile = useCallback(async () => {
    try {
      setLoading(true);
      const response = await fetchBusiness({ method: 'GET' });
      if (response?.success && response.data) {
        setBusinessData(response.data as BusinessProfileData);
      }
    } catch (error) {
      console.error('Failed to load business profile:', error);
    } finally {
      setLoading(false);
    }
  }, [fetchBusiness]);

  // Update business profile
  const updateBusinessProfile = async (formData: FormData) => {
    try {
      const response = await updateBusinessFetch({
        method: 'PUT',
        endpoint: '/business',
        data: formData,
        contentType: 'multipart/form-data',
      });

      if (response?.success) {
        await loadBusinessProfile(); // Reload business profile data
        return { success: true, message: 'Business profile updated successfully!' };
      }

      return { success: false, message: response?.message || 'Failed to update business profile' };
    } catch (error) {
      console.error('Error updating business profile:', error);
      return { success: false, message: 'Failed to update business profile' };
    }
  };

  return {
    businessData,
    loading,
    updatingBusiness,
    loadBusinessProfile,
    updateBusinessProfile,
  };
};

export default useBusinessProfile;
