// Example styles using CSS-in-TS compiler with parameter-based API

import { style, cx } from '@cssints/compiler';
import { createSizes, createMedia } from '@cssints/compiler';
import {
  flex,
  alignItems,
  justifyContent,
  fontBold,
  bg,
  textCol,
  cursor,
  transition,
  scale,
  hover,
} from '@cssints/compiler';
import { token } from '@cssints/compiler';

const { p, px, text, rounded } = createSizes();

const { sm, md, lg } = createMedia({
  sm: 'screen and (min-width: 640px)',
  md: 'screen and (min-width: 768px)',
  lg: 'screen and (min-width: 1024px)',
});

// Button component style
export const button = style('button', {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.75rem 1.5rem',
  backgroundColor: token('color.primary'),
  color: 'white',
  borderRadius: token('borderRadius.DEFAULT'),
  fontWeight: 'bold',
  cursor: 'pointer',
  transition: 'all 150ms ease-in-out',
  '&:hover': {
    backgroundColor: token('color.secondary'),
    transform: 'scale(1.05)',
  },
  '&:active': {
    transform: 'scale(0.98)',
  },
});

// Card component style
export const card = style('card', {
  display: 'flex',
  flexDirection: 'column',
  padding: '1rem',
  backgroundColor: 'white',
  borderRadius: '0.5rem',
  boxShadow: token('shadow.DEFAULT'),
  '@media (min-width: 768px)': {
    padding: '1.5rem',
    borderRadius: '0.75rem',
  },
  '@media (min-width: 1024px)': {
    padding: '2rem',
  },
});

// Heading style
export const heading = cx(
  text(6),
  fontBold(),
  textCol(token('color.neutral.900')),
  md(text(8)),
  lg(text(10))
);

// Container style
export const container = style('container', {
  maxWidth: '1280px',
  margin: '0 auto',
  padding: token('spacing.4'),
  backgroundColor: token('color.neutral.50'),
});

// Input component style
export const input = style('input', {
  width: '100%',
  padding: '0.5rem 1rem',
  fontSize: '1rem',
  border: `1px solid ${token('color.neutral.300')}`,
  borderRadius: token('borderRadius.DEFAULT'),
  backgroundColor: 'white',
  transition: 'border-color 150ms ease-in-out, box-shadow 150ms ease-in-out',
  '&:focus': {
    outline: 'none',
    borderColor: token('color.primary'),
    boxShadow: `0 0 0 3px ${token('color.primary')}33`,
  },
});

// Badge component style
export const badge = style('badge', {
  position: 'relative',
  display: 'inline-flex',
  alignItems: 'center',
  padding: '0.25rem 0.75rem',
  backgroundColor: token('color.success'),
  color: 'white',
  fontSize: '0.75rem',
  fontWeight: '600',
  borderRadius: '9999px',
  '&::before': {
    content: '""',
    position: 'absolute',
    top: '-2px',
    left: '-2px',
    right: '-2px',
    bottom: '-2px',
    border: `2px solid ${token('color.success')}`,
    borderRadius: '9999px',
    opacity: '0.5',
  },
});

// Responsive padding utility
export const responsivePadding = cx(
  p(2),
  sm(p(4)),
  md(p(6)),
  lg(p(8))
);

// Example using parameter-based utilities
export const flexRowWrap = cx(
  flex(),
  alignItems('center'),
  justifyContent('center')
);

export const customFlex = style('customFlex', {
  display: 'flex',
  flexDirection: 'row',
  flexWrap: 'wrap',
  justifyContent: 'space-between',
  alignItems: 'center',
  gap: '1rem',
});
