import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import MainMenu from './pages/MainMenu/MainMenu';
import CharacterCreate from './pages/CharacterCreate/CharacterCreate';
import Prologue from './pages/Prologue/Prologue';
import Game from './pages/Game/Game';
import ChapterEnd from './pages/ChapterEnd/ChapterEnd';
import EndingGallery from './pages/EndingGallery/EndingGallery';
import Credits from './pages/Credits/Credits';

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/" element={<MainMenu />} />
        <Route path="/create" element={<CharacterCreate />} />
        <Route path="/prologue" element={<Prologue />} />
        <Route path="/game" element={<Game />} />
        <Route path="/chapter-end" element={<ChapterEnd />} />
        <Route path="/endings" element={<EndingGallery />} />
        <Route path="/credits" element={<Credits />} />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </BrowserRouter>
  );
}
