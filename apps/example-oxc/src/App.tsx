import { style, cx } from '@cssints/compiler';
import { createSizes, createMedia } from '@cssints/compiler';
import { flex, itemsCenter, justifyContent, bg, textCol, fontBold, rounded, hover } from '@cssints/compiler';

// Create size utilities
const { p, px, py } = createSizes();

// Create responsive breakpoints
const { sm, md, lg } = createMedia({
  sm: 'screen and (min-width: 640px)',
  md: 'screen and (min-width: 768px)',
  lg: 'screen and (min-width: 1024px)',
});

// Component styles using style() API
const container = style('container', {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  minHeight: '100vh',
  padding: '2rem',
  backgroundColor: '#f5f5f5',
});

const title = style('title', {
  fontSize: '2rem',
  fontWeight: 'bold',
  color: '#1a1a1a',
  marginBottom: '1rem',
});

const button = style('button', {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  padding: '0.75rem 1.5rem',
  backgroundColor: '#3b82f6',
  color: 'white',
  borderRadius: '0.5rem',
  fontWeight: '600',
  cursor: 'pointer',
  transition: 'all 150ms ease-in-out',
  '&:hover': {
    backgroundColor: '#2563eb',
    transform: 'scale(1.05)',
  },
  '&:active': {
    transform: 'scale(0.98)',
  },
});

const card = style('card', {
  display: 'flex',
  flexDirection: 'column',
  padding: '1.5rem',
  backgroundColor: 'white',
  borderRadius: '0.75rem',
  boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)',
  marginTop: '2rem',
  '@media (min-width: 768px)': {
    padding: '2rem',
    flexDirection: 'row',
  },
});

// Responsive utilities using cx()
const responsiveButton = cx(
  p(3),
  sm(p(4)),
  md(p(5)),
  lg(p(6)),
  bg('#10b981'),
  textCol('white'),
  fontBold(),
  rounded('0.5rem'),
  hover({
    backgroundColor: '#059669',
  })
);

export default function App() {
  return (
    <div className={container}>
      <h1 className={title}>css-in-ts with oxc</h1>
      
      <button className={button}>
        Click me
      </button>
      
      <div className={card}>
        <p style={{ marginRight: '1rem' }}>
          This component uses the new oxc-based Vite plugin!
        </p>
        <button className={responsiveButton}>
          Responsive Button
        </button>
      </div>
    </div>
  );
}
