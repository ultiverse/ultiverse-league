import React from 'react';
import {
    Box,
    Typography,
    Stack,
    Chip,
    alpha,
} from '@mui/material';
import { JerseyIcon } from '@/assets/jersey-icon';
import { TeamNameProps } from '@/types/components';


export function TeamName({
    name,
    primaryColor = '#000000',
    size = 'md',
    variant = 'inline',
    onClick,
    subtitle,
    sx,
}: TeamNameProps) {
    const dims = sizeMap[size];

    const Content = (
        <Stack
            direction="row"
            spacing={dims.gap}
            alignItems="center"
            sx={{ minWidth: 0 }}
        >
            <JerseyIcon
                color={primaryColor}
                sx={{
                    fontSize: dims.icon,
                    flexShrink: 0,
                }}
            />
            <Box sx={{ minWidth: 0 }}>
                <Typography
                    variant={dims.titleVariant}
                    fontWeight={600}
                    noWrap
                    title={name}
                >
                    {name}
                </Typography>
                {subtitle && size === 'lg' && (
                    <Typography
                        variant="caption"
                        color="text.secondary"
                        sx={{ lineHeight: 1 }}
                        noWrap
                    >
                        {subtitle}
                    </Typography>
                )}
            </Box>
        </Stack>
    );

    if (variant === 'chip') {
        return (
            <Chip
                onClick={onClick}
                clickable={Boolean(onClick)}
                icon={
                    <JerseyIcon
                        color={primaryColor}
                        sx={{
                            fontSize: 16,
                        }}
                    />
                }
                label={
                    <Typography variant="body2" fontWeight={600} noWrap>
                        {name}
                    </Typography>
                }
                sx={{
                    '.MuiChip-icon': { mr: 0.5 },
                    borderRadius: 1,
                    bgcolor: (t) => alpha(t.palette.text.primary, 0.04),
                    ...sx,
                }}
            />
        );
    }

    return (
        <Box
            role={onClick ? 'button' : undefined}
            onClick={onClick}
            sx={{
                cursor: onClick ? 'pointer' : 'default',
                '&:hover': onClick
                    ? { opacity: 0.8 }
                    : undefined,
                transition: 'opacity 120ms ease',
                ...sx,
            }}
        >
            {Content}
        </Box>
    );
}

const sizeMap = {
    sm: { icon: 18, gap: 0.75, titleVariant: 'body2' as const },
    md: { icon: 22, gap: 1, titleVariant: 'body1' as const },
    lg: { icon: 28, gap: 1.25, titleVariant: 'h6' as const },
};

export default TeamName;