import {
    Box,
    Drawer,
    List,
    ListItem,
    ListItemButton,
    ListItemIcon,
    ListItemText,
    Typography,
    Divider,
    Button,
} from '@mui/material';
import {
    Groups as GroupsIcon,
    CalendarMonth as CalendarMonthIcon,
    Settings as SettingsIcon,
    ArrowDropDown as ArrowDropDownIcon,
} from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';
import { SidebarProps } from '../../types/components';
import { SourceBadge } from '../SourceBadge.component';

const DRAWER_WIDTH = 280;

export function Sidebar({ selectedLeague, onLeagueClick, mobileOpen, onMobileClose }: SidebarProps) {
    const location = useLocation();

    const menuItems = [
        { path: '/teams', label: 'Teams', icon: <GroupsIcon /> },
        { path: '/games', label: 'Schedule', icon: <CalendarMonthIcon /> },
        { path: '/settings', label: 'Settings', icon: <SettingsIcon /> },
    ];

    const drawerContent = (
        <Box>
            <Box sx={{ p: 2 }}>
                <Box sx={{ mb: 2, display: 'flex', justifyContent: 'center' }}>
                    <img
                        src="/ultiverse-logo-on-dark.png"
                        alt="Ultiverse League"
                        style={{
                            height: '60px',
                            width: 'auto',
                        }}
                    />
                </Box>

                <Button
                    fullWidth
                    variant="outlined"
                    onClick={onLeagueClick}
                    endIcon={<ArrowDropDownIcon />}
                    sx={{
                        justifyContent: 'space-between',
                        textAlign: 'left',
                        mb: 2,
                        borderColor: 'rgba(255, 255, 255, 0.3)',
                        color: 'white',
                        '&:hover': {
                            borderColor: 'rgba(255, 255, 255, 0.5)',
                            backgroundColor: 'rgba(255, 255, 255, 0.1)',
                        },
                    }}
                >
                    <Box sx={{ textAlign: 'left', overflow: 'hidden' }}>
                        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mb: 0.5 }}>
                            <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }} noWrap>
                                League
                            </Typography>
                            {selectedLeague && (
                                <SourceBadge
                                    source={selectedLeague.source}
                                    integrationProvider={selectedLeague.integrationProvider}
                                    size="small"
                                    showText={false}
                                />
                            )}
                        </Box>
                        <Typography variant="body1" noWrap>
                            {selectedLeague?.name || 'Select League'}
                        </Typography>
                    </Box>
                </Button>
            </Box>

            <Divider sx={{ borderColor: 'rgba(255, 255, 255, 0.2)' }} />

            <List>
                {menuItems.map((item) => (
                    <ListItem key={item.path} disablePadding>
                        <ListItemButton
                            component={Link}
                            to={item.path}
                            selected={location.pathname === item.path}
                            disabled={!selectedLeague && (item.path === '/teams' || item.path === '/games')}
                            onClick={onMobileClose}
                            sx={{
                                color: 'white',
                                '&.Mui-selected': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.1)',
                                    '&:hover': {
                                        backgroundColor: 'rgba(255, 255, 255, 0.15)',
                                    },
                                },
                                '&:hover': {
                                    backgroundColor: 'rgba(255, 255, 255, 0.05)',
                                },
                                '&.Mui-disabled': {
                                    color: 'rgba(255, 255, 255, 0.3)',
                                },
                            }}
                        >
                            <ListItemIcon sx={{ color: 'inherit' }}>{item.icon}</ListItemIcon>
                            <ListItemText primary={item.label} />
                        </ListItemButton>
                    </ListItem>
                ))}
            </List>
        </Box>
    );

    return (
        <Box
            component="nav"
            sx={{
                width: {
                    md: mobileOpen ? DRAWER_WIDTH : 0,
                    lg: DRAWER_WIDTH
                },
                flexShrink: { md: 0, lg: 0 },
                transition: 'width 0.3s ease'
            }}
        >
            {/* Small screens: Temporary overlay drawer */}
            <Drawer
                variant="temporary"
                open={mobileOpen}
                onClose={onMobileClose}
                ModalProps={{
                    keepMounted: true, // Better open performance on mobile
                }}
                sx={{
                    display: { xs: 'block', md: 'none' },
                    '& .MuiDrawer-paper': {
                        width: DRAWER_WIDTH,
                        boxSizing: 'border-box',
                        backgroundColor: '#161919',
                        color: 'white',
                    },
                }}
            >
                {drawerContent}
            </Drawer>

            {/* Medium screens: Toggleable permanent drawer */}
            <Drawer
                variant="permanent"
                sx={{
                    display: { xs: 'none', md: 'block', lg: 'none' },
                    '& .MuiDrawer-paper': {
                        width: mobileOpen ? DRAWER_WIDTH : 0,
                        boxSizing: 'border-box',
                        backgroundColor: '#161919',
                        color: 'white',
                        overflow: 'hidden',
                        transition: 'width 0.3s ease',
                    },
                }}
                open
            >
                {drawerContent}
            </Drawer>

            {/* Large screens: Always visible permanent drawer */}
            <Drawer
                variant="permanent"
                sx={{
                    display: { xs: 'none', md: 'none', lg: 'block' },
                    '& .MuiDrawer-paper': {
                        width: DRAWER_WIDTH,
                        boxSizing: 'border-box',
                        backgroundColor: '#161919',
                        color: 'white',
                    },
                }}
                open
            >
                {drawerContent}
            </Drawer>
        </Box>
    );
}