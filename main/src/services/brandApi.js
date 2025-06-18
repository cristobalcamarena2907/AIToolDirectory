const BRAND_API_KEY = 'JoYV7EpSsI0NdUgaMtShInPsl0ao49ZzWbidJZRwqp0=';

export const fetchBrandLogo = async (brandName) => {
  try {
    const response = await fetch(`https://api.brandfetch.com/v2/brands/${encodeURIComponent(brandName)}`, {
      headers: {
        'Authorization': `Bearer ${BRAND_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Error fetching brand logo: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error fetching brand logo:', error);
    throw error;
  }
};

export const searchBrands = async (query) => {
  try {
    const response = await fetch(`https://api.brandfetch.com/v2/brands/search?q=${encodeURIComponent(query)}`, {
      headers: {
        'Authorization': `Bearer ${BRAND_API_KEY}`,
        'Content-Type': 'application/json'
      }
    });

    if (!response.ok) {
      throw new Error(`Error searching brands: ${response.statusText}`);
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Error searching brands:', error);
    throw error;
  }
}; 