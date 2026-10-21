import { getAvailableVersions } from '../services/versions.service.js';

export async function listVersions(req, res) {
  const availableVersions = await getAvailableVersions();

  return res.status(200).json({
    message: 'Available versions fetched.',
    versions: availableVersions,
  });
}
