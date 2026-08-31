import { Router } from 'express';
import { LOCATION_PROFILES, COUNTRIES } from '../data/locations.js';
import { SOURCE_TYPES, SCENARIO_IDS } from '../config/constants.js';
const router = Router();
const DEVICES = [
  { id: 'android-mobile', label: 'Android Mobile', os: 'Android', category: 'mobile' },
  { id: 'android-tablet', label: 'Android Tablet', os: 'Android', category: 'tablet' },
  { id: 'ios-mobile', label: 'iOS Mobile', os: 'iOS', category: 'mobile' },
  { id: 'desktop-chrome', label: 'Desktop Chrome', os: 'Windows', category: 'desktop' },
];
router.get('/devices', (_req, res) => { res.json(DEVICES); });
router.get('/locations', (_req, res) => { res.json(LOCATION_PROFILES); });
router.get('/sources', (_req, res) => { res.json(SOURCE_TYPES.map((id) => ({ id, label: id }))); });
router.get('/scenarios', (_req, res) => { res.json(SCENARIO_IDS.map((id) => ({ id, label: id }))); });
router.get('/countries', (_req, res) => { res.json(COUNTRIES); });
export default router;
