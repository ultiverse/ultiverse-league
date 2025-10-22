import { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { Box, CssBaseline, Modal, Backdrop, Fade, ThemeProvider, useTheme } from '@mui/material';
import { HelmetProvider } from 'react-helmet-async';
import { Sidebar } from './components/Layout/Sidebar.component';
import { TopBar } from './components/Layout/TopBar.component';
import { LeagueProvider } from './context/LeagueContext';
import { UserProvider } from './context/UserContext';
import { IntegrationContextProvider } from './context/IntegrationContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { useLeague } from './hooks/useLeague';
import { useLastUrl, useInitialRedirect } from './hooks/useLastUrl';
import { DashboardPage } from './pages/Dashboard.page';
import { Leagues } from './pages/Leagues.page';
import { LeaguesListPage } from './pages/LeaguesListPage';
import { LoginPage } from './pages/Login.page';
import { Teams } from './pages/Teams.page';
import { Games } from './pages/Games.page';
import { Settings } from './pages/Settings.page';
import { ProfilePage } from './pages/Profile.page';
import { AccountPage } from './pages/Account.page';
import { IntegrationsPage } from './pages/Integrations.page';
import { NotFoundPage } from './pages/NotFound.page';
import { theme } from './theme/theme';

function ProtectedRoute({ children }: { children: React.ReactNode }) {
    const { isAuthenticated } = useAuth();
    return isAuthenticated ? <>{children}</> : <Navigate to="/login" replace />;
}

function AppContent() {
    const theme = useTheme();
    const { selectedLeague } = useLeague();
    const [showLeagueModal, setShowLeagueModal] = useState(false);
    const [mobileOpen, setMobileOpen] = useState(false);
    const { redirectToLastUrl } = useInitialRedirect();

    // Track URL changes for persistence
    useLastUrl();

    // Redirect to last URL on initial load
    useEffect(() => {
        redirectToLastUrl();
    }, []);

    const handleLeagueClick = () => {
        setShowLeagueModal(true);
    };

    const handleCloseModal = () => {
        setShowLeagueModal(false);
    };

    const handleDrawerToggle = () => {
        setMobileOpen(!mobileOpen);
    };

    const handleMobileClose = () => {
        setMobileOpen(false);
    };

    return (
        <Routes>
            {/* Public route */}
            <Route path="/login" element={<LoginPage />} />

            {/* Protected routes */}
            <Route
                path="/*"
                element={
                    <ProtectedRoute>
                        <Box sx={{ display: 'flex' }}>
                            <CssBaseline />
                            <Sidebar
                                selectedLeague={selectedLeague}
                                onLeagueClick={handleLeagueClick}
                                mobileOpen={mobileOpen}
                                onMobileClose={handleMobileClose}
                            />
                            <Box
                                component="main"
                                sx={{
                                    flexGrow: 1,
                                    display: 'flex',
                                    flexDirection: 'column',
                                    bgcolor: theme.palette.background.page,
                                    minHeight: '100vh'
                                }}
                            >
                                <TopBar onMenuClick={handleDrawerToggle} />
                                <Box sx={{ flexGrow: 1 }}>
                                    <Routes>
                                        <Route path="/" element={<LeaguesListPage />} />
                                        <Route path="/leagues" element={<LeaguesListPage />} />
                                        <Route path="/dashboard" element={<DashboardPage />} />
                                        <Route path="/teams" element={<Teams />} />
                                        <Route path="/games" element={<Games />} />
                                        <Route path="/profile" element={<ProfilePage />} />
                                        <Route path="/account" element={<AccountPage />} />
                                        <Route path="/integrations" element={<IntegrationsPage />} />
                                        <Route path="/settings" element={<Settings />} />
                                        <Route path="*" element={<NotFoundPage />} />
                                    </Routes>
                                </Box>
                            </Box>

                            <Modal
                                open={showLeagueModal}
                                onClose={handleCloseModal}
                                closeAfterTransition
                                slots={{ backdrop: Backdrop }}
                                slotProps={{
                                    backdrop: {
                                        timeout: 500,
                                    },
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
                    </ProtectedRoute>
                }
            />
        </Routes>
    );
}

export function App() {
    return (
        <HelmetProvider>
            <ThemeProvider theme={theme}>
                <AuthProvider>
                    <UserProvider>
                        <IntegrationContextProvider>
                            <LeagueProvider>
                                <Router>
                                    <AppContent />
                                </Router>
                            </LeagueProvider>
                        </IntegrationContextProvider>
                    </UserProvider>
                </AuthProvider>
            </ThemeProvider>
        </HelmetProvider>
    );
}
