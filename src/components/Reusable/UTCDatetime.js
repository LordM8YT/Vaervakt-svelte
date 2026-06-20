import { Typography } from '@mui/material';
import React from 'react';
import { getLocalDatetime } from '../../utilities/DatetimeUtils';

const UTCDatetime = () => {
  const localDateTime = getLocalDatetime();
  const utcTimeValue = (
    <Typography
      variant="h3"
      component="h3"
      sx={{
        fontWeight: '400',
        fontSize: { xs: '10px', sm: '12px' },
        color: 'rgba(255, 255, 255, .7)',
        lineHeight: 1,
        paddingRight: '2px',
        fontFamily: 'Poppins',
      }}
    >
      {localDateTime}
    </Typography>
  );
  return utcTimeValue;
};

export default UTCDatetime;
