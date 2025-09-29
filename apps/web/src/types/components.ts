import { SvgIconProps, AlertColor, SxProps, Theme } from '@mui/material';
import { ScheduleGameView } from '@ultiverse/shared-types';

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
    drawerWidth: number;
    open: boolean;
    onClose: () => void;
    onOpen: () => void;
}

export interface TopBarProps {
    drawerWidth: number;
    open: boolean;
    onMenuClick: () => void;
}

export interface SectionProps {
    children: React.ReactNode;
    title?: string;
    subtitle?: string;
    actions?: React.ReactNode;
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
    title: string;
    message: string;
    confirmText?: string;
    cancelText?: string;
    onConfirm: () => void;
    onCancel: () => void;
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