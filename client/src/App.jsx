import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Layout from './components/Layout';
import Register from './pages/Register';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Transactions from './pages/Transactions';
import Budgets from './pages/Budgets';
import Reports from './pages/Reports';
import AIInsights from './pages/AIInsights';
import RiskCenter from './pages/RiskCenter';
import Mpesa from './pages/Mpesa';
import Recurring from './pages/Recurring';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/register" element={<Register />} />
        <Route path="/login" element={<Login />} />
        <Route element={<Layout />}>
          <Route path="/" element={<Dashboard />} />
          <Route path="/transactions" element={<Transactions />} />
          <Route path="/budgets" element={<Budgets />} />
          <Route path="/reports" element={<Reports />} />
          <Route path="/ai" element={<AIInsights />} />
          <Route path="/risk" element={<RiskCenter />} />
          <Route path="/mpesa" element={<Mpesa />} />
          <Route path="/recurring" element={<Recurring />} />
        </Route>
      </Routes>
    </BrowserRouter>
  );
}
