import { BrowserRouter, Navigate, Route, Routes, useParams } from 'react-router-dom';
import { LandingPage } from '@/pages/landing';
import { BuilderPage } from '@/pages/builder';
import { isStack } from '@/shared/types';

const BuilderRouteGuard = () => {
  const { stack } = useParams<{ stack: string }>();
  if (stack === undefined || !isStack(stack)) {
    return <Navigate to="/" replace />;
  }
  return <BuilderPage />;
};

export const App = () => (
  <BrowserRouter>
    <Routes>
      <Route path="/" element={<LandingPage />} />
      <Route path="/builder/:stack" element={<BuilderRouteGuard />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  </BrowserRouter>
);
