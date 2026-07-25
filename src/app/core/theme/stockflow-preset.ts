import { definePreset } from '@primeuix/themes';
import Aura from '@primeuix/themes/aura';

/**
 * StockFlow brand theme: green, black and white.
 *
 * - primary  -> the green ramp (accents, buttons, links, highlights)
 * - surface  -> a neutral black/white ramp (backgrounds, borders, text)
 *
 * Keep the raw values here only. Everything else in the app should read the
 * brand through the CSS variables in styles.css (--brand-*) or the PrimeNG
 * tokens (--p-primary-*, --p-surface-*) so a future palette change is a
 * one-file edit.
 */
export const StockflowPreset = definePreset(Aura, {
  semantic: {
    primary: {
      50: '#f0fdf4',
      100: '#dcfce7',
      200: '#bbf7d0',
      300: '#86efac',
      400: '#4ade80',
      500: '#22c55e',
      600: '#16a34a',
      700: '#15803d',
      800: '#166534',
      900: '#14532d',
      950: '#052e16',
    },

    colorScheme: {
      light: {
        surface: {
          0: '#ffffff',
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
          950: '#09090b',
        },

        primary: {
          color: '{primary.600}',
          contrastColor: '#ffffff',
          hoverColor: '{primary.700}',
          activeColor: '{primary.800}',
        },

        highlight: {
          background: '{primary.50}',
          focusBackground: '{primary.100}',
          color: '{primary.800}',
          focusColor: '{primary.900}',
        },

        text: {
          color: '{surface.900}',
          hoverColor: '{surface.950}',
          mutedColor: '{surface.500}',
          hoverMutedColor: '{surface.600}',
        },

        content: {
          background: '{surface.0}',
          borderColor: '{surface.200}',
        },

        formField: {
          background: '{surface.0}',
          borderColor: '{surface.300}',
          hoverBorderColor: '{primary.400}',
          focusBorderColor: '{primary.600}',
          color: '{surface.900}',
          placeholderColor: '{surface.400}',
        },
      },

      dark: {
        surface: {
          0: '#ffffff',
          50: '#fafafa',
          100: '#f4f4f5',
          200: '#e4e4e7',
          300: '#d4d4d8',
          400: '#a1a1aa',
          500: '#71717a',
          600: '#52525b',
          700: '#3f3f46',
          800: '#27272a',
          900: '#18181b',
          950: '#09090b',
        },

        primary: {
          color: '{primary.400}',
          contrastColor: '{surface.950}',
          hoverColor: '{primary.300}',
          activeColor: '{primary.200}',
        },

        highlight: {
          background: 'color-mix(in srgb, {primary.400}, transparent 84%)',
          focusBackground: 'color-mix(in srgb, {primary.400}, transparent 76%)',
          color: '{primary.300}',
          focusColor: '{primary.200}',
        },
      },
    },
  },
});
