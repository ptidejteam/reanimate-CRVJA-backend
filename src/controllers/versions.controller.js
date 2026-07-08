import { fetchAvailableVersions } from '../services/versions.service.js';

export async function handleVersions(req, res) {
  const availableVersions = await fetchAvailableVersions();

  return res.status(200).json({
    message: 'Available versions fetched.',
    data: availableVersions
  });
};