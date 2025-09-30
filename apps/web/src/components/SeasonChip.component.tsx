import { Chip, ChipProps } from '@mui/material';
import { getSeason, getYear, getSeasonColor } from '../helpers/season.helper';

interface SeasonChipProps extends Omit<ChipProps, 'label' | 'color'> {
    dateStr?: string;
    showYear?: boolean;
}

export function SeasonChip({ dateStr, showYear = true, ...chipProps }: SeasonChipProps) {
    const season = getSeason(dateStr);
    const year = getYear(dateStr);
    const color = getSeasonColor(season);

    const label = showYear ? `${season} ${year}` : season;

    return (
        <Chip
            label={label}
            color={color}
            size="small"
            variant="outlined"
            {...chipProps}
        />
    );
}