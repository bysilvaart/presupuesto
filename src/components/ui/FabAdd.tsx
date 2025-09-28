import { useNavigate, useLocation } from 'react-router-dom';

const FabAdd = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const isCapture = location.pathname === '/capturar';

  return (
    <button
      type="button"
      onClick={() => navigate('/capturar')}
      className="fixed bottom-20 right-5 z-40 flex h-14 w-14 items-center justify-center rounded-full bg-brand text-3xl text-white shadow-soft transition hover:bg-brand-dark focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-white md:bottom-8"
      aria-label="Agregar movimiento"
    >
      {isCapture ? '✓' : '+'}
    </button>
  );
};

export default FabAdd;
