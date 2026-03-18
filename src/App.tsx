import { createContext, useContext } from 'react';
import { Routes, Route, useLocation } from 'react-router-dom';
import { AnimatePresence } from 'framer-motion';
import { useBenchmarkData } from './hooks/useBenchmarkData';
import type { BenchmarkDataResult } from './hooks/useBenchmarkData';
import Layout from './components/Layout';
import OverviewPage from './pages/OverviewPage';
import LeaderboardPage from './pages/LeaderboardPage';
import CategoryPage from './pages/CategoryPage';
import TaskComparisonPage from './pages/TaskComparisonPage';
import EfficiencyPage from './pages/EfficiencyPage';

// Data Context
export type DataContextValue = Pick<
  BenchmarkDataResult,
  'reports' | 'categoryData' | 'taskMatrix' | 'efficiencyData' | 'loading'
>;

const defaultContextValue: DataContextValue = {
  reports: [],
  categoryData: {},
  taskMatrix: [],
  efficiencyData: [],
  loading: true,
};

export const DataContext = createContext<DataContextValue>(defaultContextValue);

export function useDataContext(): DataContextValue {
  return useContext(DataContext);
}

export default function App() {
  const { reports, categoryData, taskMatrix, efficiencyData, loading } = useBenchmarkData();
  const location = useLocation();

  const contextValue: DataContextValue = {
    reports,
    categoryData,
    taskMatrix,
    efficiencyData,
    loading,
  };

  return (
    <DataContext.Provider value={contextValue}>
      <Layout>
        <AnimatePresence mode="wait">
          <Routes location={location} key={location.pathname}>
            <Route path="/" element={<OverviewPage />} />
            <Route path="/leaderboard" element={<LeaderboardPage />} />
            <Route path="/category" element={<CategoryPage />} />
            <Route path="/tasks" element={<TaskComparisonPage />} />
            <Route path="/efficiency" element={<EfficiencyPage />} />
          </Routes>
        </AnimatePresence>
      </Layout>
    </DataContext.Provider>
  );
}
