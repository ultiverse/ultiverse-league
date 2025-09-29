import { useEffect } from 'react';
import {
    Box,
    Typography,
    Stack,
    Alert,
    Breadcrumbs,
    Link,
} from '@mui/material';
import { Helmet } from 'react-helmet-async';
import { PageProps } from '../types/components';

export function Page({
    children,
    title,
    subtitle,
    actions,
    alerts = [],
    breadcrumbs,
    meta,
    // loading: _loading = false, // Reserved for future use
    sx,
    maxWidth = 'xl',
}: PageProps) {
    // Update document title when component mounts or title changes
    useEffect(() => {
        if (meta?.title) {
            document.title = meta.title;
        } else {
            document.title = title;
        }
    }, [title, meta?.title]);

    const pageTitle = meta?.title || title;
    const pageDescription = meta?.description;

    return (
        <>
            {/* SEO Meta Tags */}
            <Helmet>
                <title>{pageTitle}</title>
                {pageDescription && (
                    <meta name="description" content={pageDescription} />
                )}
                {meta?.keywords && (
                    <meta name="keywords" content={meta.keywords} />
                )}
                {meta?.ogTitle && (
                    <meta property="og:title" content={meta.ogTitle} />
                )}
                {meta?.ogDescription && (
                    <meta property="og:description" content={meta.ogDescription} />
                )}
                {meta?.ogImage && (
                    <meta property="og:image" content={meta.ogImage} />
                )}
                {meta?.canonicalUrl && (
                    <link rel="canonical" href={meta.canonicalUrl} />
                )}
            </Helmet>

            <Box
                sx={{
                    p: 3,
                    maxWidth: maxWidth ? `${maxWidth}.breakpoint` : 'none',
                    mx: maxWidth ? 'auto' : undefined,
                    width: '100%',
                    ...sx,
                }}
            >
                {/* Breadcrumbs */}
                {breadcrumbs && breadcrumbs.length > 0 && (
                    <Breadcrumbs sx={{ mb: 2 }}>
                        {breadcrumbs.map((crumb, index) => {
                            const isLast = index === breadcrumbs.length - 1;

                            if (isLast || (!crumb.href && !crumb.onClick)) {
                                return (
                                    <Typography
                                        key={index}
                                        color={isLast ? 'text.primary' : 'text.secondary'}
                                        variant="body2"
                                    >
                                        {crumb.label}
                                    </Typography>
                                );
                            }

                            return (
                                <Link
                                    key={index}
                                    color="inherit"
                                    href={crumb.href}
                                    onClick={crumb.onClick}
                                    sx={{ cursor: (crumb.href || crumb.onClick) ? 'pointer' : 'default' }}
                                    variant="body2"
                                >
                                    {crumb.label}
                                </Link>
                            );
                        })}
                    </Breadcrumbs>
                )}

                {/* Page Header */}
                <Box
                    sx={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'flex-start',
                        mb: 3,
                        flexWrap: 'wrap',
                        gap: 2,
                    }}
                >
                    <Box sx={{ minWidth: 0, flex: 1 }}>
                        <Typography variant="h4" component="h1" gutterBottom>
                            {title}
                        </Typography>
                        {subtitle && (
                            <Typography variant="body1" color="text.secondary">
                                {subtitle}
                            </Typography>
                        )}
                    </Box>

                    {actions && (
                        <Box sx={{ flexShrink: 0 }}>
                            <Stack direction="row" spacing={1} flexWrap="wrap">
                                {actions}
                            </Stack>
                        </Box>
                    )}
                </Box>

                {/* Page Alerts */}
                {alerts.length > 0 && (
                    <Stack spacing={2} sx={{ mb: 3 }}>
                        {alerts.map((alert) => (
                            <Alert
                                key={alert.id}
                                severity={alert.severity}
                                onClose={alert.onClose}
                                action={alert.action}
                                variant='outlined'
                                sx={{
                                    bgcolor: 'background.paper',
                                    borderRadius: 1,
                                }}
                            >
                                {alert.message}
                            </Alert>
                        ))}
                    </Stack>
                )}

                {/* Page Content */}
                {children && (
                    <Box>
                        {children}
                    </Box>
                )}
            </Box>
        </>
    );
}

export default Page;