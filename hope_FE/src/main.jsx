import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './App.jsx';
import './index.css';
// 1. 필요한 모듈들을 @tanstack/react-query에서 가져옵니다.
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';

// 2. QueryClient의 새 인스턴스를 생성합니다.
const queryClient = new QueryClient();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    {/* 3. <App /> 컴포넌트를 <QueryClientProvider>로 감싸줍니다. */}
    <QueryClientProvider client={queryClient}>
      <App />
    </QueryClientProvider>
  </React.StrictMode>
);