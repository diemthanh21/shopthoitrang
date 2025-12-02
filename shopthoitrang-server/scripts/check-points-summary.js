require('dotenv').config();
const membershipService = require('../src/services/membership.service');

async function main(){
  const ids = [11,14];
  for (const id of ids){
    const summary = await membershipService.getPointsSummary(id);
    console.log(`KH ${id}:`, summary);
  }
}

main().then(()=>process.exit(0)).catch(e=>{console.error(e);process.exit(1)});
