import React, { useState, useEffect } from 'react';
import { fetchBrandLogo, searchBrands } from '../services/brandApi';

const BrandLogo = ({ brandName }) => {
  const [logo, setLogo] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const getBrandLogo = async () => {
      try {
        setLoading(true);
        const data = await fetchBrandLogo(brandName);
        // Asumiendo que la API devuelve un objeto con la URL del logo
        setLogo(data.logo);
        setError(null);
      } catch (err) {
        setError('Error al cargar el logo');
        console.error(err);
      } finally {
        setLoading(false);
      }
    };

    if (brandName) {
      getBrandLogo();
    }
  }, [brandName]);

  if (loading) return <div>Cargando...</div>;
  if (error) return <div>{error}</div>;
  if (!logo) return <div>No se encontró el logo</div>;

  return (
    <div className="brand-logo">
      <img 
        src={logo} 
        alt={`Logo de ${brandName}`} 
        style={{ maxWidth: '200px', height: 'auto' }}
      />
    </div>
  );
};

export default BrandLogo; 