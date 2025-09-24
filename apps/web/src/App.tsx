import { useState } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CssBaseline, Modal, Backdrop, Fade, Toolbar, ThemeProvider, useTheme } from '@mui/material';
import { Sidebar } from './components/Sidebar';
import { TopBar } from './components/TopBar';
import { LeagueProvider } from './context/LeagueContext';
import { UserProvider } from './context/UserContext';
import { useLeague } from './hooks/useLeague';
import { Leagues } from './pages/Leagues';
import { Teams } from './pages/Teams';
import { Games } from './pages/Games';
import { Settings } from './pages/Settings';
import { theme } from './theme/theme';

function AppContent() {
    const theme = useTheme();
    const { selectedLeague } = useLeague();
    const [showLeagueModal, setShowLeagueModal] = useState(false);

    const handleLeagueClick = () => {
        setShowLeagueModal(true);
    };

    const handleCloseModal = () => {
        setShowLeagueModal(false);
    };

    return (
        <Box sx={{ display: 'flex' }}>
            <CssBaseline />
            <TopBar />
            <Sidebar
                selectedLeague={selectedLeague}
                onLeagueClick={handleLeagueClick}
            />
            <Box
                component="main"
                sx={{
                    flexGrow: 1,
                    width: { sm: 'calc(100% - 280px)' },
                    bgcolor: theme.palette.background.page,
                    minHeight: '100vh'
                }}
            >
                <Toolbar />
                <Routes>
                    <Route path="/" element={<Navigate to="/teams" replace />} />
                    <Route path="/leagues" element={<Leagues />} />
                    <Route path="/teams" element={<Teams />} />
                    <Route path="/games" element={<Games />} />
                    <Route path="/settings" element={<Settings />} />
                </Routes>
            </Box>

            <Modal
                open={showLeagueModal}
                onClose={handleCloseModal}
                closeAfterTransition
                BackdropComponent={Backdrop}
                BackdropProps={{
                    timeout: 500,
                }}
            >
                <Fade in={showLeagueModal}>
                    <Box
                        sx={{
                            position: 'absolute',
                            top: '50%',
                            left: '50%',
                            transform: 'translate(-50%, -50%)',
                            width: '90%',
                            maxWidth: 800,
                            bgcolor: 'background.paper',
                            boxShadow: 24,
                            borderRadius: 2,
                            maxHeight: '80vh',
                            overflow: 'auto',
                        }}
                    >
                        <Leagues onLeagueSelect={handleCloseModal} />
                    </Box>
                </Fade>
            </Modal>
        </Box>
    );
}

export function App() {
    return (
        <ThemeProvider theme={theme}>
            <UserProvider>
                <LeagueProvider>
                    <Router>
                        <AppContent />
                    </Router>
                </LeagueProvider>
            </UserProvider>
        </ThemeProvider>
    );
}
