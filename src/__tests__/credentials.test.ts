import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import * as fs from 'fs';
import keytar from 'keytar';
import { getCredentials, saveCredentials, deleteCredentials } from '../lib/credentials.js';

// Mock fs and keytar
vi.mock('fs');
vi.mock('keytar', () => ({
  default: {
    getPassword: vi.fn(),
    setPassword: vi.fn(),
    deletePassword: vi.fn(),
  }
}));

describe('credentials storage', () => {
  beforeEach(() => {
    vi.resetAllMocks();
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('should prefer keytar secure storage', async () => {
    const mockCreds = { token: 'secret', email: 'test@example.com', api_url: 'http://foo' };
    vi.mocked(keytar.getPassword).mockResolvedValueOnce(JSON.stringify(mockCreds));
    
    // Legacy file mock, shouldn't be read!
    vi.mocked(fs.existsSync).mockReturnValue(true);

    const creds = await getCredentials();
    
    expect(creds).toEqual(mockCreds);
    expect(keytar.getPassword).toHaveBeenCalledWith('lazy-raccoon', 'cli-config');
    expect(fs.readFileSync).not.toHaveBeenCalled();
  });

  it('should fallback to legacy file and migrate if keytar throws or returns null', async () => {
    const mockCreds = { token: 'plain', email: 'test@example.com', api_url: 'http://foo' };
    vi.mocked(keytar.getPassword).mockRejectedValueOnce(new Error('no keyring'));
    
    vi.mocked(fs.existsSync).mockReturnValue(true);
    vi.mocked(fs.readFileSync).mockReturnValue(JSON.stringify(mockCreds));

    const creds = await getCredentials();

    expect(creds).toEqual(mockCreds);
    expect(fs.readFileSync).toHaveBeenCalled();
    // It should attempt to save it securely
    expect(keytar.setPassword).toHaveBeenCalledWith('lazy-raccoon', 'cli-config', JSON.stringify(mockCreds));
    // It should delete the plaintext file
    expect(fs.unlinkSync).toHaveBeenCalled();
  });

  it('should save to keytar and delete plaintext json', async () => {
    const mockCreds = { token: 'new', email: 'test@example.com', api_url: 'http://foo' };
    vi.mocked(fs.existsSync).mockReturnValue(true); // simulate existing plain text to test deletion

    await saveCredentials(mockCreds);

    expect(keytar.setPassword).toHaveBeenCalledWith('lazy-raccoon', 'cli-config', JSON.stringify(mockCreds));
    expect(fs.unlinkSync).toHaveBeenCalled();
  });

  it('should delete from both secure storage and plaintext', async () => {
    vi.mocked(fs.existsSync).mockReturnValue(true);

    await deleteCredentials();

    expect(keytar.deletePassword).toHaveBeenCalledWith('lazy-raccoon', 'cli-config');
    expect(fs.unlinkSync).toHaveBeenCalled();
  });
});
