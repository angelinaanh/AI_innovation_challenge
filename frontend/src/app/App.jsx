import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";

import { StudentShell } from "../components/layout/StudentShell.jsx";
import { DashboardPage } from "../features/student-dashboard/DashboardPage.jsx";
import { LearningPathPage } from "../features/learning-path/LearningPathPage.jsx";
import { StudentDataProvider } from "./StudentDataProvider.jsx";

export function App() {
  return (
    <BrowserRouter>
      <StudentDataProvider>
        <Routes>
          <Route element={<StudentShell />}>
            <Route path="/student" element={<DashboardPage />} />
            <Route path="/student/path" element={<LearningPathPage />} />
          </Route>
          <Route path="*" element={<Navigate to="/student" replace />} />
        </Routes>
      </StudentDataProvider>
    </BrowserRouter>
  );
}
