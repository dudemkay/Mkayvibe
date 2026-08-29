import { useState, useEffect } from 'react';

const getIsSmallViewport = (threshold: number) => {
  if (typeof window === 'undefined') {
    return false;
  }

  return window.innerWidth < threshold;
};

const useViewport = (threshold = 1024) => {
  const [isSmallViewport, setIsSmallViewport] = useState(() => getIsSmallViewport(threshold));

  useEffect(() => {
    if (typeof window === 'undefined') {
      return undefined;
    }

    const handleResize = () => setIsSmallViewport(getIsSmallViewport(threshold));
    handleResize();
    window.addEventListener('resize', handleResize);

    return () => {
      window.removeEventListener('resize', handleResize);
    };
  }, [threshold]);

  return isSmallViewport;
};

export default useViewport;
