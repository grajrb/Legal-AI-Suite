import { extendTheme } from '@chakra-ui/react';

const theme = extendTheme({
  config: {
    initialColorMode: 'light',
    useSystemColorMode: false,
  },
  colors: {
    brand: {
      50: '#f0f4ff',
      100: '#d9e2ff',
      200: '#c2d0ff',
      300: '#9bb0ff',
      400: '#7490ff',
      500: '#4d70ff',
      600: '#2e45d4',
      700: '#1e2aa8',
      800: '#0f177c',
      900: '#050a50',
    },
    success: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#145231',
    },
    danger: {
      50: '#fdf2f2',
      100: '#fde8e8',
      200: '#f9c3c3',
      300: '#f59e9e',
      400: '#f07979',
      500: '#eb5757',
      600: '#dd4444',
      700: '#c53030',
      800: '#9b2c2c',
      900: '#742a2a',
    },
    warning: {
      50: '#fffbeb',
      100: '#fef3c7',
      200: '#fde68a',
      300: '#fcd34d',
      400: '#fbbf24',
      500: '#f59e0b',
      600: '#d97706',
      700: '#b45309',
      800: '#92400e',
      900: '#78350f',
    },
  },
  fonts: {
    body: "'Inter', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    heading: "'Poppins', -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif",
    mono: "'Fira Code', monospace",
  },
  fontSizes: {
    xs: '0.75rem',
    sm: '0.875rem',
    md: '1rem',
    lg: '1.125rem',
    xl: '1.25rem',
    '2xl': '1.5rem',
    '3xl': '1.875rem',
    '4xl': '2.25rem',
    '5xl': '3rem',
  },
  components: {
    Button: {
      baseStyle: {
        fontWeight: '600',
        borderRadius: 'md',
        transition: 'all 0.2s',
        _focusVisible: {
          boxShadow: 'outline',
        },
      },
      variants: {
        solid: {
          bg: 'brand.500',
          color: 'white',
          _hover: {
            bg: 'brand.600',
            transform: 'translateY(-2px)',
            boxShadow: 'lg',
          },
          _active: {
            bg: 'brand.700',
          },
        },
        outline: {
          borderColor: 'brand.500',
          color: 'brand.500',
          _hover: {
            bg: 'brand.50',
          },
        },
        ghost: {
          color: 'brand.600',
          _hover: {
            bg: 'brand.50',
          },
        },
      },
      defaultProps: {
        variant: 'solid',
      },
    },
    Input: {
      baseStyle: {
        field: {
          borderRadius: 'md',
          fontSize: 'md',
          fontWeight: '500',
          transition: 'all 0.2s',
          _focusVisible: {
            borderColor: 'brand.500',
            boxShadow: '0 0 0 3px rgba(77, 112, 255, 0.1)',
          },
        },
      },
    },
    Textarea: {
      baseStyle: {
        borderRadius: 'md',
        fontSize: 'md',
        transition: 'all 0.2s',
        _focusVisible: {
          borderColor: 'brand.500',
          boxShadow: '0 0 0 3px rgba(77, 112, 255, 0.1)',
        },
      },
    },
    Card: {
      baseStyle: {
        borderRadius: 'lg',
        boxShadow: 'sm',
        transition: 'all 0.3s ease',
      },
    },
  },
  styles: {
    global: {
      body: {
        bg: 'gray.50',
        color: 'gray.900',
      },
    },
  },
});

export default theme;
