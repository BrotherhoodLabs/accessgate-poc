// Test simple pour vérifier que Jest fonctionne
describe('Simple Test', () => {
  it('should pass a basic test', () => {
    expect(1 + 1).toBe(2);
  });

  it('should handle strings correctly', () => {
    expect('hello').toContain('hello');
  });

  it('should handle arrays correctly', () => {
    const arr = [1, 2, 3];
    expect(arr).toHaveLength(3);
    expect(arr).toContain(2);
  });
});
