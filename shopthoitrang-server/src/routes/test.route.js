const express = require('express');
const router = express.Router();
const phieunhapkhoService = require('../services/phieunhapkho.service');

// Test endpoint để force check purchase order completion
router.post('/test-completion/:purchaseOrderId', async (req, res) => {
  try {
    const purchaseOrderId = req.params.purchaseOrderId;
    console.log('=== MANUAL TEST COMPLETION ===');
    console.log('Testing completion for purchase order:', purchaseOrderId);
    
    await phieunhapkhoService.checkPurchaseOrderCompletion(purchaseOrderId);
    
    res.json({ 
      message: 'Test completion check completed. Check console logs for details.',
      purchaseOrderId 
    });
  } catch (error) {
    console.error('Error in test completion:', error);
    res.status(500).json({ 
      error: error.message,
      purchaseOrderId: req.params.purchaseOrderId 
    });
  }
});

// Test endpoint để force process approval for receipt
router.post('/test-approval/:receiptId', async (req, res) => {
  try {
    const receiptId = req.params.receiptId;
    console.log('=== MANUAL TEST APPROVAL ===');
    console.log('Testing approval for receipt:', receiptId);
    
    const receipt = await phieunhapkhoService.get(receiptId);
    await phieunhapkhoService.processApproval(receiptId, receipt);
    
    res.json({ 
      message: 'Test approval completed. Check console logs for details.',
      receiptId 
    });
  } catch (error) {
    console.error('Error in test approval:', error);
    res.status(500).json({ 
      error: error.message,
      receiptId: req.params.receiptId 
    });
  }
});

module.exports = router;