describe('Smoke test', () => {
  it('loads the home page', () => {
    cy.visit('/');
    // Check for a common element on your homepage. Adjust as needed.
    cy.contains('Home').should('exist');
  });
});
