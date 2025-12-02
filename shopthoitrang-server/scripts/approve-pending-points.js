/**
 * Scheduled Job: Duyệt điểm pending sau 7 ngày
 * 
 * Job này nên chạy hàng ngày (hoặc mỗi vài giờ) để kiểm tra
 * và duyệt các điểm pending đã đủ 7 ngày.
 * 
 * Cách chạy:
 * 1. Tự động: Setup cron job trên server (Linux: crontab, Windows: Task Scheduler)
 * 2. Manual: node scripts/approve-pending-points.js
 * 3. API endpoint: POST /api/membership/approve-pending-points (admin only)
 */

const membershipService = require('../src/services/membership.service');

async function approvePendingPoints() {
  console.log('[ApprovePendingPoints] Bắt đầu kiểm tra điểm pending...');
  console.log('[ApprovePendingPoints] Thời gian:', new Date().toISOString());

  try {
    const result = await membershipService.releasePendingPoints(new Date());
    
    console.log('[ApprovePendingPoints] Kết quả:');
    console.log(`  - Đã duyệt: ${result.released} giao dịch`);
    console.log(`  - Đã hủy: ${result.cancelled} giao dịch`);
    console.log('[ApprovePendingPoints] Hoàn thành!');
    
    return result;
  } catch (error) {
    console.error('[ApprovePendingPoints] Lỗi:', error);
    throw error;
  }
}

// Chạy nếu gọi trực tiếp từ command line
if (require.main === module) {
  approvePendingPoints()
    .then(() => {
      console.log('Job hoàn thành thành công');
      process.exit(0);
    })
    .catch(err => {
      console.error('Job thất bại:', err);
      process.exit(1);
    });
}

module.exports = approvePendingPoints;
