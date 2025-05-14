import React from 'react';
import { render, screen, fireEvent } from '@testing-library/react';
import { Button } from '../Button';

describe('Button', () => {
  it('renderiza correctamente con las props básicas', () => {
    // Arrange
    const text = 'Click me';

    // Act
    render(<Button>{text}</Button>);

    // Assert
    expect(screen.getByRole('button')).toHaveTextContent(text);
  });

  it('maneja el estado de carga correctamente', () => {
    // Arrange
    const text = 'Loading...';

    // Act
    render(<Button isLoading>{text}</Button>);

    // Assert
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-busy', 'true');
    expect(button).toBeDisabled();
  });

  it('maneja el estado deshabilitado correctamente', () => {
    // Arrange
    const text = 'Disabled';

    // Act
    render(<Button disabled>{text}</Button>);

    // Assert
    const button = screen.getByRole('button');
    expect(button).toHaveAttribute('aria-disabled', 'true');
    expect(button).toBeDisabled();
  });

  it('llama al onClick cuando se hace clic', () => {
    // Arrange
    const handleClick = jest.fn();
    const text = 'Click me';

    // Act
    render(<Button onClick={handleClick}>{text}</Button>);
    fireEvent.click(screen.getByRole('button'));

    // Assert
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('no llama al onClick cuando está deshabilitado', () => {
    // Arrange
    const handleClick = jest.fn();
    const text = 'Disabled';

    // Act
    render(<Button disabled onClick={handleClick}>{text}</Button>);
    fireEvent.click(screen.getByRole('button'));

    // Assert
    expect(handleClick).not.toHaveBeenCalled();
  });

  it('renderiza iconos correctamente', () => {
    // Arrange
    const leftIcon = <span data-testid="left-icon">←</span>;
    const rightIcon = <span data-testid="right-icon">→</span>;

    // Act
    render(
      <Button leftIcon={leftIcon} rightIcon={rightIcon}>
        With Icons
      </Button>
    );

    // Assert
    expect(screen.getByTestId('left-icon')).toBeInTheDocument();
    expect(screen.getByTestId('right-icon')).toBeInTheDocument();
  });
}); 