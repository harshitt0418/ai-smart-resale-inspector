/**
 * routes/detection.routes.js
 *
 * Mounts detection endpoints under /api/detect (registered in app.js).
 *
 *  POST /api/detect/item   — YOLOv8 item identification
 */

const { Router }               = require('express');
const { detectItemController,
        detectDamageController } = require('../controllers/detection.controller');

const router = Router();

router.post('/item',   detectItemController);
router.post('/damage', detectDamageController);

module.exports = router;
