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
    Sports as SportsIcon,
    Games as GamesIcon,
    Settings as SettingsIcon,
    ArrowDropDown as ArrowDropDownIcon,
} from '@mui/icons-material';
import { Link, useLocation } from 'react-router-dom';
import { LeagueSummary } from '../api/uc';

const DRAWER_WIDTH = 280;

interface SidebarProps {
    selectedLeague: LeagueSummary | null;
    onLeagueClick: () => void;
}

export function Sidebar({ selectedLeague, onLeagueClick }: SidebarProps) {
    const location = useLocation();

    const menuItems = [
        { path: '/teams', label: 'Teams', icon: <SportsIcon /> },
        { path: '/games', label: 'Schedule', icon: <GamesIcon /> },
        { path: '/settings', label: 'Settings', icon: <SettingsIcon /> },
    ];

    return (
        <Drawer
            variant="permanent"
            sx={{
                width: DRAWER_WIDTH,
                flexShrink: 0,
                '& .MuiDrawer-paper': {
                    width: DRAWER_WIDTH,
                    boxSizing: 'border-box',
                    backgroundColor: '#161919',
                    color: 'white',
                },
            }}
        >
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
                        <Typography variant="body2" sx={{ color: 'rgba(255, 255, 255, 0.7)' }} noWrap>
                            League
                        </Typography>
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
                            disabled={!selectedLeague}
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
        </Drawer>
    );
}