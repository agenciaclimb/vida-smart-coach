import React from 'react';

const AuthCallbackPage = () => {
  return (
    <div className="flex flex-col justify-center items-center h-screen bg-slate-50">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
        <p className="mt-4 text-lg text-gray-700">Finalizando autenticação...</p>
        <p className="text-sm text-gray-500">Você será redirecionado em breve.</p>
      </div>
    </div>
  );
};

export default AuthCallbackPage;