import React from 'react';
import Box from './Box';
import { Theme } from '../../theme';

interface Segment {
  value: number;
  color: keyof Theme['colors'];
}

interface ProgressBarProps {
  segments: Segment[];
  height?: number;
}

/** Segmented progress bar with multiple color sections */
const ProgressBar = React.memo(function ProgressBar({ segments, height = 8 }: ProgressBarProps) {
  const total = segments.reduce((acc, s) => acc + s.value, 0);
  if (total === 0) {
    return (
      <Box
        backgroundColor="border"
        borderRadius="round"
        style={{ height, overflow: 'hidden' }}
      />
    );
  }

  return (
    <Box
      flexDirection="row"
      borderRadius="round"
      style={{ height, overflow: 'hidden' }}
      backgroundColor="border"
    >
      {segments.map((seg, idx) => {
        const percent = (seg.value / total) * 100;
        if (percent === 0) return null;
        return (
          <Box
            key={idx}
            backgroundColor={seg.color}
            style={{ width: `${percent}%` }}
          />
        );
      })}
    </Box>
  );
});

export default ProgressBar;
