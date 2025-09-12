import { Routes, Route } from 'react-router-dom';
import LoginPage from '@/pages/LoginPage';
import ClientDashboard from '@/pages/ClientDashboard';
import SafeStatus from '@/pages/SafeStatus';
import { DataProvider } from '@/contexts/DataContext';

function App() {
  return (
    <Routes>
      <Route path="/login" element={<LoginPage />} />
      <Route path="/dashboard" element={<DataProvider><ClientDashboard /></DataProvider>} />
      <Route path="/safe" element={<SafeStatus />} />
      <Route path="*" element={
        <div className="min-h-screen flex items-center justify-center bg-gray-50">
          <div className="text-center">
            <h1 className="text-2xl font-bold mb-4">Página não encontrada</h1>
            <p className="text-gray-600 mb-6">A página que você procura não existe.</p>
            <button 
              onClick={() => window.location.href = '/'}
              className="bg-primary text-white px-6 py-2 rounded-md hover:bg-primary/90"
            >
              Voltar ao Início
            </button>
          </div>
        </div>
      } />
    </Routes>
  );
}

export default App;
