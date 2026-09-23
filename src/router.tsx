import { HashRouter, Routes, Route } from 'react-router-dom'
import { HomePage } from './pages/HomePage'
import { EditorPage } from './pages/EditorPage'
import { CustomizePage } from './pages/CustomizePage'
import { ViewerPage } from './pages/ViewerPage'

export function AppRouter() {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<HomePage />} />
        <Route path="/create" element={<EditorPage />} />
        <Route path="/customize" element={<CustomizePage />} />
        <Route path="/view/:data" element={<ViewerPage />} />
      </Routes>
    </HashRouter>
  )
}
