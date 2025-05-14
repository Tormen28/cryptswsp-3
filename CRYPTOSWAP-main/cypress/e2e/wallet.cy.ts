describe('Wallet Integration', () => {
  beforeEach(() => {
    cy.visit('/');
  });

  it('debería mostrar el botón de conectar wallet cuando no hay conexión', () => {
    cy.get('[data-testid="connect-wallet-button"]').should('be.visible');
    cy.get('[data-testid="wallet-address"]').should('not.exist');
  });

  it('debería mostrar el modal de selección de wallet al hacer clic en conectar', () => {
    cy.get('[data-testid="connect-wallet-button"]').click();
    cy.get('[data-testid="wallet-modal"]').should('be.visible');
  });

  it('debería mostrar la dirección de la wallet después de conectar', () => {
    // Simular conexión con Phantom
    cy.window().then((win) => {
      win.solana = {
        isPhantom: true,
        connect: () => Promise.resolve({ publicKey: { toString: () => 'mockAddress' } }),
      };
    });

    cy.get('[data-testid="connect-wallet-button"]').click();
    cy.get('[data-testid="wallet-modal"]').contains('Phantom').click();
    cy.get('[data-testid="wallet-address"]').should('be.visible');
  });

  it('debería mostrar el balance después de conectar', () => {
    // Simular conexión y balance
    cy.window().then((win) => {
      win.solana = {
        isPhantom: true,
        connect: () => Promise.resolve({ publicKey: { toString: () => 'mockAddress' } }),
      };
    });

    cy.get('[data-testid="connect-wallet-button"]').click();
    cy.get('[data-testid="wallet-modal"]').contains('Phantom').click();
    cy.get('[data-testid="wallet-balance"]').should('be.visible');
  });

  it('debería desconectar la wallet correctamente', () => {
    // Simular conexión
    cy.window().then((win) => {
      win.solana = {
        isPhantom: true,
        connect: () => Promise.resolve({ publicKey: { toString: () => 'mockAddress' } }),
        disconnect: () => Promise.resolve(),
      };
    });

    cy.get('[data-testid="connect-wallet-button"]').click();
    cy.get('[data-testid="wallet-modal"]').contains('Phantom').click();
    cy.get('[data-testid="disconnect-wallet-button"]').click();
    cy.get('[data-testid="connect-wallet-button"]').should('be.visible');
  });
}); 