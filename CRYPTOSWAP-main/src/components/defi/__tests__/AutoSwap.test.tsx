import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { AutoSwap } from '../AutoSwap';
import { I18nextProvider } from 'react-i18next';
import i18n from '@/lib/test-i18n';

describe('AutoSwap', () => {
  it('renderiza correctamente y permite interacción básica', () => {
    render(
      <I18nextProvider i18n={i18n}>
        <AutoSwap />
      </I18nextProvider>
    );

    // Verifica que el título y el switch estén presentes
    expect(screen.getByText(/Auto-Swap/i)).toBeInTheDocument();
    const switchInput = screen.getByRole('checkbox');
    expect(switchInput).toBeInTheDocument();
    expect(switchInput).not.toBeChecked();

    // Activa el switch
    fireEvent.click(switchInput);
    expect(switchInput).toBeChecked();

    // Selecciona un token adicional
    const bonkButton = screen.getByText('BONK');
    fireEvent.click(bonkButton);
    expect(bonkButton).toHaveClass('bg-primary');

    // Cambia el stablecoin destino
    fireEvent.mouseDown(screen.getByText('USD Coin'));
    fireEvent.click(screen.getByText('Tether'));
    expect(screen.getByText('Tether')).toBeInTheDocument();

    // Cambia el slippage
    const slippageInput = screen.getByRole('spinbutton');
    fireEvent.change(slippageInput, { target: { value: '1.5' } });
    expect(slippageInput).toHaveValue(1.5);

    // Guarda la configuración
    const saveButton = screen.getByRole('button', { name: /save/i });
    fireEvent.click(saveButton);
    expect(saveButton).toBeDisabled();
  });
}); 