require('dotenv').config();

describe('first test', () => {
  test('equal', () => {
    expect(1).not.toBe(9);
    expect(process.env.NODE_KEY).toBe('4');
  });
});
