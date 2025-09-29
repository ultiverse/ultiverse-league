import { SvgIconProps, AlertColor, SxProps, Theme } from '@mui/material';
import { ScheduleGameView } from '@ultiverse/shared-types';
import { LeagueSummary } from './api';

export interface GameCardProps {
    game: ScheduleGameView;
    homeTeamName: string;
    awayTeamName: string;
    homeTeamColor?: string;
    awayTeamColor?: string;
    venue?: string;
    fieldSlot?: string;
    onClick?: () => void;
}

export interface SidebarProps {
    selectedLeague: LeagueSummary | null;
    onLeagueClick: () => void;
    mobileOpen: boolean;
    onMobileClose: () => void;
}

export interface TopBarProps {
    onMenuClick?: () => void;
}

export interface SectionProps {
    title?: string;
    children: React.ReactNode;
}

export interface TeamNameProps {
    name: string;
    primaryColor?: string;
    size?: 'sm' | 'md' | 'lg';
    variant?: 'inline' | 'chip';
    onClick?: () => void;
    subtitle?: string;
    sx?: SxProps<Theme>;
}

export interface ConfirmationDialogProps {
    open: boolean;
    onClose: () => void;
    onConfirm: () => void;
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    confirmColor?: 'primary' | 'secondary' | 'error' | 'warning' | 'info' | 'success';
    maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
}

export type JerseyIconProps = SvgIconProps;

export interface BreadcrumbItem {
    label: string;
    href?: string;
    onClick?: () => void;
}

export interface PageAlert {
    id: string;
    severity: AlertColor;
    message: string;
    action?: React.ReactNode;
    onClose?: () => void;
}

export interface PageMeta {
    title: string;
    description?: string;
    keywords?: string;
    ogTitle?: string;
    ogDescription?: string;
    ogImage?: string;
    canonicalUrl?: string;
}

export interface PageProps {
    children?: React.ReactNode;
    title: string;
    subtitle?: string;
    actions?: React.ReactNode;
    alerts?: PageAlert[];
    breadcrumbs?: BreadcrumbItem[];
    meta?: Partial<PageMeta>;
    loading?: boolean;
    sx?: SxProps<Theme>;
    maxWidth?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | false;
}

export interface LeaguesProps {
    onLeagueSelect: (leagueId: string) => void;
    selectedLeagueId?: string;
}